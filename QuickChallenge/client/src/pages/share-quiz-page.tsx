import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Quiz } from '@shared/schema';
import { 
  CheckCircle, 
  Copy, 
  Download, 
  Calendar, 
  Share2,
  Clipboard, 
  ArrowLeft
} from 'lucide-react';
import { 
  FaWhatsapp, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaEnvelope 
} from 'react-icons/fa';

const ShareQuizPage = () => {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const quizId = parseInt(params.id);
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Fetch quiz details
  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !isNaN(quizId),
  });
  
  // Get play URL for the quiz
  const baseUrl = window.location.origin;
  const playUrl = quiz ? `${baseUrl}/play/${quiz.accessCode}` : '';
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (copied) {
      timeoutId = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
    return () => clearTimeout(timeoutId);
  }, [copied]);
  
  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(playUrl).then(() => {
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Quiz link copied to clipboard',
      });
    });
  };
  
  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;
    
    const canvas = qrCodeRef.current.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${quiz?.title || 'quiz'}-qrcode.png`;
    link.click();
  };
  
  // Share on social media
  const shareOnSocialMedia = (platform: string) => {
    const encodedUrl = encodeURIComponent(playUrl);
    const encodedTitle = encodeURIComponent(`Join my quiz: ${quiz?.title || 'Quiz Game'}`);
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=Join%20my%20quiz%20at%20${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };
  
  // Handle error
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-6">
          <div className="text-red-500 text-xl mb-4">Error loading quiz</div>
          <Button onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="text-center bg-primary/5">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Quiz Created Successfully!</CardTitle>
              <CardDescription className="text-base">
                Your quiz is ready to share with participants.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Quiz Details */}
              <div className="bg-muted/50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-4">Quiz Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quiz Title</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-full" />
                    ) : (
                      <p className="font-medium">{quiz?.title}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-full" />
                    ) : (
                      <p className="font-medium">{quiz?.subject}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-full" />
                    ) : (
                      <p className="font-medium">
                        {quiz?.startTime ? format(new Date(quiz.startTime), 'MMMM d, yyyy - h:mm a') : ''}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Time</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-full" />
                    ) : (
                      <p className="font-medium">
                        {quiz?.endTime ? format(new Date(quiz.endTime), 'MMMM d, yyyy - h:mm a') : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* QR Code */}
                <div className="flex-1 border border-border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3 text-center">QR Code</h3>
                  {isLoading ? (
                    <div className="flex justify-center">
                      <Skeleton className="h-40 w-40" />
                    </div>
                  ) : (
                    <div 
                      ref={qrCodeRef}
                      className="bg-white p-2 w-40 h-40 mx-auto mb-3 flex items-center justify-center"
                    >
                      <QRCode value={playUrl} size={150} />
                    </div>
                  )}
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={downloadQRCode}
                    disabled={isLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                {/* Unique Link */}
                <div className="flex-1 border border-border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3 text-center">Unique Link</h3>
                  <div className="bg-muted rounded-lg p-3 mb-3 flex items-center">
                    {isLoading ? (
                      <Skeleton className="h-6 w-full" />
                    ) : (
                      <>
                        <Input 
                          readOnly 
                          value={playUrl}
                          className="border-none bg-transparent"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-2" 
                          onClick={copyToClipboard}
                          title="Copy to clipboard"
                        >
                          {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Share this link with your participants.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      size="icon"
                      className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                      onClick={() => shareOnSocialMedia('whatsapp')}
                      disabled={isLoading}
                      title="Share via WhatsApp"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-[#4267B2] hover:bg-[#4267B2]/90 text-white"
                      onClick={() => shareOnSocialMedia('facebook')}
                      disabled={isLoading}
                      title="Share via Facebook"
                    >
                      <FaFacebook className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
                      onClick={() => shareOnSocialMedia('twitter')}
                      disabled={isLoading}
                      title="Share via Twitter"
                    >
                      <FaTwitter className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-[#0077B5] hover:bg-[#0077B5]/90 text-white"
                      onClick={() => shareOnSocialMedia('linkedin')}
                      disabled={isLoading}
                      title="Share via LinkedIn"
                    >
                      <FaLinkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-[#EA4335] hover:bg-[#EA4335]/90 text-white"
                      onClick={() => shareOnSocialMedia('email')}
                      disabled={isLoading}
                      title="Share via Email"
                    >
                      <FaEnvelope className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/dashboard')}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  View Dashboard
                </Button>
                <Button 
                  onClick={() => setLocation('/create-quiz')}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Create Another Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ShareQuizPage;
