import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HomePage from "@/pages/HomePage";
import DonationsPage from "@/pages/DonationsPage";
import CampaignDetailsPage from "@/pages/CampaignDetailsPage";
import CreateCampaignPage from "@/pages/CreateCampaignPage";
import BusinessNetworkPage from "@/pages/BusinessNetworkPage";
import MembershipCheckoutPage from "@/pages/MembershipCheckoutPage";
import DonateCheckoutPage from "@/pages/DonateCheckoutPage";
import ProfilePage from "@/pages/ProfilePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/donate" component={DonationsPage} />
      <Route path="/campaigns/create" component={CreateCampaignPage} />
      <Route path="/campaigns/:slug" component={CampaignDetailsPage} />
      <Route path="/business" component={BusinessNetworkPage} />
      <Route path="/membership/checkout/:tierId" component={MembershipCheckoutPage} />
      <Route path="/donate/checkout/:campaignId" component={DonateCheckoutPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Header />
          <main className="min-h-screen">
            <Router />
          </main>
          <Footer />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
