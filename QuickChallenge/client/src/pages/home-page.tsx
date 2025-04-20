import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import LandingLayout from '@/components/layouts/landing-layout';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Keyboard,
  ListChecks,
  UserPlus,
  Share2,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  // Create a local user state as fallback when auth isn't working
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);
  
  // For simpler implementation, we'll just render the page without auth for now
  // This ensures the page loads even if auth is not working

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section id="hero" className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sans text-gray-900 mb-4">
                Create Engaging <span className="text-primary">Quiz Games</span> in Minutes
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Host interactive quiz challenges, track real-time responses, and reward the fastest minds. Perfect for classrooms, events, or virtual gatherings!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/select-role">
                  <Button size="lg" className="gap-2">
                    <UserPlus className="h-5 w-5" />
                    Get Started
                  </Button>
                </Link>
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" variant="outline" className="gap-2">
                    {user ? "Go to Dashboard" : "Sign In"}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="People playing a quiz game" 
                className="rounded-xl shadow-lg w-full" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section id="features" className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold font-sans text-center mb-12">Choose Your Game Mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Single Entry Mode */}
            <motion.div 
              className="bg-white rounded-xl shadow-md p-6 border-t-4 border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-full mr-4">
                  <Keyboard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-sans">Single Entry Mode</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Players type in their answers manually. Perfect for open-ended questions, fill-in-the-blanks, or short answers.
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Example:</p>
                <p className="font-medium mb-2">What is the capital of France?</p>
                <div className="bg-white border border-gray-300 rounded px-3 py-2 mb-2">
                  <span className="text-gray-500">Type your answer...</span>
                </div>
                <p className="text-xs text-gray-500">
                  Host can define multiple correct answers (Paris, paris, PARIS)
                </p>
              </div>
            </motion.div>
            
            {/* Multi-Choice Mode */}
            <motion.div 
              className="bg-white rounded-xl shadow-md p-6 border-t-4 border-secondary transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-secondary bg-opacity-10 p-3 rounded-full mr-4">
                  <ListChecks className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold font-sans">Multi-Choice Mode</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Players select from predefined options. Ideal for trivia, multiple-choice tests, or quick challenges.
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Example:</p>
                <p className="font-medium mb-2">Which planet is known as the Red Planet?</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="radio" id="opt1" name="planet" className="mr-2" />
                    <label htmlFor="opt1">Venus</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="opt2" name="planet" className="mr-2" />
                    <label htmlFor="opt2">Mars</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="opt3" name="planet" className="mr-2" />
                    <label htmlFor="opt3">Jupiter</label>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold font-sans text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm text-center"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-primary bg-opacity-10 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-sans mb-3">1. Create & Setup</h3>
              <p className="text-gray-600">
                Register as a host, create your quiz by defining subjects, questions, and game settings.
              </p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm text-center"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-primary bg-opacity-10 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-sans mb-3">2. Share & Join</h3>
              <p className="text-gray-600">
                Share your game's unique link or QR code with participants so they can join instantly.
              </p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm text-center"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-primary bg-opacity-10 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-sans mb-3">3. Play & Win</h3>
              <p className="text-gray-600">
                Players compete in real-time, with automatic scoring and prizes for top performers.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-primary bg-opacity-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-sans mb-6">Ready to Create Your First Quiz?</h2>
          <p className="max-w-2xl mx-auto text-gray-600 mb-8">
            Join thousands of educators, trainers, and event organizers who are creating engaging quiz experiences for their audiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/select-role">
              <Button size="lg">
                Choose Your Role
              </Button>
            </Link>
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button size="lg" variant="outline">
                {user ? "Go to Dashboard" : "Sign In"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default HomePage;
