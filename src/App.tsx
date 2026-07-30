import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect } from "react";
import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardErrorFallback from "@/components/DashboardErrorFallback";
import RoleRouter from "@/components/RoleRouter";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { stripLocalePrefix } from "@/lib/i18n/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SkipToContent from "@/components/SkipToContent";
import { BreadcrumbWrapper } from "@/components/BreadcrumbWrapper";
import SEOHead from "@/components/SEOHead";
import { AuroraBackground, SmoothScrollProvider } from "@/lib/motion";
import Index from "./pages/Index";
const OpsApp = lazy(() => import("./ops/OpsApp"));

// Lazy-loaded pages — keeps the initial bundle small
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const ConsultingForOrganizations = lazy(() => import("./pages/services/ConsultingForOrganizations"));
const Skool = lazy(() => import("./pages/Skool"));
const Resources = lazy(() => import("./pages/Resources"));
const Contact = lazy(() => import("./pages/Contact"));
const Legal = lazy(() => import("./pages/Legal"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const TalentInnovationHub = lazy(() => import("./pages/TalentInnovationHub"));
const MoroccanUmbrella = lazy(() => import("./pages/MoroccanUmbrella"));
const PsychologuesSansFrontieres = lazy(() => import("./pages/PsychologuesSansFrontieres"));
const Psychologists = lazy(() => import("./pages/Psychologists"));
const Press = lazy(() => import("./pages/Press"));
const PsychologistProfile = lazy(() => import("./pages/PsychologistProfile"));
const SpecialistPricing = lazy(() => import("./pages/SpecialistPricing"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Membership = lazy(() => import("./pages/Membership"));
const CenterHome = lazy(() => import("./pages/center/CenterHome"));
const SpaceView = lazy(() => import("./pages/center/SpaceView"));
const CenterProgress = lazy(() => import("./pages/center/Progress"));
const Auth = lazy(() => import("./pages/Auth"));
const MySpace = lazy(() => import("./pages/MySpace"));
const Apply = lazy(() => import("./pages/Apply"));
const ApplyWizard = lazy(() => import("./pages/apply/ApplyWizard"));
const ApplyOrganization = lazy(() => import("./pages/apply/ApplyOrganization"));
const GetMatched = lazy(() => import("./pages/GetMatched"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const SpecialistDashboard = lazy(() => import("./pages/SpecialistDashboard"));
const OrganizationDashboard = lazy(() => import("./pages/OrganizationDashboard"));
const AthleteHub = lazy(() => import("./pages/AthleteHub"));
const AssessmentLab = lazy(() => import("./pages/AssessmentLab"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Applications = lazy(() => import("./pages/admin/Applications"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminGrowthLeads = lazy(() => import("./pages/admin/GrowthLeads"));
const VideoCall = lazy(() => import("./pages/VideoCall"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MfaSetup = lazy(() => import("./pages/MfaSetup"));
const BrandGuidelines = lazy(() => import("./pages/BrandGuidelines"));
const Founder = lazy(() => import("./pages/Founder"));
const WhyUs = lazy(() => import("./pages/WhyUs"));
const BlogIndex = lazy(() => import("./pages/blog/BlogIndex"));
const FindRightPsychologist = lazy(() => import("./pages/blog/FindRightPsychologist"));
const DoINeedTherapy = lazy(() => import("./pages/blog/DoINeedTherapy"));
const UnderstandingAnxiety = lazy(() => import("./pages/blog/UnderstandingAnxiety"));
const BenefitsOnlineTherapy = lazy(() => import("./pages/blog/BenefitsOnlineTherapy"));
const MentalHealthAtWork = lazy(() => import("./pages/blog/MentalHealthAtWork"));
const UnderstandingDepression = lazy(() => import("./pages/blog/UnderstandingDepression"));
const HowToSupportALovedOne = lazy(() => import("./pages/blog/HowToSupportALovedOne"));
const MindfulnessForBeginners = lazy(() => import("./pages/blog/MindfulnessForBeginners"));
const HowToImproveFocus = lazy(() => import("./pages/blog/HowToImproveFocus"));
const HowToClearBrainFog = lazy(() => import("./pages/blog/HowToClearBrainFog"));
const FreeScore = lazy(() => import("./pages/FreeScore"));
const Observatoire = lazy(() => import("./pages/Observatoire"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const MentalPerformance = lazy(() => import("./pages/MentalPerformance"));
const MentalToughnessAthletes = lazy(() => import("./pages/MentalToughnessAthletes"));
const Invite = lazy(() => import("./pages/Invite"));
const ForAthletes = lazy(() => import("./pages/funnels/ForAthletes"));
const ForOrganizations = lazy(() => import("./pages/funnels/ForOrganizations"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Learn = lazy(() => import("./pages/Learn"));
const LearnCourse = lazy(() => import("./pages/LearnCourse"));
const BookingResponse = lazy(() => import("./pages/BookingResponse"));
const BookRedirect = lazy(() => import("./pages/BookRedirect"));
const Install = lazy(() => import("./pages/Install"));
const IntakeForm = lazy(() => import("./pages/IntakeForm"));
const CampaignFirstSession = lazy(() => import("./pages/campaigns/CampaignFirstSession"));
const CampaignJoinSpecialist = lazy(() => import("./pages/campaigns/CampaignJoinSpecialist"));

const LazyFallback = () => (
  <div className="flex-1 flex items-center justify-center py-20">
    <div className="h-6 w-6 motion-breathe rounded-full bg-primary/20" />
  </div>
);

const queryClient = new QueryClient();

// Theme mapper based on route patterns
const getThemeForRoute = (pathname: string): string => {
  const cleanPath = stripLocalePrefix(pathname);
  if (cleanPath === '/services/sport-psychology') return 'performance';
  if (cleanPath === '/services/consulting-for-organizations') return 'institutions';
  if (cleanPath === '/talent-innovation-hub') return 'innovation';
  if (cleanPath === '/skool') return 'skool';
  if (['/apply', '/my-space'].includes(cleanPath)) return 'accreditation';
  if (['/services', '/psychologists', '/get-matched'].some(route => cleanPath.startsWith(route))) return 'clinic';
  return 'default';
};

// Shared route definitions to avoid triplication
const AppRoutes = () => (
  <>
    <Route index element={<PageTransition><Index /></PageTransition>} />
    <Route path="about" element={<PageTransition><About /></PageTransition>} />
    <Route path="install" element={<PageTransition><Install /></PageTransition>} />
    <Route path="services" element={<PageTransition><Services /></PageTransition>} />
    <Route path="services/consulting-for-organizations" element={<PageTransition><ConsultingForOrganizations /></PageTransition>} />
    <Route path="skool" element={<PageTransition><Skool /></PageTransition>} />
    <Route path="resources" element={<PageTransition><Resources /></PageTransition>} />
    <Route path="contact" element={<PageTransition><Contact /></PageTransition>} />
    <Route path="legal" element={<PageTransition><Legal /></PageTransition>} />
    <Route path="privacy" element={<PageTransition><Privacy /></PageTransition>} />
    <Route path="terms" element={<PageTransition><Terms /></PageTransition>} />
    <Route path="talent-innovation-hub" element={<PageTransition><TalentInnovationHub /></PageTransition>} />
    <Route path="moroccan-umbrella" element={<PageTransition><MoroccanUmbrella /></PageTransition>} />
    <Route path="psf" element={<PageTransition><PsychologuesSansFrontieres /></PageTransition>} />
    <Route path="psychologists" element={<PageTransition><Psychologists /></PageTransition>} />
    <Route path="press" element={<PageTransition><Press /></PageTransition>} />
    <Route path="observatoire" element={<PageTransition><Observatoire /></PageTransition>} />
    <Route path="psychologists/:id" element={<PageTransition><PsychologistProfile /></PageTransition>} />
   <Route path="pricing-specialists" element={<PageTransition><SpecialistPricing /></PageTransition>} />
    <Route path="pricing" element={<PageTransition><Pricing /></PageTransition>} />
    <Route path="membership" element={<PageTransition><Membership /></PageTransition>} />
    <Route path="center" element={<PageTransition><CenterHome /></PageTransition>} />
    <Route path="center/c/:slug" element={<PageTransition><SpaceView /></PageTransition>} />
    <Route path="center/progress" element={<ProtectedRoute><PageTransition><CenterProgress /></PageTransition></ProtectedRoute>} />
    <Route path="auth" element={<PageTransition><Auth /></PageTransition>} />
    <Route path="apply" element={<PageTransition><Apply /></PageTransition>} />
    <Route path="apply/wizard" element={<ProtectedRoute><PageTransition><ApplyWizard /></PageTransition></ProtectedRoute>} />
    <Route path="apply/organization" element={<PageTransition><ApplyOrganization /></PageTransition>} />
    <Route path="reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
    <Route path="auth/mfa-setup" element={<ProtectedRoute><PageTransition><MfaSetup /></PageTransition></ProtectedRoute>} />
    <Route path="get-matched" element={<PageTransition><GetMatched /></PageTransition>} />
    <Route path="unsubscribe" element={<PageTransition><Unsubscribe /></PageTransition>} />
    <Route path="dashboard" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />
    <Route path="dashboard/client" element={<ProtectedRoute><PageTransition><ErrorBoundary fallback={<DashboardErrorFallback />}><PatientDashboard /></ErrorBoundary></PageTransition></ProtectedRoute>} />
    <Route path="dashboard/specialist" element={<ProtectedRoute role="psychologist"><PageTransition><ErrorBoundary fallback={<DashboardErrorFallback />}><SpecialistDashboard /></ErrorBoundary></PageTransition></ProtectedRoute>} />
    <Route path="dashboard/organization" element={<ProtectedRoute role="organization"><PageTransition><ErrorBoundary fallback={<DashboardErrorFallback />}><OrganizationDashboard /></ErrorBoundary></PageTransition></ProtectedRoute>} />
    <Route path="athlete-hub" element={<ProtectedRoute><PageTransition><AthleteHub /></PageTransition></ProtectedRoute>} />
    <Route path="assessments" element={<PageTransition><AssessmentLab /></PageTransition>} />
    <Route path="assessment-lab" element={<PageTransition><AssessmentLab /></PageTransition>} />
    <Route path="ai-assistant" element={<ProtectedRoute><PageTransition><AIAssistant /></PageTransition></ProtectedRoute>} />
    <Route path="my-space" element={<ProtectedRoute><PageTransition><MySpace /></PageTransition></ProtectedRoute>} />
    <Route path="notifications" element={<ProtectedRoute><PageTransition><Notifications /></PageTransition></ProtectedRoute>} />
    <Route path="admin" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
    <Route path="admin/applications" element={<AdminRoute><PageTransition><Applications /></PageTransition></AdminRoute>} />
    <Route path="admin/growth-leads" element={<AdminRoute><PageTransition><AdminGrowthLeads /></PageTransition></AdminRoute>} />
    <Route path="session/:sessionId" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
    <Route path="brand" element={<PageTransition><BrandGuidelines /></PageTransition>} />
    <Route path="founder" element={<PageTransition><Founder /></PageTransition>} />
    <Route path="why-us" element={<PageTransition><WhyUs /></PageTransition>} />
    <Route path="blog" element={<PageTransition><BlogIndex /></PageTransition>} />
    <Route path="blog/find-right-psychologist" element={<PageTransition><FindRightPsychologist /></PageTransition>} />
    <Route path="blog/do-i-need-therapy" element={<PageTransition><DoINeedTherapy /></PageTransition>} />
    <Route path="blog/understanding-anxiety" element={<PageTransition><UnderstandingAnxiety /></PageTransition>} />
    <Route path="blog/benefits-online-therapy" element={<PageTransition><BenefitsOnlineTherapy /></PageTransition>} />
    <Route path="blog/mental-health-at-work" element={<PageTransition><MentalHealthAtWork /></PageTransition>} />
    <Route path="blog/understanding-depression" element={<PageTransition><UnderstandingDepression /></PageTransition>} />
    <Route path="blog/how-to-support-a-loved-one" element={<PageTransition><HowToSupportALovedOne /></PageTransition>} />
    <Route path="blog/mindfulness-for-beginners" element={<PageTransition><MindfulnessForBeginners /></PageTransition>} />
    <Route path="blog/how-to-improve-focus" element={<PageTransition><HowToImproveFocus /></PageTransition>} />
    <Route path="blog/how-to-clear-brain-fog" element={<PageTransition><HowToClearBrainFog /></PageTransition>} />
    <Route path="free-score" element={<PageTransition><FreeScore /></PageTransition>} />
   <Route path="mental-performance" element={<PageTransition><MentalPerformance /></PageTransition>} />
    <Route path="mental-toughness-athletes" element={<PageTransition><MentalToughnessAthletes /></PageTransition>} />
    <Route path="invite/:code" element={<PageTransition><Invite /></PageTransition>} />
    <Route path="for-athletes" element={<PageTransition><ForAthletes /></PageTransition>} />
    <Route path="for-organizations" element={<PageTransition><ForOrganizations /></PageTransition>} />
    <Route path="learn" element={<PageTransition><Learn /></PageTransition>} />
    <Route path="learn/:slug" element={<PageTransition><LearnCourse /></PageTransition>} />
    <Route path="booking/respond/:token" element={<PageTransition><BookingResponse /></PageTransition>} />
    <Route path="b/:slug" element={<BookRedirect />} />
    <Route path="book-a-call" element={<PageTransition><Contact /></PageTransition>} />
    <Route path="intake" element={<ProtectedRoute><PageTransition><IntakeForm /></PageTransition></ProtectedRoute>} />
    <Route path="intake/:bookingId" element={<ProtectedRoute><PageTransition><IntakeForm /></PageTransition></ProtectedRoute>} />
    <Route path="campaigns/first-session" element={<PageTransition><CampaignFirstSession /></PageTransition>} />
    <Route path="campaigns/join-specialist" element={<PageTransition><CampaignJoinSpecialist /></PageTransition>} />
  </>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const isOps = location.pathname.startsWith("/ops");

  // Update body data-theme attribute based on current route
  useEffect(() => {
    const theme = getThemeForRoute(location.pathname);
    document.body.setAttribute('data-theme', theme);
  }, [location.pathname]);

  return (
    <>
      <SEOHead path={location.pathname} />
      <Suspense fallback={<LazyFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* UPSY OPS — standalone cinematic area, no shared chrome */}
          <Route path="/ops/*" element={<OpsApp />} />

          {/* Root locale (English / default) */}
          <Route path="/" element={<Outlet />}>
            {AppRoutes()}
          </Route>

          {/* Locale-prefixed routes */}
          <Route path="/:locale" element={<Outlet />}>
            {AppRoutes()}
          </Route>

          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      </Suspense>
    </>
  );
};

const AppShell = () => {
  const location = useLocation();
  const isOps = location.pathname.startsWith("/ops");
  if (isOps) {
    return (
      <div className="min-h-screen bg-background">
        <ScrollToTop />
        <AnimatedRoutes />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <SkipToContent />
      <AuroraBackground />
      <Header />
      <ScrollToTop />
      <BreadcrumbWrapper />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <AnimatedRoutes />
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LocaleProvider>
              <ErrorBoundary>
                <SmoothScrollProvider>
                  <AppShell />
                </SmoothScrollProvider>
              </ErrorBoundary>
            </LocaleProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
