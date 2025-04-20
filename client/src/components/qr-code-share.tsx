import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeGenerator } from "@/components/ui/qr-code";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Quiz } from "@shared/schema";

interface QRCodeShareProps {
  quizId: string;
}

export default function QRCodeShare({ quizId }: QRCodeShareProps) {
  const { toast } = useToast();
  const [quizLink, setQuizLink] = useState("");
  
  // Fetch quiz details
  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
  });

  useEffect(() => {
    // Generate the quiz URL
    const baseUrl = window.location.origin;
    setQuizLink(`${baseUrl}/quiz/${quizId}`);
  }, [quizId]);

  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(quizLink)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Quiz link copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy the link. Try selecting and copying manually.",
          variant: "destructive",
        });
      });
  };

  // Download QR code (simulated)
  const downloadQRCode = () => {
    toast({
      title: "Download started",
      description: "Your QR code is being downloaded",
    });
    
    // In a real implementation, this would trigger actual download
    // of the QR code image
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading quiz details...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Quiz not found or unavailable.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-primary to-primary-800 text-white">
      <h3 className="text-lg leading-6 font-medium text-center">Share Your Quiz</h3>
      <p className="mt-1 max-w-2xl text-sm text-center">{quiz.subject}: {quiz.section}</p>
      
      <div className="bg-white text-gray-900 p-6 mt-4 rounded-lg">
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Quiz Details</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Subject
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {quiz.subject}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Section
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {quiz.section}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Game Mode
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {quiz.gameMode === "single" ? "Single Entry Mode" : "Multi-Choice Mode"}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Start Time
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(quiz.startTime)}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  End Time
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(quiz.endTime)}
                </dd>
              </div>
            </dl>
            
            <div className="pt-4">
              <h3 className="text-sm font-medium text-gray-900">Unique Quiz Link</h3>
              <div className="mt-2 flex rounded-md shadow-sm">
                <Input
                  id="quiz-link"
                  value={quizLink}
                  readOnly
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md sm:text-sm border-gray-300 bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md"
                  onClick={copyToClipboard}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-lg font-medium text-gray-900">QR Code</h2>
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <QRCodeGenerator 
                value={quizLink} 
                size={192}
                includeMargin={true}
                className="h-48 w-48"
              />
              <div className="mt-2 text-center text-xs text-gray-500">
                Scan to join quiz
              </div>
            </div>
            <Button 
              type="button" 
              className="inline-flex items-center"
              onClick={downloadQRCode}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="-ml-1 mr-2 h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
                />
              </svg>
              Download QR Code
            </Button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Share via</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              type="button" 
              variant="outline"
              className="inline-flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-gray-500" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Email
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="inline-flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-gray-500" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              SMS
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="inline-flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-green-500" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" 
                  clipRule="evenodd" 
                />
              </svg>
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
