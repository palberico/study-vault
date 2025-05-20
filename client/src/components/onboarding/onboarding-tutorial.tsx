import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, ChevronRight, BookOpen, Calendar, Upload, Link as LinkIcon, 
  ArrowRight, Book, FileText, Sparkles, Search, GraduationCap
} from 'lucide-react';

// Define the tutorial steps with more engaging descriptions
const tutorialSteps = [
  {
    title: 'Welcome to StudyVault',
    description: 'Your personal academic vault that stays with you even after graduation!',
    icon: <BookOpen className="h-12 w-12 text-primary" />,
    animation: 'fadeIn',
    details: 'StudyVault helps you organize all your coursework, assignments, and study materials in one place.',
  },
  {
    title: 'Long-term Access',
    description: 'Unlike university platforms that expire after graduation, your work stays accessible forever.',
    icon: <GraduationCap className="h-12 w-12 text-blue-500" />,
    animation: 'slideRight',
    details: 'No more worrying about losing access to your academic work when you graduate.',
  },
  {
    title: 'Create Courses',
    description: 'Start by adding your courses with details and optional syllabus uploads.',
    icon: <Book className="h-12 w-12 text-indigo-500" />,
    animation: 'bounce',
    details: 'Click "Add Course" to create a new course. Add the course code, name, description, and term.',
  },
  {
    title: 'Manage Assignments',
    description: 'Track assignments with due dates, descriptions, and completion status.',
    icon: <Calendar className="h-12 w-12 text-green-500" />,
    animation: 'pulse',
    details: 'Each assignment can have a title, description, due date, and status (pending, submitted, or overdue).',
  },
  {
    title: 'Upload Files',
    description: 'Attach documents, images, and other files to assignments for easy reference.',
    icon: <Upload className="h-12 w-12 text-orange-500" />,
    animation: 'slideUp',
    details: 'Upload essays, research papers, presentations, or any other files related to your assignments.',
  },
  {
    title: 'Add Resource Links',
    description: 'Save important URLs with custom labels for quick access to online resources.',
    icon: <LinkIcon className="h-12 w-12 text-purple-500" />,
    animation: 'rotate',
    details: 'Add links to research papers, references, videos, or any online resources needed for your assignments.',
  },
  {
    title: 'Search & Filter',
    description: 'Easily find what you need with powerful search and filtering options.',
    icon: <Search className="h-12 w-12 text-rose-500" />,
    animation: 'slideLeft',
    details: 'Search through your assignments, filter by course, status, or date to find exactly what you need quickly.',
  },
  {
    title: "You're All Set!",
    description: 'You now have a permanent home for all your academic work!',
    icon: <Sparkles className="h-12 w-12 text-amber-500" />,
    animation: 'tada',
    details: 'Start building your academic repository that will remain accessible long after graduation.',
  }
];

