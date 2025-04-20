import { useEffect, useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PlusCircle, 
  CalendarClock, 
  PenSquare,
  Trash2, 
  QrCode, 
  BarChart4,
  Clock,
  Eye,
  Users,
  ArrowRight
} from 'lucide-react';
import { Quiz } from '@shared/schema';
import { AuthContext, UserRole } from '../main';

const DashboardPage = () => {
  const { role, setRole } = useContext(AuthContext);
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [accessCode, setAccessCode] = useState('');
  const searchParams = new URLSearchParams(window.location.search);
  const tabFromUrl = searchParams.get('tab');
  
  // Redirect to role selection if no role is set
  useEffect(() => {
    if (role === null) {
      setLocation('/select-role');
    }
  }, [role, setLocation]);
  
  // Fetch quizzes for the host (only needed for host role)
  const { data: quizzes, isLoading: loadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
    enabled: role === 'host', // Only fetch if user is a host
  });
  
  // Set active tab based on URL
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/dashboard?tab=${value}`);
  };
  
  // Filter active quizzes
  const activeQuizzes = quizzes?.filter(quiz => quiz.isActive) || [];
  
  // Filter past quizzes
  const pastQuizzes = quizzes?.filter(quiz => !quiz.isActive) || [];

  // Handle join quiz for participants
  const handleJoinQuiz = () => {
    if (accessCode) {
      setLocation(`/play/${accessCode}`);
    }
  };

  if (role === 'participant') {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl mx-auto py-10 px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Join a Quiz</h1>
          
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Enter Quiz Access Code</CardTitle>
              <CardDescription>
                Enter the access code provided by your quiz host to join a session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      id="accessCode"
                      placeholder="Enter 6-character code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      className="md:col-span-3 text-lg uppercase"
                      maxLength={6}
                    />
                    <Button onClick={handleJoinQuiz} className="w-full" disabled={accessCode.length !== 6}>
                      Join Quiz <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Tips for Participants:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Make sure you enter the exact 6-character code</li>
                    <li>You'll be able to join the quiz once the host starts it</li>
                    <li>Stay connected throughout the quiz for real-time updates</li>
                    <li>Your scores will be calculated automatically</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setRole(null)}>
                Change Role
              </Button>
              <Button variant="link" asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Recent Quizzes Section can be added here if we track participant history */}
        </div>
      </DashboardLayout>
    );
  }

  // Host Dashboard
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Host Dashboard</h1>
            <p className="text-muted-foreground">Manage your quizzes and view results.</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => setRole(null)}>
              Change Role
            </Button>
            <Button asChild>
              <Link href="/create-quiz">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Quiz
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Quizzes
                  </CardTitle>
                  <div className="bg-primary/20 p-2 rounded-full">
                    <BarChart4 className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingQuizzes ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      quizzes?.length || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quizzes created
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Quizzes
                  </CardTitle>
                  <div className="bg-green-100 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingQuizzes ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      activeQuizzes.length
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Participants
                  </CardTitle>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total participants
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completion Rate
                  </CardTitle>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Eye className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg. completion rate
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>Recent Quizzes</CardTitle>
                  <CardDescription>
                    Your recently created quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingQuizzes ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : quizzes && quizzes.length > 0 ? (
                    <div className="space-y-4">
                      {quizzes.slice(0, 5).map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{quiz.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {quiz.subject} • {quiz.section}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {quiz.gameMode === 'single_entry' ? 'Single Entry' : 'Multi-Choice'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              asChild
                            >
                              <Link href={`/share-quiz/${quiz.id}`}>
                                <QrCode className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No quizzes created yet. Get started by creating your first quiz!
                    </p>
                  )}
                </CardContent>
                {quizzes && quizzes.length > 0 && (
                  <CardFooter>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href="/dashboard?tab=quizzes">
                        View All Quizzes
                      </Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
              
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>
                    Your scheduled quiz sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingQuizzes ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : activeQuizzes && activeQuizzes.length > 0 ? (
                    <div className="space-y-4">
                      {activeQuizzes.slice(0, 3).map((quiz) => {
                        const startTime = new Date(quiz.startTime);
                        const endTime = new Date(quiz.endTime);
                        return (
                          <div key={quiz.id} className="flex items-center space-x-3 border-b pb-2">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <CalendarClock className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{quiz.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(startTime, 'MMM dd, yyyy • h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No upcoming quiz sessions.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Quizzes Tab (Remaining tabs would follow) */}
          <TabsContent value="quizzes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>My Quizzes</CardTitle>
                    <CardDescription>
                      Manage all your created quizzes
                    </CardDescription>
                  </div>
                  <Button asChild className="mt-4 md:mt-0">
                    <Link href="/create-quiz">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Quiz
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingQuizzes ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-28 w-full" />
                    ))}
                  </div>
                ) : quizzes && quizzes.length > 0 ? (
                  <div className="space-y-4">
                    {quizzes.map((quiz) => {
                      const startTime = new Date(quiz.startTime);
                      const endTime = new Date(quiz.endTime);
                      return (
                        <Card key={quiz.id} className="overflow-hidden">
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <h3 className="font-bold text-lg">{quiz.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {quiz.subject} • {quiz.section}
                                </p>
                                <div className="flex items-center mt-2">
                                  <p className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mr-2">
                                    {quiz.gameMode === 'single_entry' ? 'Single Entry' : 'Multi-Choice'}
                                  </p>
                                  <p className={`text-xs px-2 py-1 rounded ${
                                    quiz.isActive 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {quiz.isActive ? 'Active' : 'Inactive'}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/share-quiz/${quiz.id}`}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Share
                                  </Link>
                                </Button>
                                <Button size="sm" variant="outline">
                                  <PenSquare className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No quizzes created yet. Get started by creating your first quiz!
                    </p>
                    <Button asChild>
                      <Link href="/create-quiz">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Quiz
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Results Tab (placeholder) */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Results</CardTitle>
                <CardDescription>
                  View and analyze results from your quiz sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Results data will appear here after participants complete your quizzes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab (placeholder) */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Account settings will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;