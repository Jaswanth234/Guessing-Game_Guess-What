import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Quiz, QuizStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, Clock, Users, Plus, SearchIcon } from "lucide-react";

export default function MyQuizzesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch user's quizzes
  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });
  
  // Format date in a user-friendly way
  const formatDate = (date: Date | null) => {
    try {
      if (!date) return "N/A";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };
  
  // Filter quizzes based on search term and tab
  const filteredQuizzes = quizzes?.filter(quiz => {
    const matchesSearch = 
      quiz.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      quiz.section.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && quiz.status === "Active";
    if (activeTab === "scheduled") return matchesSearch && quiz.status === "Scheduled";
    if (activeTab === "completed") return matchesSearch && quiz.status === "Completed";
    
    return matchesSearch;
  }) || [];
  
  // Status badge colors
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "Scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "Completed":
        return <Badge className="bg-gray-500">Completed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Quizzes</h1>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          <span>Create Quiz</span>
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-gray-100 h-24"></CardHeader>
              <CardContent className="pt-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-500 mb-6">
                {activeTab !== "all" 
                  ? `You don't have any ${activeTab} quizzes yet.` 
                  : "You haven't created any quizzes yet."}
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first quiz
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary-400 to-primary-600 text-white pb-4">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{quiz.subject}</CardTitle>
                      {getStatusBadge(quiz.status)}
                    </div>
                    <CardDescription className="text-white opacity-90">
                      {quiz.section}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Created {formatDate(quiz.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {quiz.status === "Scheduled"
                            ? `Starts ${formatDate(quiz.startTime)}`
                            : quiz.status === "Active"
                            ? `Ends ${formatDate(quiz.endTime)}`
                            : `Ended ${formatDate(quiz.endTime)}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>0 participants</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      View Results
                    </Button>
                    <Button size="sm">
                      Manage Quiz
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}