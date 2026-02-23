import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import RoleSetup from "./pages/RoleSetup";
import LogActivity from "./pages/LogActivity";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Stats from "./pages/Stats";

function Router() {
  return (
    <Switch>
      {/* Role setup — full page, no sidebar */}
      <Route path="/setup" component={RoleSetup} />

      {/* All other routes use DashboardLayout */}
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/log" component={LogActivity} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/history" component={History} />
            <Route path="/stats" component={Stats} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
