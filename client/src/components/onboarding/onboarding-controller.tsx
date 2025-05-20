import { useState, useEffect } from 'react';
import OnboardingTutorial from './onboarding-tutorial';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function OnboardingController() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has completed onboarding
  useEffect(() => {
    try {
      // We only want to show the tutorial when the user is logged in
      if (!user) return;
      
      // Short delay to let the app render first
      const timer = setTimeout(() => {
        // Check if this user has completed the onboarding
        const onboardingKey = `onboardingCompleted_${user.uid || 'guest'}`;
        const onboardingCompleted = localStorage.getItem(onboardingKey);
        
        // If onboarding hasn't been completed, show the tutorial
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }
      }, 1500); // Longer delay to ensure app is fully loaded
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Error in onboarding controller:", error);
      // If there's an error, disable the tutorial to prevent blocking the app
      setTutorialEnabled(false);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    try {
      setShowOnboarding(false);
      // Save completion status for this specific user
      const onboardingKey = `onboardingCompleted_${user?.uid || 'guest'}`;
      localStorage.setItem(onboardingKey, 'true');
      
      toast({
        title: "Welcome to StudyVault!",
        description: "You're all set to start organizing your academic work.",
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleOnboardingSkip = () => {
    try {
      setShowOnboarding(false);
      // Save skip status for this specific user
      const onboardingKey = `onboardingCompleted_${user?.uid || 'guest'}`;
      localStorage.setItem(onboardingKey, 'true');
      
      toast({
        title: "Tutorial skipped",
        description: "You can access the tutorial anytime from the help button.",
        duration: 4000,
      });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  const handleRestartTutorial = () => {
    setShowOnboarding(true);
  };

  // If tutorial is disabled due to errors, don't render anything
  if (!tutorialEnabled) return null;

  return (
    <>
      {showOnboarding && user ? (
        <OnboardingTutorial 
          onComplete={handleOnboardingComplete} 
          onSkip={handleOnboardingSkip} 
        />
      ) : (
        <div className="fixed bottom-4 right-4 z-30">
          <Button 
            onClick={handleRestartTutorial}
            size="sm"
            variant="outline"
            className="rounded-full w-10 h-10 p-0 shadow-md hover:shadow-lg transition-all bg-white/90"
            title="Show Tutorial"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help & Tutorial</span>
          </Button>
        </div>
      )}
    </>
  );
}