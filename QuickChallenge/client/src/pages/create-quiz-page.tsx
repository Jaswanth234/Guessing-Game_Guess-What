import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Brain, Plus, Trash2, Calendar, CalendarClock } from 'lucide-react';
import { GameMode, InsertQuiz, InsertQuestion } from '@shared/schema';

// Form schema for basic quiz settings
const quizFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  section: z.string().min(1, { message: 'Section is required' }),
  gameMode: z.enum(['single_entry', 'multi_choice']),
  startTime: z.string().min(1, { message: 'Start time is required' }),
  endTime: z.string().min(1, { message: 'End time is required' }),
  prizesCount: z.coerce.number().min(1).max(5),
});

// Form schema for single entry questions
const singleEntryQuestionSchema = z.object({
  text: z.string().min(1, { message: 'Question text is required' }),
  correctAnswers: z.string().min(1, { message: 'At least one correct answer is required' }),
});

// Form schema for multi-choice questions
const multiChoiceQuestionSchema = z.object({
  text: z.string().min(1, { message: 'Question text is required' }),
  options: z.array(z.object({
    text: z.string().min(1, { message: 'Option text is required' }),
    isCorrect: z.boolean().default(false),
  })).min(2, { message: 'At least 2 options are required' }),
});

const CreateQuizPage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeQuestion, setActiveQuestion] = useState<number>(0);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Form for basic quiz settings
  const quizForm = useForm<z.infer<typeof quizFormSchema>>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: '',
      subject: '',
      section: '',
      gameMode: 'multi_choice' as GameMode,
      startTime: '',
      endTime: '',
      prizesCount: 3,
    },
  });
  
  const watchGameMode = quizForm.watch('gameMode');
  
  // Form for single entry questions
  const singleEntryForm = useForm<z.infer<typeof singleEntryQuestionSchema>>({
    resolver: zodResolver(singleEntryQuestionSchema),
    defaultValues: {
      text: '',
      correctAnswers: '',
    },
  });
  
  // Form for multi-choice questions
  const multiChoiceForm = useForm<z.infer<typeof multiChoiceQuestionSchema>>({
    resolver: zodResolver(multiChoiceQuestionSchema),
    defaultValues: {
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: multiChoiceForm.control,
    name: 'options',
  });
  
  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (data: InsertQuiz) => {
      const res = await apiRequest('POST', '/api/quizzes', data);
      return await res.json();
    },
    onSuccess: (quiz) => {
      // Create questions for the quiz
      questions.forEach(async (question) => {
        try {
          const questionData: InsertQuestion = {
            quizId: quiz.id,
            text: question.text,
            options: question.options || [],
            correctAnswers: question.correctAnswers,
          };
          
          await apiRequest('POST', `/api/quizzes/${quiz.id}/questions`, questionData);
        } catch (error) {
          console.error('Error creating question:', error);
        }
      });

      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: 'Quiz created!',
        description: 'Your quiz has been created successfully.',
      });
      setLocation(`/share-quiz/${quiz.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating quiz',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Add a question to the questions array
  const addQuestion = (questionData: any) => {
    setQuestions([...questions, questionData]);
    
    // Reset form based on game mode
    if (watchGameMode === 'single_entry') {
      singleEntryForm.reset({
        text: '',
        correctAnswers: '',
      });
    } else {
      multiChoiceForm.reset({
        text: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
    }
  };
  
  // Remove a question from the questions array
  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    
    // If the active question is the one being removed, set the active question to the last one
    if (activeQuestion === index) {
      setActiveQuestion(Math.max(0, newQuestions.length - 1));
    } else if (activeQuestion > index) {
      // If the active question is after the one being removed, decrement the active question
      setActiveQuestion(activeQuestion - 1);
    }
  };
  
  // Handle single entry question submission
  const onSingleEntrySubmit = (data: z.infer<typeof singleEntryQuestionSchema>) => {
    // Split comma-separated answers into an array and trim whitespace
    const correctAnswers = data.correctAnswers.split(',').map(answer => answer.trim());
    
    addQuestion({
      text: data.text,
      options: [],
      correctAnswers: correctAnswers,
    });
  };
  
  // Handle multi-choice question submission
  const onMultiChoiceSubmit = (data: z.infer<typeof multiChoiceQuestionSchema>) => {
    // Extract correct answer indices
    const correctAnswers = data.options
      .map((option, index) => option.isCorrect ? index : -1)
      .filter(index => index !== -1);
      
    if (correctAnswers.length === 0) {
      toast({
        title: 'Error adding question',
        description: 'At least one option must be marked as correct.',
        variant: 'destructive',
      });
      return;
    }
    
    addQuestion({
      text: data.text,
      options: data.options.map(option => option.text),
      correctAnswers: correctAnswers,
    });
  };
  
  // Handle quiz creation
  const onQuizSubmit = (data: z.infer<typeof quizFormSchema>) => {
    if (questions.length === 0) {
      toast({
        title: 'Error creating quiz',
        description: 'You must add at least one question to the quiz.',
        variant: 'destructive',
      });
      return;
    }
    
    const quizData: InsertQuiz = {
      ...data,
      hostId: user!.id,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    };
    
    createQuizMutation.mutate(quizData);
  };
  
  // Add another option to the multi-choice form
  const addOption = () => {
    append({ text: '', isCorrect: false });
  };
  
  // Check if an option can be removed
  const canRemoveOption = fields.length > 2;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Quiz</h1>
          <p className="text-muted-foreground">
            Set up your quiz game with questions, answers, and game settings.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Basic Quiz Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Configure the essential details for your quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...quizForm}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={quizForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Example: World Geography Trivia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={quizForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Example: Geography" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={quizForm.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section/Category</FormLabel>
                          <FormControl>
                            <Input placeholder="Example: Capital Cities" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={quizForm.control}
                      name="gameMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Game Mode</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select game mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single_entry">Single Entry Mode</SelectItem>
                              <SelectItem value="multi_choice">Multi-Choice Mode</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {field.value === 'single_entry'
                              ? 'Players will type answers manually'
                              : 'Players will choose from multiple options'
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={quizForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={quizForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <div className="flex items-center">
                            <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Prize Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Prize Configuration</CardTitle>
              <CardDescription>
                Select which prizes you want to award to top performers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...quizForm}>
                <FormField
                  control={quizForm.control}
                  name="prizesCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                          className="grid grid-cols-2 md:grid-cols-5 gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="1" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              1st Prize 🏆
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="2" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Top 2 🏆🥈
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="3" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Top 3 🏆🥈🥉
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="4" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Top 4 🏆🥈🥉✨
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="5" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Top 5 🏆🥈🥉✨✨
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
            </CardContent>
          </Card>
          
          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add questions to your quiz based on your selected game mode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {watchGameMode === 'single_entry' ? (
                <Form {...singleEntryForm}>
                  <form onSubmit={singleEntryForm.handleSubmit(onSingleEntrySubmit)} className="space-y-4">
                    <FormField
                      control={singleEntryForm.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your question here" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={singleEntryForm.control}
                      name="correctAnswers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answers (comma-separated)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Paris, paris, PARIS" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Add multiple possible correct answers separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...multiChoiceForm}>
                  <form onSubmit={multiChoiceForm.handleSubmit(onMultiChoiceSubmit)} className="space-y-4">
                    <FormField
                      control={multiChoiceForm.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your question here" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel>Options</FormLabel>
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <FormField
                            control={multiChoiceForm.control}
                            name={`options.${index}.isCorrect`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={multiChoiceForm.control}
                            name={`options.${index}.text`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder={`Option ${index + 1}`} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {canRemoveOption && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                      <FormDescription>
                        Check the boxes next to correct answers
                      </FormDescription>
                    </div>
                    
                    <Button type="submit">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </form>
                </Form>
              )}
              
              {questions.length > 0 && (
                <div className="mt-8">
                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-4">Added Questions ({questions.length})</h3>
                  <Accordion
                    type="single"
                    collapsible
                    value={`item-${activeQuestion}`}
                    onValueChange={(value) => setActiveQuestion(parseInt(value.split('-')[1]))}
                    className="w-full"
                  >
                    {questions.map((question, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="hover:bg-muted px-4 rounded-md">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-left truncate">
                              Question {index + 1}: {question.text.substring(0, 60)}
                              {question.text.length > 60 ? '...' : ''}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-2">
                            <p className="font-medium">{question.text}</p>
                            {watchGameMode === 'multi_choice' ? (
                              <div className="space-y-2 pl-4">
                                <p className="text-sm text-muted-foreground">Options:</p>
                                {question.options.map((option: string, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border ${
                                      question.correctAnswers.includes(optIndex) 
                                        ? 'bg-primary border-primary' 
                                        : 'border-input'
                                    }`} />
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="pl-4">
                                <p className="text-sm text-muted-foreground">Correct answers:</p>
                                <p>{question.correctAnswers.join(', ')}</p>
                              </div>
                            )}
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeQuestion(index)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={quizForm.handleSubmit(onQuizSubmit)}
              disabled={createQuizMutation.isPending || questions.length === 0}
            >
              {createQuizMutation.isPending ? (
                <>Creating Quiz...</>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Create Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateQuizPage;
