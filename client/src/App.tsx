import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Meetings from "@/pages/meetings";
import Researches from "@/pages/researches";
import Calendar from "@/pages/calendar";
import Dashboard from "@/pages/dashboard";
import Roadmap from "@/pages/roadmap";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b mb-4">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-4">
          <Link href="/">
            <Button variant={location === "/" ? "default" : "ghost"}>
              Meetings
            </Button>
          </Link>
          <Link href="/researches">
            <Button variant={location === "/researches" ? "default" : "ghost"}>
              Researches
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant={location === "/calendar" ? "default" : "ghost"}>
              Calendar
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant={location === "/dashboard" ? "default" : "ghost"}>
              Dashboard
            </Button>
          </Link>
          <Link href="/roadmap">
            <Button variant={location === "/roadmap" ? "default" : "ghost"}>
              Roadmap
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Meetings} />
      <Route path="/researches" component={Researches} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/roadmap" component={Roadmap} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;