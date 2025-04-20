import { useState, useEffect } from 'react';
import { useLocation, useRoute, useSearch } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Brain, Check, MailCheck, PhoneCall, User } from 'lucide-react';

// Form schema for login
const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// Form schema for registration
const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(1, { message: 'Confirm Password is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(7, { message: 'Phone number is required' }),
  terms: z.boolean().refine(val => val === true, { message: 'You must agree to the terms' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);
  
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setActiveTab('register');
    }
  }, [searchParams]);
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };
  
  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      phone: '',
      terms: false,
    },
  });
  
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, terms, ...hostData } = values;
    registerMutation.mutate(hostData);
  };
  
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <a href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded-lg mr-2">
                <Brain className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold font-sans text-primary">QuizMaster</span>
            </a>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-2/5 bg-primary p-8 text-white">
                <h2 className="text-2xl font-bold font-sans mb-4">Welcome to QuizMaster</h2>
                <p className="mb-6">The ultimate platform for creating interactive quiz challenges.</p>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-1 rounded-full mr-3 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <span>Create unlimited quiz sessions</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-1 rounded-full mr-3 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <span>Support for single entry and multiple-choice questions</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-1 rounded-full mr-3 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <span>Real-time participant tracking and results</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-1 rounded-full mr-3 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <span>Easy sharing via QR codes or direct links</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-white bg-opacity-20 p-1 rounded-full mr-3 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <span>Automated winner announcements and prizes</span>
                  </li>
                </ul>
                
                <div className="mt-8 pt-8 border-t border-white border-opacity-20">
                  <p className="text-sm text-white text-opacity-80">
                    "QuizMaster has transformed how we run our trivia nights. The real-time interaction keeps everyone engaged!"
                  </p>
                  <p className="mt-2 font-medium">— Sarah Johnson, Event Coordinator</p>
                </div>
              </div>
              
              <div className="md:w-3/5 p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <h3 className="text-xl font-bold font-sans mb-4">Sign In to Your Account</h3>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </Form>
                    <p className="text-center mt-4 text-sm text-gray-600">
                      Don't have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary font-medium" 
                        onClick={() => setActiveTab('register')}
                      >
                        Register
                      </Button>
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <h3 className="text-xl font-bold font-sans mb-4">Create Your Host Account</h3>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-9" placeholder="John Doe" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <MailCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-9" placeholder="john@example.com" type="email" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Choose a username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <PhoneCall className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-9" placeholder="(123) 456-7890" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Create a password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Confirm your password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={registerForm.control}
                          name="terms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  I agree to the <a href="#" className="text-primary">Terms of Service</a> and <a href="#" className="text-primary">Privacy Policy</a>
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                    <p className="text-center mt-4 text-sm text-gray-600">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary font-medium" 
                        onClick={() => setActiveTab('login')}
                      >
                        Sign In
                      </Button>
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          
          <p className="text-center mt-8 text-sm text-gray-600">
            <a href="/" className="text-primary hover:underline">Back to Home</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
