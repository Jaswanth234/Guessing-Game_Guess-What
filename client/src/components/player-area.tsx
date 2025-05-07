import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Quiz, QuizStatus } from "@shared/schema";

export default function PlayerArea() {
  const { toast } = useToast();
  const { id } = useParams();
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // Set up WebSocket connection
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    window.location.origin.replace(/^http/, 'ws'),
    {
      onOpen: () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        
        // If we have a quiz ID, join the quiz room
        if (id) {
          sendMessage({
            type: 'join-quiz',
            payload: {
              quizId: parseInt(id),
              isHost: false
            }
          });
        }
      },
      onMessage: (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'time-update' && id && data.payload.quizId === parseInt(id)) {
            // Update time remaining
            const ms = data.payload.timeLeft;
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((ms % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
          } else if (data.type === 'quiz-updated' && id) {
            // Quiz status was updated, refresh data
            queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      },
      onClose: () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
      },
      onError: () => {
        console.log('WebSocket error');
        setWsConnected(false);
      }
    }
  );

  // Fetch quiz data
  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
    refetchInterval: isActive ? 1000 : false, // Poll actively while quiz is in progress
  });

  // Submit answers mutation
  const submitAnswersMutation = useMutation({
    mutationFn: async (answerData: { playerName: string; answers: string[] }) => {
      if (!id) {
        throw new Error("Quiz ID is missing");
      }
      const res = await apiRequest("POST", `/api/quizzes/${id}/submit`, answerData);
      return await res.json();
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
      }
      toast({
        title: "Answers submitted",
        description: "Your answers have been submitted successfully!",
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Initialize answers array based on quiz questions
  useEffect(() => {
    if (quiz?.questions) {
      setAnswers(Array(quiz.questions.length).fill(""));
    }
  }, [quiz?.questions]);

  // Calculate time left for an active quiz
  useEffect(() => {
    if (!quiz) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(quiz.endTime).getTime();
      const startTime = new Date(quiz.startTime).getTime();
      
      // Quiz hasn't started yet
      if (now < startTime) {
        setIsActive(false);
        setIsCompleted(false);
        
        const diff = startTime - now;
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Starts in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        return;
      }
      
      // Quiz is active
      if (now < endTime) {
        setIsActive(true);
        setIsCompleted(false);
        
        const diff = endTime - now;
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        return;
      }
      
      // Quiz has ended
      setIsActive(false);
      setIsCompleted(true);
      setTimeLeft("Time's up!");
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [quiz]);

  // Handle answer changes
  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  // Handle multi-choice selection
  const handleMultiChoiceSelect = (questionIndex: number, answerIndex: number, selectionType: string) => {
    const newAnswers = [...answers];
    
    if (selectionType === "multiple") {
      // For multiple selection, toggle the selected answer
      const currentAnswers = newAnswers[questionIndex] ? newAnswers[questionIndex].split(',') : [];
      const answerStr = answerIndex.toString();
      
      if (currentAnswers.includes(answerStr)) {
        // Remove if already selected
        const filteredAnswers = currentAnswers.filter(a => a !== answerStr);
        newAnswers[questionIndex] = filteredAnswers.join(',');
      } else {
        // Add if not selected
        currentAnswers.push(answerStr);
        newAnswers[questionIndex] = currentAnswers.join(',');
      }
    } else {
      // For single selection or dropdown
      newAnswers[questionIndex] = answerIndex.toString();
    }
    
    setAnswers(newAnswers);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName && showNameInput) {
      toast({
        title: "Name required",
        description: "Please enter your name to submit answers.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all questions are answered
    const unansweredQuestions = answers.findIndex(a => a === "");
    if (unansweredQuestions !== -1) {
      toast({
        title: "Incomplete answers",
        description: `Please answer question #${unansweredQuestions + 1}.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Prepare submission data
    const answerData = {
      playerName,
      answers,
    };
    
    // If WebSocket is connected, submit via WebSocket for real-time updates
    if (wsConnected && readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'submit-answer',
        payload: {
          quizId: parseInt(id || '0'),
          ...answerData
        }
      });
      
      // Still submit via the API for durability
      submitAnswersMutation.mutate(answerData);
    } else {
      // Fallback to only API if WebSocket not available
      submitAnswersMutation.mutate(answerData);
    }
  };

  // Handle player name submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }
    setShowNameInput(false);
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-3xl mx-auto">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="py-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">Quiz Not Found</h2>
            <p className="mt-2 text-muted-foreground">The quiz you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quiz.status === QuizStatus.COMPLETED || isCompleted) {
    return (
      <div className="py-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">Quiz Completed</h2>
            <p className="mt-2 text-muted-foreground">This quiz has ended. Thank you for participating!</p>
            {isSubmitted && (
              <p className="mt-4 text-primary">Your answers have been submitted successfully.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="py-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-10">
            <h2 className="text-xl font-semibold text-foreground text-center">Join Quiz</h2>
            <p className="mt-2 text-muted-foreground text-center mb-6">
              {quiz.subject}: {quiz.section}
            </p>
            
            <form onSubmit={handleNameSubmit} className="max-w-md mx-auto">
              <div className="mb-4">
                <label htmlFor="playerName" className="block text-sm font-medium text-foreground mb-1">
                  Enter your name
                </label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <Button type="submit" className="w-full">
                Join Quiz
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-3xl mx-auto">
      {/* Game Header */}
      <div className="bg-card shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-primary text-primary-foreground">
          <h3 className="text-lg leading-6 font-medium">{quiz.subject}: {quiz.section}</h3>
          <p className="mt-1 max-w-2xl text-sm">Hosted by {quiz.hostName}</p>
        </div>
        <div className="border-t border-border px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-muted-foreground">
                Subject
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {quiz.subject}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-muted-foreground">
                Section
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {quiz.section}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-muted-foreground">
                Game Mode
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {quiz.gameMode === "single" ? "Single Entry Mode" : "Multi-Choice Mode"}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-muted-foreground">
                Time Remaining
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                <div className="text-primary font-bold text-xl">
                  {timeLeft}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Game Questions */}
      <div className="bg-card shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-border">
          <h3 className="text-lg leading-6 font-medium text-foreground">Quiz Questions</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Answer all questions before submitting</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div key={index} className="bg-secondary/50 px-4 py-5 sm:px-6 rounded-lg">
                  <div className="text-base font-medium text-foreground">
                    {index + 1}. {question.text}
                  </div>
                  <div className="mt-2">
                    {quiz.gameMode === "single" ? (
                      <Input
                        name={`q${index}`}
                        placeholder="Enter your answer"
                        value={answers[index] || ""}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        disabled={isSubmitting || isSubmitted || !isActive}
                      />
                    ) : (
                      <div className="space-y-2">
                        {question.answers.map((option, optionIndex) => {
                          // Determine if this option is selected
                          const currentAnswers = answers[index] ? answers[index].split(',') : [];
                          const isSelected = currentAnswers.includes(optionIndex.toString());
                          
                          return (
                            <div key={optionIndex} className="flex items-center">
                              {question.selectionType === "multiple" ? (
                                <input
                                  type="checkbox"
                                  id={`q${index}-a${optionIndex}`}
                                  name={`q${index}`}
                                  value={optionIndex}
                                  checked={isSelected}
                                  onChange={() => handleMultiChoiceSelect(index, optionIndex, question.selectionType)}
                                  className="h-4 w-4 text-primary border-input focus:ring-primary rounded"
                                  disabled={isSubmitting || isSubmitted || !isActive}
                                />
                              ) : question.selectionType === "dropdown" ? (
                                <select
                                  id={`q${index}-select`}
                                  value={answers[index] || ""}
                                  onChange={(e) => handleMultiChoiceSelect(index, parseInt(e.target.value), question.selectionType)}
                                  className="block w-full pl-3 pr-10 py-2 text-base border-input focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                  disabled={isSubmitting || isSubmitted || !isActive}
                                >
                                  <option value="" disabled>Select an answer</option>
                                  {question.answers.map((opt, idx) => (
                                    <option key={idx} value={idx}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="radio"
                                  id={`q${index}-a${optionIndex}`}
                                  name={`q${index}`}
                                  value={optionIndex}
                                  checked={answers[index] === optionIndex.toString()}
                                  onChange={() => handleMultiChoiceSelect(index, optionIndex, question.selectionType)}
                                  className="h-4 w-4 text-primary border-input focus:ring-primary"
                                  disabled={isSubmitting || isSubmitted || !isActive}
                                />
                              )}
                              
                              {question.selectionType !== "dropdown" && (
                                <label
                                  htmlFor={`q${index}-a${optionIndex}`}
                                  className="ml-3 block text-sm font-medium text-foreground"
                                >
                                  {option}
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || isSubmitted || !isActive}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : isSubmitted
                    ? "Submitted"
                    : "Submit Answers"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