// Enhanced animations for a more engaging experience
const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0 }
  },
  slideRight: {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { x: 50, opacity: 0 }
  },
  slideLeft: {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { x: -50, opacity: 0 }
  },
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { y: -50, opacity: 0 }
  },
  bounce: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 17 } },
    exit: { scale: 1.2, opacity: 0 }
  },
  pulse: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: [0.9, 1, 0.95, 1], 
      opacity: 1,
      transition: {
        scale: {
          repeat: 1,
          repeatType: "reverse" as const,
          duration: 1,
        }
      }
    },
    exit: { scale: 0.9, opacity: 0 }
  },
  rotate: {
    initial: { rotate: -10, scale: 0.9, opacity: 0 },
    animate: { 
      rotate: 0, 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    exit: { rotate: 10, scale: 0.9, opacity: 0 }
  },
  tada: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: [0.9, 1.1, 1, 1.05, 1],
      rotate: [0, -3, 3, -3, 0],
      opacity: 1,
      transition: {
        duration: 1
      }
    },
    exit: { scale: 1.1, opacity: 0 }
  }
};

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  // Keyboard shortcut handler is defined lower in the component
  // We'll define it here after the handleSkip function is created
  
  // Auto-advance for the first step after 4 seconds
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep]);
  
  // Safety check - if tutorial is stuck, provide an escape hatch
  useEffect(() => {
    const escapeHatch = setTimeout(() => {
      if (showTutorial) {
        console.log("Tutorial safety timeout triggered");
        // Only run this if the tutorial is still showing after 60 seconds
        try {
          localStorage.setItem('onboardingCompleted', 'true');
          setShowTutorial(false);
        } catch (error) {
          console.error("Error in tutorial escape hatch:", error);
        }
      }
    }, 60000); // 60 seconds safety timeout
    
    return () => clearTimeout(escapeHatch);
  }, []);
  
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    try {
      setIsExiting(true);
      setTimeout(() => {
        setShowTutorial(false);
        onComplete();
      }, 500);
    } catch (error) {
      console.error("Error completing tutorial:", error);
      setShowTutorial(false);
      onComplete();
    }
  };
  
  const handleSkip = () => {
    try {
      setIsExiting(true);
      setTimeout(() => {
        setShowTutorial(false);
        onSkip();
      }, 500);
    } catch (error) {
      console.error("Error skipping tutorial:", error);
      setShowTutorial(false);
      onSkip();
    }
  };
  
  // Keyboard shortcut to escape tutorial with ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, []);
  
  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };
  
  const currentAnimationType = tutorialSteps[currentStep].animation as keyof typeof animations;
  const currentAnimation = animations[currentAnimationType];
  
  return (
    <AnimatePresence>
      {showTutorial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="max-w-md w-full"
          >
            <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
              <CardHeader className="pb-3 relative">
                {/* Background glow effect */}
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br transition-colors duration-500 ${
                  currentStep === 0 ? 'from-blue-300 to-indigo-500' : 
                  currentStep === 1 ? 'from-blue-300 to-cyan-500' :
                  currentStep === 2 ? 'from-indigo-300 to-blue-600' :
                  currentStep === 3 ? 'from-green-300 to-teal-600' :
                  currentStep === 4 ? 'from-orange-300 to-amber-600' :
                  currentStep === 5 ? 'from-purple-300 to-violet-600' :
                  currentStep === 6 ? 'from-rose-300 to-pink-600' :
                  'from-amber-300 to-yellow-600'
                }`}></div>
                
                <div className="w-full flex justify-center mb-4 relative z-10">
                  <motion.div
                    key={currentStep}
                    initial={currentAnimation.initial}
                    animate={currentAnimation.animate}
                    exit={currentAnimation.exit}
                    className={`p-3 rounded-full ${
                      currentStep === 0 ? 'bg-blue-100 text-primary' : 
                      currentStep === 1 ? 'bg-blue-100 text-blue-500' :
                      currentStep === 2 ? 'bg-indigo-100 text-indigo-500' :
                      currentStep === 3 ? 'bg-green-100 text-green-500' :
                      currentStep === 4 ? 'bg-orange-100 text-orange-500' :
                      currentStep === 5 ? 'bg-purple-100 text-purple-500' :
                      currentStep === 6 ? 'bg-rose-100 text-rose-500' :
                      'bg-amber-100 text-amber-500'
                    }`}
                  >
                    {tutorialSteps[currentStep].icon}
                  </motion.div>
                </div>
                
                <CardTitle className="text-center text-xl z-10 relative">
                  {tutorialSteps[currentStep].title}
                </CardTitle>
                
                <CardDescription className="text-center pt-2 z-10 relative text-slate-700 font-medium">
                  {tutorialSteps[currentStep].description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3">
                <p className="text-sm text-slate-600 mb-4 text-center px-2">
                  {tutorialSteps[currentStep].details}
                </p>
                
                <div className="flex justify-center items-center space-x-1">
                  {tutorialSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleStepClick(index)}
                      className={`h-2 rounded-full transition-all duration-300 focus:outline-none ${
                        index === currentStep 
                          ? 'w-8 bg-primary' 
                          : index < currentStep 
                            ? 'w-2 bg-primary/60 hover:bg-primary/80' 
                            : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-0">
                <div>
                  {currentStep > 0 ? (
                    <Button 
                      variant="outline"
                      onClick={handleBack}
                      size="sm"
                      className="gap-1"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Back
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={handleSkip}
                      size="sm"
                    >
                      Skip Tour
                    </Button>
                  )}
                </div>
                
                <Button 
                  onClick={handleNext} 
                  className="gap-2"
                  variant={currentStep === tutorialSteps.length - 1 ? "default" : "default"}
                  size={currentStep === tutorialSteps.length - 1 ? "default" : "sm"}
                >
                  {currentStep < tutorialSteps.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}