import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Participant, Quiz, Question, GameMode } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Loader2,
  AlertCircle,
  Timer,
  Check,
  User,
  Mail,
} from 'lucide-react';

// Form schema for participant registration
const participantSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
});

const PlayQuizPage = () => {
  const params = useParams<{ accessCode: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { accessCode } = params;
  
  // State for quiz game
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  
  // WebSocket for real-time communication
  const { 
    status: wsStatus, 
    messages, 
    joinQuiz, 
    submitAnswer,
    clearMessages
  } = useWebSocket(accessCode);
  
  // Timer interval reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form for participant registration
  const form = useForm<z.infer<typeof participantSchema>>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  // Fetch quiz data when component mounts
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/quizzes/${accessCode}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Quiz not found or inactive');
          } else {
            const errorText = await res.text();
            setError(errorText || 'Failed to load quiz');
          }
          return;
        }
        
        const quizData = await res.json();
        setQuiz(quizData);
        
        // Check if quiz is active
        const now = new Date();
        const startTime = new Date(quizData.startTime);
        const endTime = new Date(quizData.endTime);
        
        if (now < startTime) {
          setError(`This quiz hasn't started yet. It will begin on ${startTime.toLocaleString()}`);
          return;
        }
        
        if (now > endTime) {
          setError('This quiz has ended');
          return;
        }
        
        // Calculate time remaining
        const remainingMs = endTime.getTime() - now.getTime();
        setTimeRemaining(Math.floor(remainingMs / 1000));
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
    
    return () => {
      // Clean up timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [accessCode]);
  
  // Process WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      switch (latestMessage.type) {
        case 'QUIZ_JOINED':
          setQuestions(latestMessage.payload.questions);
          break;
          
        case 'ANSWER_SUBMITTED':
          const { isCorrect } = latestMessage.payload;
          toast({
            title: isCorrect ? 'Correct answer!' : 'Incorrect answer',
            description: isCorrect 
              ? 'Good job! Your answer is correct.' 
              : 'Your answer was incorrect.',
            variant: isCorrect ? 'default' : 'destructive',
          });
          
          // Move to next question
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOptions([]);
          }
          break;
          
        case 'QUIZ_ENDED':
          setQuizEnded(true);
          setResults(latestMessage.payload.results);
          setLocation(`/results/${accessCode}`);
          break;
          
        case 'ERROR':
          toast({
            title: 'Error',
            description: latestMessage.payload.message,
            variant: 'destructive',
          });
          break;
      }
    }
    
    // Clear messages after processing
    if (messages.length > 0) {
      clearMessages();
    }
  }, [messages, currentQuestionIndex, questions.length, toast, clearMessages, accessCode, setLocation]);
  
  // Start timer when quiz is loaded
  useEffect(() => {
    if (timeRemaining > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setQuizEnded(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeRemaining, setQuizEnded]);
  
  // Register participant
  const onSubmit = async (values: z.infer<typeof participantSchema>) => {
    try {
      setLoading(true);
      const res = await apiRequest('POST', `/api/quizzes/${accessCode}/join`, values);
      const data = await res.json();
      
      setParticipant(data.participant);
      
      // Join WebSocket room
      if (wsStatus === 'OPEN') {
        joinQuiz(accessCode, data.participant.id);
      } else {
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the quiz session',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to join quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle option selection (multi-choice mode)
  const handleOptionSelect = (optionIndex: number) => {
    // For multi-choice, toggle selection
    if (quiz?.gameMode === GameMode.MULTI_CHOICE) {
      if (selectedOptions.includes(optionIndex)) {
        setSelectedOptions(selectedOptions.filter(idx => idx !== optionIndex));
      } else {
        setSelectedOptions([...selectedOptions, optionIndex]);
      }
    }
  };
  
  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (!participant || !quiz || currentQuestionIndex >= questions.length) return;
    
    const question = questions[currentQuestionIndex];
    let answer;
    
    if (quiz.gameMode === GameMode.SINGLE_ENTRY) {
      answer = answers[question.id] || '';
    } else {
      answer = selectedOptions;
    }
    
    // Save answer to state
    setAnswers({
      ...answers,
      [question.id]: answer,
    });
    
    // Submit answer via WebSocket
    submitAnswer(answer, question.id, quiz.id, participant.id);
  };
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress
  const calculateProgress = () => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };
  
  // If loading
  if (loading && !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto p-6">
          <div className="flex flex-col items-center justify-center">
            <Brain className="h-12 w-12 text-primary animate-pulse mb-4" />
            <h1 className="text-2xl font-bold text-center mb-2">Loading Quiz</h1>
            <p className="text-muted-foreground text-center mb-4">Please wait while we load the quiz...</p>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Card>
      </div>
    );
  }
  
  // If error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto p-6">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-center mb-2">Quiz Error</h1>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => setLocation('/')}>Return to Home</Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // If not registered yet
  if (!participant && quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="bg-primary text-white p-3 rounded-full inline-flex mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
              <p className="text-muted-foreground">
                {quiz.subject} - {quiz.section}
              </p>
            </div>
            
            <Separator className="my-6" />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Enter your name" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        This is how you'll appear on the leaderboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="email" placeholder="Enter your email" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        We'll use this to notify you if you win
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>Join Quiz</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If quiz loaded but questions not ready
  if (participant && quiz && (!questions || questions.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto p-6">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-center mb-2">Joining Quiz</h1>
            <p className="text-muted-foreground text-center mb-4">Please wait while we prepare your questions...</p>
          </div>
        </Card>
      </div>
    );
  }
  
  // Active quiz view with questions
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Quiz Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-primary text-white p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{quiz?.title}</h2>
                <p className="text-sm opacity-90">Hosted by: {participant?.name}</p>
              </div>
              <div className="text-center">
                <div className="text-sm">Time Remaining</div>
                <div className="text-2xl font-bold font-mono flex items-center">
                  <Timer className="mr-2 h-5 w-5" />
                  {formatTimeRemaining()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Player Info */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-secondary text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">
                <span className="font-bold">
                  {participant?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{participant?.name}</p>
                <p className="text-xs text-muted-foreground">{participant?.email}</p>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Quiz Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {questions.length > 0 && currentQuestionIndex < questions.length && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <h3 className="text-xl font-bold mb-4">
                  {questions[currentQuestionIndex].text}
                </h3>
                
                {/* Single Entry Mode */}
                {quiz?.gameMode === GameMode.SINGLE_ENTRY && (
                  <div className="mb-6">
                    <Input
                      placeholder="Type your answer here..."
                      value={answers[questions[currentQuestionIndex].id] || ''}
                      onChange={(e) => 
                        setAnswers({
                          ...answers,
                          [questions[currentQuestionIndex].id]: e.target.value
                        })
                      }
                      className="mb-4"
                    />
                  </div>
                )}
                
                {/* Multi-Choice Mode */}
                {quiz?.gameMode === GameMode.MULTI_CHOICE && (
                  <div className="space-y-3 mb-6">
                    {(questions[currentQuestionIndex].options as string[]).map((option, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedOptions.includes(index) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleOptionSelect(index)}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                            selectedOptions.includes(index) 
                              ? 'bg-primary text-white' 
                              : 'border-2 border-primary'
                          }`}>
                            {selectedOptions.includes(index) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  onClick={handleSubmitAnswer} 
                  className="w-full"
                  disabled={
                    (quiz?.gameMode === GameMode.MULTI_CHOICE && selectedOptions.length === 0) ||
                    (quiz?.gameMode === GameMode.SINGLE_ENTRY && 
                     (!answers[questions[currentQuestionIndex].id] || 
                      answers[questions[currentQuestionIndex].id].trim() === ''))
                  }
                >
                  Submit Answer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{currentQuestionIndex + 1}/{questions.length} Questions</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayQuizPage;
