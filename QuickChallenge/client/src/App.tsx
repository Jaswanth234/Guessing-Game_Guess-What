import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CreateQuizPage from "@/pages/create-quiz-page";
import ShareQuizPage from "@/pages/share-quiz-page";
import PlayQuizPage from "@/pages/play-quiz-page";
import ResultsPage from "@/pages/results-page";
import RoleSelectPage from "@/pages/role-select-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/select-role" component={RoleSelectPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/create-quiz" component={CreateQuizPage} />
      <ProtectedRoute path="/share-quiz/:id" component={ShareQuizPage} />
      <Route path="/play/:accessCode" component={PlayQuizPage} />
      <Route path="/results/:accessCode" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
