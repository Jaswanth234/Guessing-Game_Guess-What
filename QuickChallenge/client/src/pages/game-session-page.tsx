import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Countdown } from "@/components/ui/countdown";
import { Loader2 } from "lucide-react";

interface GameSessionParams {
  code: string;
}

interface GameSession {
  id: number;
  subject: string;
  section: string;
  gameMode: "single_entry" | "multi_choice";
  occasionName?: string;
  startTime: string;
  endTime: string;
  hostId: number;
}

interface Question {
  id: number;
  gameSessionId: number;
  questionText: string;
  options?: string[];
  position: number;
}

interface Host {
  id: number;
  name: string;
}

interface Player {
  id: number;
  name: string;
  gameSessionId: number;
  joinedAt: string;
}

export default function GameSessionPage() {
  const params = useParams<GameSessionParams>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Player state
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [playerJoined, setPlayerJoined] = useState(false);
  
  // Game state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number[]>>({});
  const [gameEnded, setGameEnded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch game details
  const { data: game, isLoading: loadingGame, error: gameError } = useQuery<GameSession>({
    queryKey: [`/api/games/code/${params.code}`],
    onError: (error) => {
      toast({
        title: "Error loading game",
        description: "This game does not exist or has expired.",
        variant: "destructive",
      });
    },
  });
  
  // Fetch game host
  const { data: host } = useQuery<Host>({
    queryKey: [`/api/host/${game?.hostId}`],
    enabled: !!game,
  });
  
  // Fetch questions when player has joined
  const { 
    data: questions, 
    isLoading: loadingQuestions,
    error: questionsError
  } = useQuery<Question[]>({
    queryKey: [`/api/games/${game?.id}/questions`],
    enabled: !!game && playerJoined,
  });
  
  // Join game mutation
  const joinGameMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!game) throw new Error("Game not found");
      
      const res = await apiRequest("POST", `/api/games/${game.id}/join`, { name });
      return await res.json();
    },
    onSuccess: (data: Player) => {
      setPlayerId(data.id);
      setPlayerJoined(true);
      toast({
        title: "Joined successfully",
        description: `Welcome to the game, ${data.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error joining game",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number, answer: string | number[] }) => {
      if (!playerId) throw new Error("Player not found");
      
      const res = await apiRequest("POST", `/api/players/${playerId}/answers`, {
        questionId,
        answer,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Check if there are more questions
      if (questions && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Finished all questions
        setGameEnded(true);
        navigate(`/winners/${game?.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error submitting answer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle game end
  const handleGameEnd = () => {
    setGameEnded(true);
    toast({
      title: "Game has ended",
      description: "Time's up! Your current answers have been submitted.",
    });
    
    // Submit current answer if user hasn't submitted it yet
    const currentQuestion = questions?.[currentQuestionIndex];
    if (currentQuestion && !submitting && answers[currentQuestion.id]) {
      submitAnswerMutation.mutate({
        questionId: currentQuestion.id,
        answer: answers[currentQuestion.id]
      });
    }
    
    // Redirect to winners page
    if (game) {
      setTimeout(() => {
        navigate(`/winners/${game.id}`);
      }, 2000);
    }
  };
  
  // Handle join game
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the game",
        variant: "destructive",
      });
      return;
    }
    
    joinGameMutation.mutate(playerName);
  };
  
  // Handle answer change for single entry
  const handleSingleEntryChange = (value: string) => {
    if (!questions) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
  };
  
  // Handle answer change for multi-choice
  const handleMultiChoiceChange = (optionIndex: number, checked: boolean) => {
    if (!questions) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    let currentAnswers = (answers[currentQuestion.id] || []) as number[];
    
    if (checked) {
      // Add to selected options
      currentAnswers = [...currentAnswers, optionIndex];
    } else {
      // Remove from selected options
      currentAnswers = currentAnswers.filter(idx => idx !== optionIndex);
    }
    
    setAnswers({
      ...answers,
      [currentQuestion.id]: currentAnswers
    });
  };
  
  // Handle single option selection for radio button style
  const handleRadioChange = (optionIndex: number) => {
    if (!questions) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [currentQuestion.id]: [optionIndex]
    });
  };
  
  // Submit current answer
  const handleSubmitAnswer = () => {
    if (!questions || submitting) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    // Check if answer is provided
    if (!answers[currentQuestion.id]) {
      toast({
        title: "No answer provided",
        description: "Please provide an answer before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer: answers[currentQuestion.id]
    });
    
    setTimeout(() => {
      setSubmitting(false);
    }, 1000);
  };
  
  // Check if game has started
  const isGameActive = () => {
    if (!game) return false;
    
    const now = new Date();
    const startTime = new Date(game.startTime);
    const endTime = new Date(game.endTime);
    
    return now >= startTime && now <= endTime;
  };
  
  // Check if current question has an answer
  const hasCurrentAnswer = () => {
    if (!questions) return false;
    
    const currentQuestion = questions[currentQuestionIndex];
    return !!answers[currentQuestion.id];
  };
  
  if (loadingGame) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading game session...</p>
        </div>
      </div>
    );
  }
  
  if (gameError || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <h1 className="text-xl font-bold text-red-500 mb-4">Game Not Found</h1>
            <p className="text-gray-600 mb-4">
              This game session doesn't exist or has expired.
            </p>
            <Button onClick={() => navigate('/join')}>
              Go to Join Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Game exists but hasn't started yet
  if (!isGameActive() && !gameEnded) {
    const startTime = new Date(game.startTime);
    const now = new Date();
    
    if (startTime > now) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <h1 className="text-xl font-bold text-primary mb-4">Game Will Start Soon</h1>
              <p className="text-gray-600 mb-4">
                This game is scheduled to start at{' '}
                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' '}on{' '}
                {startTime.toLocaleDateString()}.
              </p>
              {!playerJoined ? (
                <form onSubmit={handleJoinGame}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Your Name
                    </label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name to pre-register"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={joinGameMutation.isPending}
                  >
                    {joinGameMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Pre-register for Game
                  </Button>
                </form>
              ) : (
                <div className="bg-green-50 p-4 rounded text-green-700">
                  <p className="font-medium">You're all set, {playerName}!</p>
                  <p className="text-sm">Return here when the game starts.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // Game has ended
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <h1 className="text-xl font-bold text-gray-800 mb-4">Game Has Ended</h1>
              <p className="text-gray-600 mb-4">
                This game session has already ended.
              </p>
              <Button onClick={() => navigate(`/winners/${game.id}`)}>
                View Results
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }
  
  // Game is active
  if (!playerJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <h1 className="text-xl font-bold text-primary mb-4">{game.subject}: {game.section}</h1>
            {game.occasionName && (
              <p className="text-gray-600 mb-2">Occasion: {game.occasionName}</p>
            )}
            <p className="text-gray-600 mb-4">
              This game is currently active. Join now to participate!
            </p>
            <form onSubmit={handleJoinGame}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Your Name
                </label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name to join"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={joinGameMutation.isPending}
              >
                {joinGameMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Join Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading questions
  if (loadingQuestions || !questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }
  
  // Game session with questions
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="py-12 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-primary to-secondary-500 text-white">
            <div className="flex flex-wrap justify-between items-center">
              <h3 className="text-xl font-medium font-poppins">{game.subject}: {game.section}</h3>
              <div className="flex items-center space-x-2 text-sm">
                <span className="material-icons text-accent-500">person</span>
                <span>Host: {host?.name || "Unknown"}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row mb-6">
              <div className="md:w-1/2 mb-4 md:mb-0 md:pr-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-500">Subject</div>
                  <div className="text-sm font-medium">{game.subject}</div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-500">Section</div>
                  <div className="text-sm font-medium">{game.section}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Game Mode</div>
                  <div className="text-sm font-medium">
                    {game.gameMode === "single_entry" ? "Single Entry" : "Multi-Choice"}
                  </div>
                </div>
                {game.occasionName && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-500">Occasion</div>
                    <div className="text-sm font-medium">{game.occasionName}</div>
                  </div>
                )}
              </div>
              
              <div className="md:w-1/2 md:pl-4 flex flex-col items-center justify-center">
                <div className="relative h-20 w-20 mb-2">
                  <Countdown 
                    endTime={new Date(game.endTime)} 
                    onComplete={handleGameEnd}
                  />
                </div>
                <div className="text-sm text-gray-600">Time Remaining</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>
              
              <div className="text-lg font-medium mb-6">{currentQuestion.questionText}</div>
              
              {game.gameMode === "single_entry" ? (
                // Single Entry Mode
                <div className="mb-6">
                  <Input
                    placeholder="Type your answer here"
                    value={(answers[currentQuestion.id] || "") as string}
                    onChange={(e) => handleSingleEntryChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              ) : (
                // Multi-Choice Mode
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <div 
                      key={`option-${index}`} 
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRadioChange(index)}
                    >
                      <RadioGroup
                        value={
                          Array.isArray(answers[currentQuestion.id]) && 
                          (answers[currentQuestion.id] as number[]).includes(index) ? 
                            index.toString() : ""
                        }
                        onValueChange={(value) => handleRadioChange(parseInt(value))}
                        className="w-full"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="w-full cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8">
                <Button 
                  className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary/90 transition"
                  onClick={handleSubmitAnswer}
                  disabled={!hasCurrentAnswer() || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
