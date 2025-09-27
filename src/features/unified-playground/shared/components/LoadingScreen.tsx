/**
 * Beautiful Loading Screen - 30-Second Wow Factor
 * Stunning loading experience with smooth animations and immediate visual impact
 */
/* eslint-disable react-refresh/only-export-components */

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Zap,
  Brain,
  Sparkles,
  Cpu,
  Bot,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
  showProgress?: boolean;
  variant?: 'minimal' | 'detailed' | 'showcase';
}

interface LoadingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
}

const loadingSteps: LoadingStep[] = [
  {
    id: 'init',
    label: 'Initializing Chrome AI DevBench',
    description: 'Setting up the playground environment',
    icon: <Cpu className="w-4 h-4" />,
    duration: 800,
  },
  {
    id: 'ai-check',
    label: 'Detecting AI Capabilities',
    description: 'Checking available Chrome AI APIs',
    icon: <Brain className="w-4 h-4" />,
    duration: 1200,
  },
  {
    id: 'design-system',
    label: 'Loading Design System',
    description: 'Preparing beautiful components',
    icon: <Sparkles className="w-4 h-4" />,
    duration: 600,
  },
  {
    id: 'apis',
    label: 'Preparing APIs',
    description: '7 Chrome AI APIs ready to explore',
    icon: <Bot className="w-4 h-4" />,
    duration: 1000,
  },
  {
    id: 'ready',
    label: 'Ready to Go!',
    description: 'Your AI playground is ready',
    icon: <Zap className="w-4 h-4" />,
    duration: 400,
  },
];

export function LoadingScreen({
  onComplete,
  duration = 4000,
  showProgress = true,
  variant = 'detailed',
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    let intervalId: number | undefined;

    if (variant === 'minimal') {
      // Simple progress animation for minimal variant
      intervalId = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 100 / (duration / 50);
          if (next >= 100) {
            clearInterval(intervalId);
            setIsComplete(true);
            setTimeout(() => onComplete?.(), 300);
            return 100;
          }
          return next;
        });
      }, 50);
    } else {
      // Step-by-step animation for detailed/showcase variants
      let stepIndex = 0;
      let stepProgress = 0;

      const animateSteps = () => {
        if (stepIndex < loadingSteps.length) {
          const step = loadingSteps[stepIndex];

          setCurrentStep(stepIndex);

          const stepDuration = (step.duration / duration) * duration;
          const stepInterval = setInterval(() => {
            stepProgress += 100 / (stepDuration / 50);

            if (stepProgress >= 100) {
              clearInterval(stepInterval);
              setCompletedSteps((prev) => new Set([...prev, step.id]));
              stepProgress = 0;
              stepIndex++;

              if (stepIndex < loadingSteps.length) {
                setTimeout(animateSteps, 100);
              } else {
                setIsComplete(true);
                setTimeout(() => onComplete?.(), 500);
              }
            }

            const totalProgress =
              (stepIndex / loadingSteps.length) * 100 +
              stepProgress / loadingSteps.length;
            setProgress(Math.min(totalProgress, 100));
          }, 50);
        }
      };

      animateSteps();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [duration, onComplete, variant]);

  // Minimal variant - simple and clean
  if (variant === 'minimal') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-fadeInUp">
          <Card className="p-8 max-w-md mx-auto text-center border-border/50 bg-background/95">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20" />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Chrome AI DevBench
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Loading your AI playground...
            </p>

            {showProgress && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Detailed/Showcase variants - full experience
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="animate-fadeInUp max-w-2xl w-full">
        <Card className="p-8 border-border/50 bg-background/95 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-600 to-green-500 animate-aiPulse" />
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-600 to-green-500 animate-ping opacity-20" />
                <div className="absolute inset-4 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
              Chrome AI DevBench
            </h1>
            <p className="text-lg text-muted-foreground">
              Interactive playground for Chrome&apos;s built-in AI APIs
            </p>
          </div>

          {/* Progress */}
          {showProgress && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Loading Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          {/* Loading Steps */}
          <div className="space-y-4">
            {loadingSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(step.id);
              const isPending = index > currentStep;

              return (
                <div
                  key={step.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg transition-all duration-300
                    ${isActive ? 'bg-muted/50 border border-border' : ''}
                    ${isCompleted ? 'opacity-75' : ''}
                    ${isPending ? 'opacity-40' : ''}
                  `}
                >
                  <div
                    className={`
                    flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-primary text-primary-foreground animate-pulse'
                          : 'bg-muted text-muted-foreground'
                    }
                  `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`
                      font-semibold transition-colors duration-300
                      ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                    `}
                    >
                      {step.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {isActive && (
                    <div className="animate-fadeInRight">
                      <Badge variant="secondary" className="animate-pulse">
                        Loading...
                      </Badge>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="animate-fadeInRight">
                      <Badge
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        ✓ Complete
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {isComplete && (
            <div className="mt-8 text-center animate-fadeInUp">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Ready to explore!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI playground is now ready. Let&apos;s build something
                amazing!
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Simple loading spinner component for smaller loading states
export function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
    </div>
  );
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);
  const toggleLoading = () => setIsLoading((prev) => !prev);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
  };
}
