
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import WinnerAnnouncement from "@/components/winner-announcement";
import { Quiz } from "@shared/schema";

export default function QuizResultsPage() {
  const { id } = useParams();
  
  const { data: quiz, isLoading } = useQuery<Quiz>({
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
          ) : (
            <WinnerAnnouncement quizId={id || ""} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
