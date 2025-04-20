import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Brain, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Temporarily disable auth check
  const user = null; // No auth for now
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="bg-primary text-white p-2 rounded-lg mr-2">
                  <Brain className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold font-sans text-primary">QuizMaster</span>
              </div>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <div className={cn(
                "text-gray-700 hover:text-primary transition font-medium cursor-pointer",
                location === "/" && "text-primary"
              )}>
                Home
              </div>
            </Link>
            <Link href="/?section=features">
              <div className="text-gray-700 hover:text-primary transition font-medium cursor-pointer">
                Features
              </div>
            </Link>
            <Link href="/#how-it-works">
              <div className="text-gray-700 hover:text-primary transition font-medium cursor-pointer">
                How It Works
              </div>
            </Link>
            
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth?register=true">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile menu (hidden by default) */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} pt-2 pb-4`}>
          <div className="flex flex-col space-y-2">
            <Link href="/">
              <div className="px-2 py-1 text-gray-700 hover:text-primary cursor-pointer">
                Home
              </div>
            </Link>
            <Link href="/#features">
              <div className="px-2 py-1 text-gray-700 hover:text-primary cursor-pointer">
                Features
              </div>
            </Link>
            <Link href="/#how-it-works">
              <div className="px-2 py-1 text-gray-700 hover:text-primary cursor-pointer">
                How It Works
              </div>
            </Link>
            
            {user ? (
              <Link href="/dashboard">
                <div className="px-2 py-1 bg-primary text-white rounded-md text-center cursor-pointer">
                  Dashboard
                </div>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <div className="px-2 py-1 border border-gray-300 rounded-md text-center cursor-pointer">
                    Sign In
                  </div>
                </Link>
                <Link href="/auth?register=true">
                  <div className="px-2 py-1 bg-primary text-white rounded-md text-center cursor-pointer">
                    Register
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
