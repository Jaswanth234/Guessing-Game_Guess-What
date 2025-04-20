import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';
import { 
  PlusCircle, 
  LogOut, 
  LayoutDashboard, 
  Clipboard, 
  Award, 
  Settings 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          <div className="p-4">
            <Link href="/">
              <a className="flex items-center">
                <div className="bg-primary text-white p-2 rounded-lg mr-2">
                  <span className="font-bold">QM</span>
                </div>
                <span className="text-xl font-bold font-sans text-sidebar-foreground">QuizMaster</span>
              </a>
            </Link>
          </div>
          
          <Separator className="bg-sidebar-border" />
          
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {user ? getInitials(user.name) : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sidebar-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          
          <Separator className="bg-sidebar-border" />
          
          <ScrollArea className="flex-1 px-4 py-6">
            <nav className="space-y-2">
              <Link href="/dashboard">
                <a className={`flex items-center gap-2 p-2 rounded-md ${
                  location === '/dashboard' 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </a>
              </Link>
              <Link href="/create-quiz">
                <a className={`flex items-center gap-2 p-2 rounded-md ${
                  location === '/create-quiz' 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}>
                  <PlusCircle size={18} />
                  <span>Create Quiz</span>
                </a>
              </Link>
              <Link href="/dashboard?tab=quizzes">
                <a className={`flex items-center gap-2 p-2 rounded-md ${
                  location === '/dashboard' && new URLSearchParams(window.location.search).get('tab') === 'quizzes'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}>
                  <Clipboard size={18} />
                  <span>My Quizzes</span>
                </a>
              </Link>
              <Link href="/dashboard?tab=results">
                <a className={`flex items-center gap-2 p-2 rounded-md ${
                  location === '/dashboard' && new URLSearchParams(window.location.search).get('tab') === 'results'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}>
                  <Award size={18} />
                  <span>Results</span>
                </a>
              </Link>
              <Link href="/dashboard?tab=settings">
                <a className={`flex items-center gap-2 p-2 rounded-md ${
                  location === '/dashboard' && new URLSearchParams(window.location.search).get('tab') === 'settings'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}>
                  <Settings size={18} />
                  <span>Settings</span>
                </a>
              </Link>
            </nav>
          </ScrollArea>
          
          <div className="p-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut size={16} className="mr-2" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
