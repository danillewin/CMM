import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
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
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import "./lib/i18n"; // Initialize i18n

function Navigation() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="border-b mb-4">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Link href="/">
              <Button variant={location === "/" ? "default" : "ghost"}>
                {t('navigation.meetings')}
              </Button>
            </Link>
            <Link href="/researches">
              <Button variant={location === "/researches" ? "default" : "ghost"}>
                {t('navigation.researches')}
              </Button>
            </Link>
            <Link href="/roadmap">
              <Button variant={location === "/roadmap" ? "default" : "ghost"}>
                {t('navigation.roadmap')}
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant={location === "/calendar" ? "default" : "ghost"}>
                {t('navigation.calendar')}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant={location === "/dashboard" ? "default" : "ghost"}>
                {t('navigation.dashboard')}
              </Button>
            </Link>
            <Link href="/jtbds">
              <Button variant={location === "/jtbds" ? "default" : "ghost"}>
                {t('navigation.jtbds')}
              </Button>
            </Link>
          </div>
          <LanguageSwitcher />
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
    <QueryClientProvider client={queryClient}>
      <Navigation />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;