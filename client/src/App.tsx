import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HomePage from "@/pages/HomePage";
import DonationsPage from "@/pages/DonationsPage";
import CampaignDetailsPage from "@/pages/CampaignDetailsPage";
import CreateCampaignPage from "@/pages/CreateCampaignPage";
import EditCampaignPage from "@/pages/EditCampaignPage";
import ManageCampaignsPage from "@/pages/ManageCampaignsPage";
import BusinessNetworkPage from "@/pages/BusinessNetworkPage";
import BusinessProfilePage from "@/pages/BusinessProfilePage";
import MembershipCheckoutPage from "@/pages/MembershipCheckoutPage";
import DonationCheckoutPage from "@/pages/DonationCheckoutPage";
import DonationSuccessPage from "@/pages/DonationSuccessPage";
import ProfilePage from "@/pages/ProfilePage";
import SponsoredCreatorsPage from "@/pages/SponsoredCreatorsPage";
import SponsorshipApplicationPage from "@/pages/SponsorshipApplicationPageNew";
import CreatorsPage from "@/pages/CreatorsPage";
import CreatorProfilePage from "@/pages/CreatorProfilePage";
import CreatorProfileManagePage from "@/pages/CreatorProfileManagePage";
import AdminDashboard from "@/pages/AdminDashboard";
import AuthPage from "@/pages/AuthPage";
import AuthTestPage from "@/pages/AuthTestPage";
import AboutPage from "@/pages/AboutPage";
import FeedPage from "@/pages/FeedPage";
import ExplorePage from "@/pages/ExplorePage";
import CreatePage from "@/pages/CreatePage";
import ConnectPage from "@/pages/ConnectPage";
import MinistryProfilePage from "@/pages/MinistryProfilePage";
import MinistryCreatePage from "@/pages/MinistryCreatePage";
import EditProfilePage from "@/pages/EditProfilePage";
import CreatorSharePage from "@/pages/CreatorSharePage";
import CreatorSocialSharePage from "@/pages/CreatorSocialSharePage";
import MinistriesPage from "@/pages/MinistriesPage";
import MinistryProfileViewPage from "@/pages/MinistryProfileViewPage";
import EditMinistryProfilePage from "@/pages/EditMinistryProfilePage";
import EventCreatePage from "@/pages/EventCreatePage";
import PostPage from "@/pages/PostPage";

import PrivacySettingsPage from "@/pages/PrivacySettingsPage";
import BottomNavigation from "@/components/layout/BottomNavigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/donate" component={DonationsPage} />
      <Route path="/donate/create" component={CreateCampaignPage} />
      <Route path="/donate/edit/:id" component={EditCampaignPage} />
      <Route path="/donate/checkout/:campaignId" component={DonationCheckoutPage} />
      <Route path="/donate/success" component={DonationSuccessPage} />
      <Route path="/donate/:slug" component={CampaignDetailsPage} />
      <Route path="/manage-campaigns" component={ManageCampaignsPage} />
      <Route path="/business" component={BusinessNetworkPage} />
      <Route path="/business/profile/:id" component={BusinessProfilePage} />
      <Route path="/business-profile" component={BusinessNetworkPage} />
      <Route path="/ministry-profile" component={MinistryProfilePage} />
      <Route path="/ministry/create" component={MinistryCreatePage} />
      <Route path="/edit-ministry-profile" component={EditMinistryProfilePage} />
      <Route path="/membership/checkout/:tierId" component={MembershipCheckoutPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/profile/:username" component={ProfilePage} />
      <Route path="/edit-profile" component={EditProfilePage} />
      <Route path="/sponsored-creators" component={SponsoredCreatorsPage} />
      <Route path="/creators" component={CreatorsPage} />
      <Route path="/creators/:id" component={CreatorProfilePage} />
      <Route path="/creator-profile" component={CreatorProfileManagePage} />
      <Route path="/ministries" component={MinistriesPage} />
      <Route path="/ministry/:id" component={MinistryProfileViewPage} />
      <Route path="/sponsorship-application" component={SponsorshipApplicationPage} />
      <Route path="/apply-sponsorship" component={SponsorshipApplicationPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/auth-test" component={AuthTestPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/post/:id" component={PostPage} />
      <Route path="/ministry-post/:id" component={PostPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/create" component={CreatePage} />
      <Route path="/events/create" component={EventCreatePage} />
      <Route path="/creators/share" component={CreatorSocialSharePage} />
      <Route path="/creators/share/:platform" component={CreatorSharePage} />
      <Route path="/connect" component={ConnectPage} />

      <Route path="/privacy-settings" component={PrivacySettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Router />
      </main>
      <Footer />
      {user && <BottomNavigation />}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
