import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Quiz, QuizStatus } from "@shared/schema";
import QRCodeShare from "./qr-code-share";

type Question = {
  id: string;
  text: string;
  answers: string[];
  correctAnswers: number[];
  isDecoy?: boolean[];
  selectionType: "single" | "multiple" | "dropdown";
};

export default function HostDashboard() {
  const { toast } = useToast();
  
  // Quiz creation form state
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [gameMode, setGameMode] = useState<"single" | "multi">("single");
  const [prizes, setPrizes] = useState<string>("3");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      text: "",
      answers: gameMode === "single" ? [""] : ["", "", "", ""],
      correctAnswers: [],
      isDecoy: gameMode === "single" ? [] : [false, false, false, false],
      selectionType: gameMode === "single" ? "single" : "multiple",
    },
  ]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  
  // Reconduct quiz state
  const [showReconductModal, setShowReconductModal] = useState(false);
  const [reconductQuiz, setReconductQuiz] = useState<Quiz | null>(null);
  const [reconductStartTime, setReconductStartTime] = useState("");
  const [reconductEndTime, setReconductEndTime] = useState("");

  // Fetch quizzes
  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const res = await apiRequest("POST", "/api/quizzes", quizData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz Created",
        description: "Your quiz has been created successfully.",
      });
      resetForm();
      setCurrentQuizId(data.id);
      setShowShareModal(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add a new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        text: "",
        answers: gameMode === "single" ? [""] : ["", "", "", ""],
        correctAnswers: [],
        isDecoy: gameMode === "single" ? [] : [false, false, false, false],
        selectionType: gameMode === "single" ? "single" : "multiple",
      },
    ]);
  };

  // Remove a question
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // Update question text
  const updateQuestionText = (id: string, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, text } : q
      )
    );
  };

  // Update question answers
  const updateQuestionAnswer = (id: string, answerIndex: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const newAnswers = [...q.answers];
          newAnswers[answerIndex] = value;
          return { ...q, answers: newAnswers };
        }
        return q;
      })
    );
  };

  // Update correct answer for multi-choice mode
  const updateCorrectAnswer = (id: string, answerIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          return { ...q, correctAnswers: [answerIndex] };
        }
        return q;
      })
    );
  };
  
  // Toggle decoy status for an answer option
  const toggleDecoy = (id: string, answerIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const decoys = q.isDecoy || Array(q.answers.length).fill(false);
          const newDecoys = [...decoys];
          newDecoys[answerIndex] = !newDecoys[answerIndex];
          
          // Don't allow marking the correct answer as a decoy
          if (q.correctAnswers.includes(answerIndex) && newDecoys[answerIndex]) {
            return q;
          }
          
          return { ...q, isDecoy: newDecoys };
        }
        return q;
      })
    );
  };
  
  // Update question selection type
  const updateSelectionType = (id: string, type: "single" | "multiple" | "dropdown") => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          return { ...q, selectionType: type };
        }
        return q;
      })
    );
  };

  // Add option for multi-choice questions
  const addOption = (id: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          return { ...q, answers: [...q.answers, ""] };
        }
        return q;
      })
    );
  };

  // Handle game mode change
  useEffect(() => {
    if (gameMode === "single") {
      setQuestions(
        questions.map((q) => ({
          ...q,
          answers: q.answers.length ? q.answers : [""],
          correctAnswers: [],
          isDecoy: [],
          selectionType: "single"
        }))
      );
    } else {
      setQuestions(
        questions.map((q) => {
          const newAnswers = q.answers.length >= 4 ? q.answers : ["", "", "", ""];
          return {
            ...q,
            answers: newAnswers,
            correctAnswers: [],
            isDecoy: Array(newAnswers.length).fill(false),
            selectionType: "multiple"
          };
        })
      );
    }
  }, [gameMode]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!subject || !section || !startTime || !endTime || questions.some(q => !q.text)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create quiz data
    const quizData = {
      subject,
      section,
      gameMode,
      numPrizes: parseInt(prizes),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      questions: questions.map(q => ({
        text: q.text,
        answers: q.answers,
        correctAnswers: q.correctAnswers,
        isDecoy: q.isDecoy || [],
        selectionType: q.selectionType || (gameMode === "single" ? "single" : "multiple"),
      })),
    };

    createQuizMutation.mutate(quizData);
  };

  // Reset form after submission
  const resetForm = () => {
    setSubject("");
    setSection("");
    setGameMode("single");
    setPrizes("3");
    setStartTime("");
    setEndTime("");
    setQuestions([
      {
        id: crypto.randomUUID(),
        text: "",
        answers: gameMode === "single" ? [""] : ["", "", "", ""],
        correctAnswers: [],
        isDecoy: gameMode === "single" ? [] : [false, false, false, false],
        selectionType: gameMode === "single" ? "single" : "multiple",
      },
    ]);
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case QuizStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case QuizStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case QuizStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get time remaining for active quizzes
  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    
    if (diff <= 0) return "Ended";
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle reconduct quiz
  const handleReconductQuiz = (quiz: Quiz) => {
    setReconductQuiz(quiz);
    
    // Set default dates (current time + 5 minutes for start, +15 minutes for end)
    const now = new Date();
    const startDate = new Date(now.getTime() + 5 * 60000);
    const endDate = new Date(now.getTime() + 15 * 60000);
    
    // Format dates for datetime-local input
    const formatDate = (date: Date) => {
      return date.toISOString().slice(0, 16);
    };
    
    setReconductStartTime(formatDate(startDate));
    setReconductEndTime(formatDate(endDate));
    setShowReconductModal(true);
  };
  
  // Submit reconduct quiz
  const submitReconductQuiz = () => {
    if (!reconductQuiz || !reconductStartTime || !reconductEndTime) {
      toast({
        title: "Validation Error",
        description: "Please select valid start and end times.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new quiz with same data but new times
    const quizData = {
      subject: reconductQuiz.subject,
      section: reconductQuiz.section,
      gameMode: reconductQuiz.gameMode,
      numPrizes: reconductQuiz.numPrizes,
      startTime: new Date(reconductStartTime).toISOString(),
      endTime: new Date(reconductEndTime).toISOString(),
      questions: reconductQuiz.questions.map(q => ({
        text: q.text,
        answers: q.answers,
        correctAnswers: q.correctAnswers,
        isDecoy: q.isDecoy || [],
        selectionType: q.selectionType || (reconductQuiz.gameMode === "single" ? "single" : "multiple"),
      })),
    };
    
    createQuizMutation.mutate(quizData);
    setShowReconductModal(false);
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-foreground">Host Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create and manage your quiz sessions</p>

      {/* Quiz Creation Section */}
      <div className="mt-6 shadow sm:rounded-md">
        <div className="bg-card px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-foreground">Create a New Quiz</h2>
          
          <form className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" onSubmit={handleSubmit}>
            <div className="sm:col-span-3">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science, History, General Knowledge"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="section">Section</Label>
              <Input 
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Biology, World War II, Sports"
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="game-mode">Game Mode</Label>
              <Select 
                value={gameMode} 
                onValueChange={(value) => setGameMode(value as "single" | "multi")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Game Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Entry Mode (Type Answer)</SelectItem>
                  <SelectItem value="multi">Multi-Choice Mode (Multiple Options)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="prizes">Number of Prizes</Label>
              <Select value={prizes} onValueChange={setPrizes}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Number of Prizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Prize Only</SelectItem>
                  <SelectItem value="2">1st and 2nd Prizes</SelectItem>
                  <SelectItem value="3">1st, 2nd, and 3rd Prizes</SelectItem>
                  <SelectItem value="4">1st through 4th Prizes</SelectItem>
                  <SelectItem value="5">1st through 5th Prizes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="start-time">Start Time</Label>
              <Input 
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="end-time">End Time</Label>
              <Input 
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Question Section - toggles based on game mode */}
            <div className="sm:col-span-6">
              <Label>
                Questions & Answers ({gameMode === "single" ? "Single Entry Mode" : "Multi-Choice Mode"})
              </Label>
              <div className="mt-1 border rounded-md p-4 bg-secondary/20">
                {questions.map((question, index) => (
                  <div key={question.id} className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Question {index + 1}</h3>
                      {questions.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => removeQuestion(question.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Enter your question"
                        value={question.text}
                        onChange={(e) => updateQuestionText(question.id, e.target.value)}
                      />
                    </div>
                    
                    {gameMode === "single" ? (
                      <div className="mt-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Acceptable Answers (comma separated)
                        </Label>
                        <Input
                          className="mt-1"
                          placeholder="e.g. Mount Everest, Everest, Mt. Everest"
                          value={question.answers[0] || ""}
                          onChange={(e) => updateQuestionAnswer(question.id, 0, e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 space-y-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">
                            Answer Selection Type
                          </Label>
                          <Select 
                            value={question.selectionType} 
                            onValueChange={(value) => updateSelectionType(
                              question.id, 
                              value as "single" | "multiple" | "dropdown"
                            )}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select answer type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Radio (Single Selection)</SelectItem>
                              <SelectItem value="multiple">Checkboxes (Multiple Selection)</SelectItem>
                              <SelectItem value="dropdown">Dropdown Menu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          {question.answers.map((answer, answerIndex) => {
                            const isDecoy = question.isDecoy?.[answerIndex] || false;
                            
                            return (
                              <div key={answerIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`q${question.id}-correct`}
                                  value={answerIndex}
                                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                  checked={question.correctAnswers.includes(answerIndex)}
                                  onChange={() => updateCorrectAnswer(question.id, answerIndex)}
                                />
                                
                                <Input
                                  placeholder={`Option ${answerIndex + 1}`}
                                  className={`flex-1 ${isDecoy ? 'border-orange-300 bg-orange-50' : ''}`}
                                  value={answer}
                                  onChange={(e) => updateQuestionAnswer(question.id, answerIndex, e.target.value)}
                                />
                                
                                <Button
                                  type="button"
                                  variant={isDecoy ? "destructive" : "outline"}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => toggleDecoy(question.id, answerIndex)}
                                  disabled={question.correctAnswers.includes(answerIndex)}
                                  title={question.correctAnswers.includes(answerIndex) ? 
                                    "Cannot mark correct answer as decoy" : 
                                    (isDecoy ? "Remove decoy" : "Mark as decoy")}
                                >
                                  {isDecoy ? "Decoy" : "Mark Decoy"}
                                </Button>
                              </div>
                            );
                          })}
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary-700"
                            onClick={() => addOption(question.id)}
                          >
                            + Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addQuestion}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="-ml-0.5 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Question
                </Button>
              </div>
            </div>

            <div className="sm:col-span-6">
              <Button
                type="submit"
                className="w-full"
                disabled={createQuizMutation.isPending}
              >
                {createQuizMutation.isPending ? "Creating Quiz..." : "Create Quiz"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Quiz Sessions Section */}
      <div className="mt-10">
        <h2 className="text-lg font-medium text-foreground mb-5">Your Quiz Sessions</h2>
        
        {isLoading ? (
          <div className="text-center py-6">Loading your quizzes...</div>
        ) : quizzes && quizzes.length > 0 ? (
          <div className="bg-card shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <a href={`/quiz/${quiz.id}`} className="block hover:bg-accent/30">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                            ${quiz.status === QuizStatus.ACTIVE ? 'bg-primary-100 text-primary-600' :
                            quiz.status === QuizStatus.SCHEDULED ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'}`}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-1.17 1.025-3.07 1.025-4.242 0-1.172-1.025-1.172-2.687 0-3.712z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-1.17 1.025-3.07 1.025-4.242 0-1.172-1.025-1.172-2.687 0-3.712z"
                              />
                            </svg>
                          </div>
                          <p className={`ml-3 text-sm font-medium truncate
                            ${quiz.status === QuizStatus.ACTIVE ? 'text-primary-600' :
                            quiz.status === QuizStatus.SCHEDULED ? 'text-blue-600' :
                            'text-foreground'}`}>
                            {quiz.subject}: {quiz.section}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(quiz.status)}`}>
                            {quiz.status}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-900"
                            onClick={(e) => {
                              e.preventDefault();
                              handleReconductQuiz(quiz);
                            }}
                          >
                            Reconduct
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            onClick={(e) => {
                              e.preventDefault();
                              if (window.confirm('Are you sure you want to delete this quiz?')) {
                                apiRequest('DELETE', `/api/quizzes/${quiz.id}`)
                                  .then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
                                    toast({
                                      title: "Quiz Deleted",
                                      description: "The quiz has been deleted successfully.",
                                    });
                                  })
                                  .catch((error) => {
                                    toast({
                                      title: "Error",
                                      description: error.message,
                                      variant: "destructive",
                                    });
                                  });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-muted-foreground">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                              />
                            </svg>
                            {Array.isArray(quiz.participants) ? quiz.participants.length : 0} participants
                          </p>
                          <p className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0 sm:ml-6">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                              />
                            </svg>
                            {quiz.gameMode === "single" ? "Single Entry Mode" : "Multi-Choice Mode"}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0">
                          {quiz.status === QuizStatus.ACTIVE ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <p>
                                Ends in <span className="text-primary font-semibold">{getTimeRemaining(quiz.endTime.toString())}</span>
                              </p>
                            </>
                          ) : quiz.status === QuizStatus.COMPLETED ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                />
                              </svg>
                              <p>
                                Ended on <span className="font-medium">{formatDate(quiz.endTime.toString())}</span>
                              </p>
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                />
                              </svg>
                              <p>
                                Starts on <span className="font-medium">{formatDate(quiz.startTime.toString())}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">You haven't created any quizzes yet.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create your first quiz above!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Share Modal */}
      {showShareModal && currentQuizId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-4xl mx-4">
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2"
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </Button>
              <QRCodeShare quizId={currentQuizId} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reconduct Quiz Modal */}
      {showReconductModal && reconductQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Reconduct Quiz</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-muted-foreground"
                  onClick={() => setShowReconductModal(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reconduct-quiz-name" className="text-sm font-medium text-foreground">
                    Quiz
                  </Label>
                  <div id="reconduct-quiz-name" className="mt-1 text-sm text-gray-900 font-medium">
                    {reconductQuiz.subject}: {reconductQuiz.section}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {reconductQuiz.gameMode === "single" ? "Single Entry Mode" : "Multi-Choice Mode"} · 
                    {reconductQuiz.questions.length} question{reconductQuiz.questions.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="reconduct-start-time" className="text-sm font-medium text-foreground">
                    New Start Time
                  </Label>
                  <Input
                    id="reconduct-start-time"
                    type="datetime-local"
                    value={reconductStartTime}
                    onChange={(e) => setReconductStartTime(e.target.value)}
                    className="mt-1 block w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reconduct-end-time" className="text-sm font-medium text-foreground">
                    New End Time
                  </Label>
                  <Input
                    id="reconduct-end-time"
                    type="datetime-local"
                    value={reconductEndTime}
                    onChange={(e) => setReconductEndTime(e.target.value)}
                    className="mt-1 block w-full"
                  />
                </div>
                
                <div className="pt-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={submitReconductQuiz}
                    disabled={createQuizMutation.isPending}
                  >
                    {createQuizMutation.isPending ? "Creating..." : "Reconduct Quiz"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
