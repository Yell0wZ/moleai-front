import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Pages from "@/pages/index.jsx";
import WelcomeOnboarding from "@/pages/WelcomeOnboarding.jsx";
import { Toaster } from "@/components/ui/toaster";
import { Lordicon } from "@/components/ui/lordicon";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import { BusinessProfile, Persona } from "@/api/entities";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";

function AppContent() {
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setNeedsOnboarding(false);
      setCheckingProfile(false);
      return;
    }

    setCheckingProfile(true);

    try {

      // Check if business profile exists
      let businessProfileExists = false;
      let hasPersonas = false;

      try {
        businessProfileExists = await BusinessProfile.checkExists();
      } catch (error) {
        businessProfileExists = false;
      }

      try {
        // Check if personas exist (this will return [] if no personas, not fall back to mock data)
        const personas = await Persona.list();
        hasPersonas = personas && personas.length > 0;
      } catch (error) {
        hasPersonas = false;
      }

      // Needs onboarding if no business profile OR no personas
      const needsOnboarding = !businessProfileExists || !hasPersonas;

      setNeedsOnboarding(needsOnboarding);

    } catch (error) {
      console.error("Failed to check onboarding status:", error);
      setNeedsOnboarding(true);
    } finally {
      setCheckingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      checkOnboardingStatus();
    }
  }, [loading, checkOnboardingStatus]);

  const handleOnboardingComplete = useCallback(async () => {
    setNeedsOnboarding(false);
    await checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  if (loading || checkingProfile) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Lordicon size="lg" variant="primary" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LanguageProvider>
        <Login />
      </LanguageProvider>
    );
  }

  if (needsOnboarding) {
    return (
      <LanguageProvider>
        <WelcomeOnboarding onComplete={handleOnboardingComplete} />
        <Toaster />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <Pages />
      <Toaster />
    </LanguageProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 
