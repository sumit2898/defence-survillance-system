import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { useState, Suspense, lazy } from "react";
import { BootLoader } from "@/components/BootLoader";
import { ThemeProvider } from "@/components/theme-provider";

// Eager load Landing Page for instant paint
import LandingPage from "@/pages/LandingPage";

// Lazy load heavy dashboard components
const Home = lazy(() => import("@/pages/Home"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Monitoring = lazy(() => import("@/pages/Monitoring"));
const Alerts = lazy(() => import("@/pages/Alerts"));
const Devices = lazy(() => import("@/pages/Devices"));
const Logs = lazy(() => import("@/pages/Logs"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Playback = lazy(() => import("@/pages/Playback"));
const MapView = lazy(() => import("@/pages/MapView"));
const TacticalOverview = lazy(() => import("@/pages/TacticalOverview"));
const NeuralAnalytics = lazy(() => import("@/pages/NeuralAnalytics"));
const AutonomousShield = lazy(() => import("@/pages/AutonomousShield"));
// import BorderCommand from "./pages/BorderCommand";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<BootLoader />}>
        <Switch location={location} key={location}>
          {/* PRIMARY SYSTEM - Autonomous Shield AI */}
          <Route path="/" component={LandingPage} />
          <Route path="/system" component={AutonomousShield} />
          <Route path="/autonomous-shield" component={AutonomousShield} />

          {/* Intelligence & Analytics */}
          <Route path="/analytics" component={NeuralAnalytics} />
          <Route path="/tactical" component={TacticalOverview} />
          <Route path="/map" component={MapView} />

          {/* Classic Monitoring */}
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/monitoring" component={Monitoring} />
          <Route path="/playback" component={Playback} />
          <Route path="/alerts" component={Alerts} />

          {/* System Management */}
          <Route path="/devices" component={Devices} />
          <Route path="/logs" component={Logs} />
          <Route path="/settings" component={Settings} />
          <Route path="/home" component={Home} />

          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SmoothScroll>
          <TooltipProvider>
            <Toaster />
            <AnimatePresence>
              {!booted && <BootLoader onComplete={() => setBooted(true)} />}
            </AnimatePresence>
            {booted && <Router />}
          </TooltipProvider>
        </SmoothScroll>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
