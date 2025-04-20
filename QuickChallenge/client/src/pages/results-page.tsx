import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import LandingLayout from '@/components/layouts/landing-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Clock, 
  Medal, 
  Award, 
  Sparkles, 
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { Quiz, Result } from '@shared/schema';

type ResultWithParticipant = Result & {
  participant: {
    id: number;
    name: string;
    email: string;
  };
};

const ResultsPage = () => {
  const params = useParams<{ accessCode: string }>();
  const [, setLocation] = useLocation();
  const { accessCode } = params;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  
  // Fetch quiz details
  const { data: quizData, isLoading: loadingQuiz, error: quizError } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${accessCode}`],
    enabled: !!accessCode,
  });
  
  // Set quiz data when it's loaded
  useEffect(() => {
    if (quizData) {
      setQuiz(quizData);
    }
  }, [quizData]);
  
  // Fetch results for the quiz
  const { data: results, isLoading: loadingResults, error: resultsError } = useQuery<ResultWithParticipant[]>({
    queryKey: [`/api/quizzes/${quiz?.id}/results`],
    enabled: !!quiz?.id && !quiz.isActive, // Only fetch results if quiz has ended
  });
  
  // Get winners based on quiz prizes count
  const winners = results?.slice(0, quiz?.prizesCount || 0) || [];
  
  // Format time taken as MM:SS
  const formatTimeTaken = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get rank icon based on position
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-3xl text-yellow-500" />;
      case 2:
        return <Medal className="text-3xl text-gray-400" />;
      case 3:
        return <Medal className="text-3xl text-amber-700" />;
      default:
        return <Sparkles className="text-3xl text-gray-500" />;
    }
  };
  
  // Get rank background color based on position
  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Get rank text color based on position
  const getRankTextColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-gray-200 text-gray-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  // Handle error states
  if (quizError || resultsError) {
    return (
      <LandingLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Error Loading Results</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't load the quiz results. The quiz may have been deleted or not completed yet.
              </p>
              <Button onClick={() => setLocation('/')}>Return to Home</Button>
            </CardContent>
          </Card>
        </div>
      </LandingLayout>
    );
  }
  
  return (
    <LandingLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => setLocation('/')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-white p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Quiz Results</h2>
              {loadingQuiz ? (
                <Skeleton className="h-6 w-40 bg-white/20 mx-auto" />
              ) : (
                <p>{quiz?.title}</p>
              )}
            </div>
            
            <CardContent className="p-6">
              {/* Results Content */}
              <div className="text-center mb-8">
                <img 
                  src="https://images.unsplash.com/photo-1567016526105-22da7c13bd05?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Celebration" 
                  className="w-40 h-40 rounded-full object-cover mx-auto mb-3"
                />
                <h3 className="text-xl font-bold mb-2">
                  Congratulations to our Winners!
                </h3>
                <p className="text-muted-foreground">
                  The results are in! Check if you made it to the top.
                </p>
              </div>
              
              {/* Winners List */}
              <div className="space-y-6 mb-8">
                {loadingResults ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                  ))
                ) : winners.length > 0 ? (
                  // Winners cards
                  winners.map((winner, index) => (
                    <div 
                      key={index}
                      className={`${getRankBgColor(winner.rank)} border rounded-lg p-4 flex items-center`}
                    >
                      <div className="text-3xl mr-4">{getRankIcon(winner.rank)}</div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{winner.participant.name}</p>
                        <p className="text-muted-foreground text-sm">
                          Score: {winner.score} · Time: {formatTimeTaken(winner.timeTaken)}
                        </p>
                      </div>
                      <div className={`${getRankTextColor(winner.rank)} font-bold px-3 py-1 rounded-full text-sm`}>
                        {winner.rank === 1 ? '1st Place' : 
                         winner.rank === 2 ? '2nd Place' : 
                         winner.rank === 3 ? '3rd Place' : 
                         `${winner.rank}th Place`}
                      </div>
                    </div>
                  ))
                ) : (
                  // No results yet
                  <div className="text-center py-6 bg-muted/30 rounded-lg">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Results are being calculated</p>
                    <p className="text-sm text-muted-foreground">
                      Check back soon to see the winners
                    </p>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Didn't make it to the top? Don't worry! There will be more quizzes coming soon.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button variant="outline" onClick={() => setLocation('/')}>
                    Return to Home
                  </Button>
                  <Button onClick={() => setLocation('/auth')}>
                    Create Your Own Quiz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LandingLayout>
  );
};

export default ResultsPage;
