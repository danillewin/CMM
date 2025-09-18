import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Meetings from "@/pages/meetings";
import MeetingDetail from "@/pages/meeting-detail";
import Researches from "@/pages/researches";
import ResearchDetail from "@/pages/research-detail";
import Calendar from "@/pages/calendar";
import Dashboard from "@/pages/dashboard";
import Roadmap from "@/pages/roadmap";
import Jtbds from "@/pages/jtbds";

import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useScrollTop } from "@/hooks/use-scroll-top";
import { LogIn, LogOut, User } from "lucide-react";

function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated, user, login, logout, isInitialized } = useAuth();

  return (
    <nav className="border-b mb-4">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Link href="/">
              <Button variant={location === "/" ? "default" : "ghost"}>
                {'Встречи'}
              </Button>
            </Link>
            <Link href="/researches">
              <Button variant={location === "/researches" ? "default" : "ghost"}>
                {'Исследования'}
              </Button>
            </Link>
            <Link href="/roadmap">
              <Button variant={location === "/roadmap" ? "default" : "ghost"}>
                {'Roadmap'}
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant={location === "/calendar" ? "default" : "ghost"}>
                {'Календарь'}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant={location === "/dashboard" ? "default" : "ghost"}>
                {'Dashboards'}
              </Button>
            </Link>
            <Link href="/jtbds">
              <Button variant={location === "/jtbds" ? "default" : "ghost"}>
                {'Jobs to be Done'}
              </Button>
            </Link>
          </div>
          
          {/* User Authentication Section */}
          <div className="flex items-center gap-3">
            {isInitialized && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user?.username || 'anonymous'}</span>
                </div>
                {isAuthenticated ? (
                  <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Выйти
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={login}>
                    <LogIn className="h-4 w-4 mr-1" />
                    Войти
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Meetings} />
      <Route path="/meetings/:id" component={MeetingDetail} />
      <Route path="/researches" component={Researches} />
      <Route path="/researches/:id" component={ResearchDetail} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/jtbds" component={Jtbds} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Hook to instantly scroll to top on page navigation
  useScrollTop();
  
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Navigation />
        <Router />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;