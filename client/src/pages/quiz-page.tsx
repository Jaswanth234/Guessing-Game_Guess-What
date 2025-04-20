import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PlayerArea from "@/components/player-area";
import WinnerAnnouncement from "@/components/winner-announcement";
import { Quiz, QuizStatus } from "@shared/schema";

export default function QuizPage() {
  const { id } = useParams();
  const [showResults, setShowResults] = useState(false);
  
  // Fetch quiz data
  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
  });

  useEffect(() => {
    if (quiz && quiz.status === QuizStatus.COMPLETED) {
      setShowResults(true);
    }
  }, [quiz]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading quiz...</p>
            </div>
          ) : showResults ? (
            <WinnerAnnouncement quizId={id || ""} />
          ) : (
            <PlayerArea />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
