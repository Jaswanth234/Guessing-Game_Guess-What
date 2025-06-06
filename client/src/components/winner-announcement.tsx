import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  // Fetch quiz results
  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}/results`],
  });

  useEffect(() => {
    if (quiz && Array.isArray(quiz.participants) && quiz.participants.length > 0) {
      console.log("Quiz data:", quiz);
      console.log("Quiz questions:", quiz.questions);

      // Calculate winners based on non-decoy answers and submission time
      const sortedParticipants = [...quiz.participants]
        .map(participant => {
          let correctCount = 0;

          console.log(`Processing participant: ${participant.playerName}`, participant);

          // Process each answer
          participant.answers.forEach((answer, idx) => {
            const question = quiz.questions[idx];
            if (!question) return;

            // Convert answer string to array of numbers
            const selectedAnswers = typeof answer === 'string' && answer.includes(',') 
              ? answer.split(',').map((a: string) => Number(a))
              : [Number(answer)];

            // Let's count correct answers based on non-decoy options
            let correctAnswersCount = 0;

            // Check if the question has the isDecoy property
            if (question && question.isDecoy && Array.isArray(question.isDecoy)) {
              // Count each selected answer that is not a decoy as correct
              for (const selectedOption of selectedAnswers) {
                // If the selectedOption index is within bounds and not a decoy, it's correct
                if (
                  selectedOption >= 0 && 
                  selectedOption < question.isDecoy.length && 
                  !question.isDecoy[selectedOption]
                ) {
                  correctAnswersCount++;
                }
              }
            } 
            // Fallback if isDecoy is not available - just count option 0 as correct
            else if (selectedAnswers.includes(0)) {
              correctAnswersCount = 1;
            }

            // Add to total correct count
            correctCount += correctAnswersCount;
          });

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
          return new Date(a.submittedAt || Date.now()).getTime() - 
                 new Date(b.submittedAt || Date.now()).getTime();
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
        <p className="mt-4 text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (!quiz || quiz.status !== QuizStatus.COMPLETED) {
    return (
      <div className="py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">Results Not Available</h2>
            <p className="mt-2 text-muted-foreground">This quiz is still in progress or results have not been processed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Card>
        <CardContent className="px-4 py-5 sm:px-6 bg-primary/10 text-primary-foreground">
          <h3 className="text-lg leading-6 font-medium text-center text-foreground">🎉 Quiz Results 🎉</h3>
          <p className="mt-1 max-w-2xl text-sm text-center text-muted-foreground">{quiz.subject}: {quiz.section}</p>
        </CardContent>

        <div className="bg-secondary/50 px-4 py-6 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">Quiz Complete!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thank you for participating. Here are the winners:
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6 results-content">
          {winners.length > 0 ? (
            <>
              {/* Top 3 Winners Display */}
              <div className="flex flex-col items-center sm:flex-row sm:justify-center space-y-8 sm:space-y-0 sm:space-x-8">
                {/* Map top 3 winners with special styling */}
                {winners
                  .filter(winner => winner.place <= 3)
                  .sort((a, b) => {
                    // Sort to ensure 2nd, 3rd, 1st order for display
                    if (a.place === 1) return 0;
                    if (b.place === 1) return -1;
                    if (a.place === 3) return -1;
                    if (b.place === 3) return 1;
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
                            ? 'h-24 w-24 rounded-full bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-200' 
                            : 'h-20 w-20 rounded-full bg-secondary border-2 border-border text-secondary-foreground'} 
                            flex items-center justify-center`}
                        >
                          <span className={`${winner.place === 1 ? 'text-2xl' : 'text-xl'} font-bold`}>
                            {winner.playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div 
                          className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center
                            ${winner.place === 1 
                              ? 'bg-amber-400 dark:bg-amber-500 border-2 border-amber-500 dark:border-amber-400' 
                              : 'bg-muted border-2 border-border'}`}
                        >
                          <span className="text-sm font-bold">{winner.place}</span>
                        </div>
                      </div>
                      <h3 className="mt-3 text-sm font-medium text-foreground">{winner.playerName}</h3>
                      <p className="text-xs text-muted-foreground">{winner.correctCount} correct answers</p>
                      <div 
                        className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${winner.place === 1 
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200' 
                            : 'bg-secondary/70 text-secondary-foreground'}`}
                      >
                        {winner.place === 1 ? '1st Place 🏆' : `${winner.place}${
                          winner.place === 2 ? 'nd' : 'rd'} Place`}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Additional Winners (4th and 5th place) */}
              {winners.some(w => w.place > 3) && (
                <div className="mt-10 border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">Additional Prize Winners</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {winners
                      .filter(winner => winner.place > 3)
                      .map(winner => (
                        <div key={winner.id} className="relative rounded-lg border border-border bg-card px-4 py-3 shadow-sm flex items-center space-x-3 hover:border-primary/30">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
                              {winner.playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {winner.playerName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {winner.correctCount} correct answers
                            </p>
                          </div>
                          <div className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                            {winner.place}th Place
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Participants Table */}
              <div className="mt-10 border-t border-border pt-6">
                <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">All Participants</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Submission Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {winners.map((participant) => (
                        <tr key={participant.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {participant.place}
                              {participant.place === 1 && "🥇"}
                              {participant.place === 2 && "🥈"}
                              {participant.place === 3 && "🥉"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">{participant.playerName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm text-foreground">{participant.correctCount} correct</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Selected options: {participant.answers.map((answer, idx) => {
                                  // Handle potentially empty answers
                                  if (!answer || answer === "") {
                                    return <span key={idx} className="ml-1 text-muted-foreground/60">No answer</span>;
                                  }

                                  const selectedOptions = typeof answer === 'string' 
                                    ? answer.split(',').map(Number)
                                    : [Number(answer)];
                                  const question = quiz.questions[idx];

                                  // If no question found, skip
                                  if (!question) {
                                    return <span key={idx} className="ml-1 text-muted-foreground/60">Question not found</span>;
                                  }

                                  return (
                                    <span key={idx} className="block my-1 ml-1">
                                      <span className="font-medium">Q{idx+1}:</span>{' '}
                                      {selectedOptions.map((optionIdx: number, i: number) => {
                                        // Determine if the selected option is correct (not a decoy)
                                        let isCorrect = false;

                                        // If the question has isDecoy array, check if this option is not a decoy
                                        if (question.isDecoy && Array.isArray(question.isDecoy) && 
                                            optionIdx >= 0 && optionIdx < question.isDecoy.length) {
                                          // If isDecoy[optionIdx] is false, then this is a correct option
                                          isCorrect = !question.isDecoy[optionIdx];
                                        }
                                        // Fallback to treating option 0 as correct
                                        else if (optionIdx === 0) {
                                          isCorrect = true;
                                        }

                                        const optionText = Array.isArray(question.answers) && 
                                          question.answers[optionIdx] || 'Unknown option';

                                        return (
                                          <span key={i} className={`${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} ${i > 0 ? 'ml-1' : ''}`}>
                                            {optionText}{i < selectedOptions.length - 1 ? ', ' : ''}
                                          </span>
                                        );
                                      })}
                                      {selectedOptions.length === 0 && 
                                        <span className="text-muted-foreground/60">No option selected</span>
                                      }
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                out of {quiz.questions.length} questions
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(participant.submittedAt || Date.now()).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZoneName: 'short'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No participants completed this quiz.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}