import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { BootLoader } from "@/components/BootLoader";
import { ThemeProvider } from "@/components/theme-provider";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Monitoring from "@/pages/Monitoring";
import Alerts from "@/pages/Alerts";
import Devices from "@/pages/Devices";
import Logs from "@/pages/Logs";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

import Playback from "@/pages/Playback";
import MapView from "@/pages/MapView";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/monitoring" component={Monitoring} />
        <Route path="/playback" component={Playback} />
        <Route path="/map" component={MapView} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/devices" component={Devices} />
        <Route path="/logs" component={Logs} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <AnimatePresence>
            {!booted && <BootLoader onComplete={() => setBooted(true)} />}
          </AnimatePresence>
          {booted && <Router />}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
