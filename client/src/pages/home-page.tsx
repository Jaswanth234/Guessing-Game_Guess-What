import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HostDashboard from "@/components/host-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("host");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Mobile Tabs */}
        <div className="sm:hidden">
          <div className="pt-2 pb-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-4">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("host");
                  }}
                  className={`${
                    activeTab === "host"
                      ? "border-primary-500 text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Host Area
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("player");
                  }}
                  className={`${
                    activeTab === "player"
                      ? "border-primary-500 text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Player Area
                </a>
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Tabs */}
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("host");
                  }}
                  className={`${
                    activeTab === "host"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Host Area
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("player");
                  }}
                  className={`${
                    activeTab === "player"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Player Area
                </a>
              </nav>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === "host" ? (
            <HostDashboard />
          ) : (
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">Player Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Join quizzes by entering a quiz code or scanning a QR code.
              </p>
              
              <div className="mt-6 bg-white shadow sm:rounded-md p-6 text-center">
                <p className="text-gray-500">
                  To join a quiz, use the link or QR code shared by the quiz host.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
