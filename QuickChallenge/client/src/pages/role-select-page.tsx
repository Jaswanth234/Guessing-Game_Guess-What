import React, { useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AuthContext, UserRole } from '../main';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { UserRound, Users } from 'lucide-react';

const RoleSelectPage: React.FC = () => {
  const { role, setRole, user } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  // Redirect to appropriate dashboard once role is selected
  useEffect(() => {
    if (role === 'host') {
      setLocation('/dashboard');
    } else if (role === 'participant') {
      setLocation('/play-quiz');
    }
  }, [role, setLocation]);

  const handleRoleSelection = (selectedRole: UserRole) => {
    if (selectedRole) {
      setRole(selectedRole);
      
      // Redirect based on role (the useEffect will handle this)
      if (selectedRole === 'host') {
        // This will be handled by the useEffect
        // Host needs to be authenticated
        if (!user) {
          setLocation('/auth');
        }
      }
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Role</h1>
          <p className="text-lg text-gray-600 mb-8">
            Select how you'd like to participate in the interactive quiz experience
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Host Card */}
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full border-2 hover:border-primary cursor-pointer"
                    onClick={() => handleRoleSelection('host')}>
                <CardHeader className="text-center">
                  <div className="mx-auto p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                    <UserRound className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Host</CardTitle>
                  <CardDescription>Create and manage quiz sessions</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="space-y-2 text-left mx-auto max-w-xs">
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Create custom quizzes with different question types
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Share quizzes with participants via link or QR code
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Track participant progress and view results
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Manage multiple quiz sessions
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Continue as Host</Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Participant Card */}
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full border-2 hover:border-primary cursor-pointer"
                    onClick={() => handleRoleSelection('participant')}>
                <CardHeader className="text-center">
                  <div className="mx-auto p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Participant</CardTitle>
                  <CardDescription>Join quizzes with access codes</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="space-y-2 text-left mx-auto max-w-xs">
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Join quiz sessions with a simple access code
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      Participate in real-time interactive quizzes
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      See your scores and rankings
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      No account required
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Continue as Participant</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RoleSelectPage;