import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz, QuizStatus, Participant } from "@shared/schema";

interface WinnerAnnouncementProps {
  quizId: string;
}

type Winner = Participant & {
  place: number;
  correctCount: number;
};

export default function WinnerAnnouncement({ quizId }: WinnerAnnouncementProps) {
  const [winners, setWinners] = useState<Winner[]>([]);

  // Fetch quiz results
  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}/results`],
  });

  useEffect(() => {
    if (quiz && Array.isArray(quiz.participants) && quiz.participants.length > 0) {
      // Calculate winners based on correct answers and submission time
      const sortedParticipants = [...quiz.participants]
        .map(participant => {
          // Count correct answers
          // Parse answers which might be in comma-separated string format
          let correctCount = 0;

          // Handle case where only one question exists
          const answer = participant.answers[0];
          if (answer !== undefined) {
            // Handle both single and multi mode scoring
            if (typeof answer === 'string') {
              const selectedAnswers = answer.includes(',') 
                ? answer.split(',').map(a => Number(a))
                : [Number(answer)];

              const correctAnswers = quiz.questions[0].correctAnswers;

              // For multiple selection questions, count as correct if all required answers are selected
              const isCorrect = correctAnswers.every(ans => selectedAnswers.includes(ans));

              if (isCorrect) {
                correctCount++;
              }
            }
          }

          return {
            ...participant,
            correctCount,
          };
        })
        .sort((a, b) => {
          // Sort by correct answers (descending)
          if (b.correctCount !== a.correctCount) {
            return b.correctCount - a.correctCount;
          }
          // If tied, sort by submission time (ascending)
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        })
        .map((participant, index) => ({
          ...participant,
          place: index + 1,
        }));

      // Only limit to winners for display, but calculate rank for all participants
      setWinners(sortedParticipants);
    }
  }, [quiz]);

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading results...</p>
      </div>
    );
  }

  if (!quiz || quiz.status !== QuizStatus.COMPLETED) {
    return (
      <div className="py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Results Not Available</h2>
            <p className="mt-2 text-gray-500">This quiz is still in progress or results have not been processed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Card>
        <CardContent className="px-4 py-5 sm:px-6 bg-gradient-to-r from-secondary-500 to-accent-500 text-white">
          <h3 className="text-lg leading-6 font-medium text-center">🎉 Quiz Results 🎉</h3>
          <p className="mt-1 max-w-2xl text-sm text-center">{quiz.subject}: {quiz.section}</p>
        </CardContent>

        <div className="bg-gray-50 px-4 py-6 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Quiz Complete!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Thank you for participating. Here are the winners:
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {winners.length > 0 ? (
            <>
              {/* Top 3 Winners Display */}
              <div className="flex flex-col items-center sm:flex-row sm:justify-center space-y-8 sm:space-y-0 sm:space-x-8">
                {/* Map top 3 winners with special styling */}
                {winners
                  .filter(winner => winner.place <= 3)
                  .sort((a, b) => {
                    // Sort to ensure 2nd, 1st, 3rd order for display
                    if (a.place === 1) return 0;
                    if (b.place === 1) return -1;
                    return a.place - b.place;
                  })
                  .map(winner => (
                    <div 
                      key={winner.id}
                      className={`flex flex-col items-center order-${winner.place} sm:order-${winner.place} ${winner.place === 1 ? 'transform scale-110' : ''}`}
                    >
                      <div className="relative">
                        <div 
                          className={`${winner.place === 1 
                            ? 'h-24 w-24 rounded-full bg-yellow-100 border-2 border-yellow-400 text-yellow-700' 
                            : 'h-20 w-20 rounded-full bg-gray-100 border-2 border-gray-300 text-gray-700'} 
                            flex items-center justify-center`}
                        >
                          <span className={`${winner.place === 1 ? 'text-2xl' : 'text-xl'} font-bold`}>
                            {winner.playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div 
                          className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center
                            ${winner.place === 1 
                              ? 'bg-yellow-400 border-2 border-yellow-500' 
                              : 'bg-gray-100 border-2 border-gray-300'}`}
                        >
                          <span className="text-sm font-bold">{winner.place}</span>
                        </div>
                      </div>
                      <h3 className="mt-3 text-sm font-medium text-gray-900">{winner.playerName}</h3>
                      <p className="text-xs text-gray-500">{winner.correctCount} correct answers</p>
                      <div 
                        className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${winner.place === 1 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'}`}
                      >
                        {winner.place === 1 ? '1st Place 🏆' : `${winner.place}${
                          winner.place === 2 ? 'nd' : 'rd'} Place`}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Additional Winners (4th and 5th place) */}
              {winners.some(w => w.place > 3) && (
                <div className="mt-10 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-500 text-center mb-4">Additional Prize Winners</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {winners
                      .filter(winner => winner.place > 3)
                      .map(winner => (
                        <div key={winner.id} className="relative rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm flex items-center space-x-3 hover:border-gray-300">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                              {winner.playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {winner.playerName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {winner.correctCount} correct answers
                            </p>
                          </div>
                          <div className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {winner.place}th Place
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Participants Table */}
              <div className="mt-10 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 text-center mb-4">All Participants</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {winners.map((participant) => (
                        <tr key={participant.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {participant.place}
                              {participant.place === 1 && "🥇"}
                              {participant.place === 2 && "🥈"}
                              {participant.place === 3 && "🥉"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{participant.playerName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{participant.correctCount} correct</div>
                            <div className="text-xs text-gray-500">
                              out of {quiz.questions.length} questions
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(participant.submittedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row sm:justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button 
                  variant="outline" 
                  className="inline-flex justify-center items-center"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/quiz/${quizId}/results`;
                    navigator.clipboard.writeText(shareUrl);
                    // You can add a toast notification here to show success
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2 text-gray-500" 
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
                  Share Results
                </Button>
                <Button 
                  className="inline-flex justify-center items-center"
                  onClick={() => {
                    window.location.href = `/quiz/${quizId}/results`;
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  View Full Results
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No participants completed this quiz.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}