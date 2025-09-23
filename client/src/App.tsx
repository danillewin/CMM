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
import { LogIn, LogOut, User, Loader2 } from "lucide-react";

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

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  );
}

// Login screen component
function LoginScreen() {
  const { login } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Research App
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to continue
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button 
            onClick={login}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Keycloak
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main App content component
function AppContent() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  
  // Show loading screen while checking authentication
  if (isLoading || !isInitialized) {
    return <LoadingScreen />;
  }
  
  // Show login screen if not authenticated (only in production mode)
  const isDevelopmentMode = !import.meta.env.VITE_KEYCLOAK_URL;
  if (!isDevelopmentMode && !isAuthenticated) {
    return <LoginScreen />;
  }
  
  // Show main app content when authenticated
  return (
    <>
      <Navigation />
      <Router />
      <Toaster />
    </>
  );
}

function App() {
  // Hook to instantly scroll to top on page navigation
  useScrollTop();
  
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;