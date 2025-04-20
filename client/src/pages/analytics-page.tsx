import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "@/components/ui/chart";
import { Quiz, QuizStatus } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  // Fetch user's quizzes for analytics
  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });
  
  // Sample data for charts - in a real app, this would be derived from the actual quiz data
  const participationData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Participants",
        data: [65, 78, 52, 91, 83, 68],
        backgroundColor: "rgba(79, 70, 229, 0.8)",
      },
    ],
  };
  
  const completionRateData = {
    labels: ["Completed", "Partial", "Abandoned"],
    datasets: [
      {
        label: "Completion Rate",
        data: [70, 15, 15],
        backgroundColor: [
          "rgba(52, 211, 153, 0.8)",
          "rgba(251, 189, 35, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
      },
    ],
  };
  
  const performanceTrendData = {
    labels: ["Quiz 1", "Quiz 2", "Quiz 3", "Quiz 4", "Quiz 5"],
    datasets: [
      {
        label: "Average Score",
        data: [72, 76, 82, 84, 88],
        borderColor: "rgba(79, 70, 229, 1)",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const quizCountByStatus = quizzes ? {
    active: quizzes.filter(q => q.status === QuizStatus.ACTIVE).length,
    scheduled: quizzes.filter(q => q.status === QuizStatus.SCHEDULED).length,
    completed: quizzes.filter(q => q.status === QuizStatus.COMPLETED).length,
    total: quizzes.length
  } : { active: 0, scheduled: 0, completed: 0, total: 0 };
  
  // In a real app, participantCount would be part of the quiz model
  // For now, we're using a placeholder
  const getParticipantCount = (quiz: Quiz) => {
    // This would normally come from the quiz object
    return 0;
  };
  
  // Calculate summary metrics
  const totalParticipants = quizzes?.reduce((sum, quiz) => sum + getParticipantCount(quiz), 0) || 0;
  const avgParticipantsPerQuiz = quizzes?.length ? Math.round(totalParticipants / quizzes.length) : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Quizzes</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? <Skeleton className="h-9 w-16" /> : quizCountByStatus.total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <span className="text-green-500 font-medium">{quizCountByStatus.active} active</span>,{" "}
                  <span className="text-blue-500 font-medium">{quizCountByStatus.scheduled} scheduled</span>,{" "}
                  <span className="text-gray-500 font-medium">{quizCountByStatus.completed} completed</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? <Skeleton className="h-9 w-16" /> : totalParticipants}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                `Avg ${avgParticipantsPerQuiz} participants per quiz`
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? <Skeleton className="h-9 w-16" /> : "78%"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                "5% increase from previous month"
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? <Skeleton className="h-9 w-16" /> : "85%"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                "3% increase from previous month"
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="participation" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participation Trends</CardTitle>
              <CardDescription>Monthly quiz participation over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-4/5 w-full" />
                </div>
              ) : (
                <BarChart
                  data={participationData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Average quiz scores over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-4/5 w-full" />
                </div>
              ) : (
                <LineChart
                  data={performanceTrendData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Rates</CardTitle>
              <CardDescription>Quiz completion statistics</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-4/5 w-full" />
                </div>
              ) : (
                <PieChart
                  data={completionRateData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Top Performing Quizzes */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Quizzes</CardTitle>
          <CardDescription>Quizzes with the highest participation and scores</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-2 border-b">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ))}
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="space-y-2">
              {quizzes.slice(0, 5).map((quiz) => (
                <div key={quiz.id} className="flex justify-between items-center p-2 border-b">
                  <span className="font-medium">{quiz.subject}: {quiz.section}</span>
                  <span className="text-sm">{quiz.participantCount || 0} participants</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No quiz data available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}