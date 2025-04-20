import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/">
                  <span className="text-primary text-2xl font-bold font-poppins cursor-pointer">QuizFlex</span>
                </Link>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                {user && (
                  <>
                    <Link href="/">
                      <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location === "/" 
                          ? "text-primary" 
                          : "text-gray-700 hover:text-primary"
                      }`}>
                        Dashboard
                      </a>
                    </Link>
                    <Link href="/my-games">
                      <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location === "/my-games" 
                          ? "text-primary" 
                          : "text-gray-700 hover:text-primary"
                      }`}>
                        My Games
                      </a>
                    </Link>
                    <Link href="/create-quiz">
                      <a className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition duration-150 ease-in-out">
                        Create Game
                      </a>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      Log Out
                    </Button>
                  </>
                )}
                {!user && (
                  <Link href="/auth">
                    <a className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition duration-150 ease-in-out">
                      Sign In
                    </a>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-sm">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && (
              <>
                <Link href="/">
                  <a className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/" 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  }`}>
                    Dashboard
                  </a>
                </Link>
                <Link href="/my-games">
                  <a className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/my-games" 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  }`}>
                    My Games
                  </a>
                </Link>
                <Link href="/create-quiz">
                  <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary">
                    Create Game
                  </a>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
                >
                  Log Out
                </button>
              </>
            )}
            {!user && (
              <Link href="/auth">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary">
                  Sign In
                </a>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="text-2xl font-bold font-poppins mb-4">QuizFlex</div>
              <p className="text-gray-400 max-w-md">
                Create engaging, interactive quiz challenges that players can join anytime, anywhere. 
                Perfect for education, team building, and entertainment.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Features</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Examples</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Templates</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Tutorials</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Support</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">© 2023 QuizFlex. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
