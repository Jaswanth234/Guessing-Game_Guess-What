
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import WinnerAnnouncement from "@/components/winner-announcement";
import { Quiz } from "@shared/schema";

export default function QuizResultsPage() {
  const { id } = useParams();
  
  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}/results`],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading results...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-500">Error loading quiz results</p>
            </div>
          ) : quiz ? (
            <WinnerAnnouncement quizId={id || ""} />
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-500">Quiz not found or results not available yet</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
