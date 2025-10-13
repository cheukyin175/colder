/**
 * LoadingState Component
 *
 * Shows loading progress during profile analysis and message generation
 */

import React, { useEffect, useState } from 'react';

export type LoadingStep = 'extracting' | 'analyzing' | 'generating' | 'customizing';

interface LoadingStateProps {
  currentStep: LoadingStep;
  message?: string;
  estimatedTime?: number; // in seconds
}

const STEP_MESSAGES: Record<LoadingStep, string> = {
  extracting: 'Extracting LinkedIn profile...',
  analyzing: 'Analyzing profile for insights...',
  generating: 'Generating personalized message...',
  customizing: 'Applying customizations...'
};

const STEP_ICONS: Record<LoadingStep, string> = {
  extracting: '📋',
  analyzing: '🔍',
  generating: '✍️',
  customizing: '🎨'
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  currentStep,
  message,
  estimatedTime = 10
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dots, setDots] = useState(1);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Calculate progress percentage
  const progress = Math.min((elapsedTime / estimatedTime) * 100, 90);

  // Create animated dots string
  const animatedDots = '.'.repeat(dots) + ' '.repeat(3 - dots);

  return (
    <div className="w-full p-6 space-y-4">
      {/* Icon and Message */}
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">
          {STEP_ICONS[currentStep]}
        </div>
        <h3 className="text-lg font-medium text-gray-800">
          {message || STEP_MESSAGES[currentStep]}
          <span className="inline-block w-8 text-left">{animatedDots}</span>
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between text-xs">
        <StepIndicator
          step="extracting"
          label="Extract"
          isActive={currentStep === 'extracting'}
          isCompleted={getStepOrder(currentStep) > getStepOrder('extracting')}
        />
        <StepIndicator
          step="analyzing"
          label="Analyze"
          isActive={currentStep === 'analyzing'}
          isCompleted={getStepOrder(currentStep) > getStepOrder('analyzing')}
        />
        <StepIndicator
          step="generating"
          label="Generate"
          isActive={currentStep === 'generating'}
          isCompleted={getStepOrder(currentStep) > getStepOrder('generating')}
        />
      </div>

      {/* Time Estimate */}
      <div className="text-center text-sm text-gray-600">
        {elapsedTime > 0 && (
          <span>
            {elapsedTime}s elapsed
            {estimatedTime > elapsedTime && (
              <span> • ~{estimatedTime - elapsedTime}s remaining</span>
            )}
          </span>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>💡 Tip:</strong> {getStepTip(currentStep)}
        </p>
      </div>
    </div>
  );
};

// Helper Components
interface StepIndicatorProps {
  step: LoadingStep;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  label,
  isActive,
  isCompleted
}) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
          isCompleted ? 'bg-green-500 text-white' :
          isActive ? 'bg-blue-500 text-white animate-pulse' :
          'bg-gray-300 text-gray-600'
        }`}
      >
        {isCompleted ? '✓' : isActive ? '•' : ''}
      </div>
      <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
};

// Helper Functions
function getStepOrder(step: LoadingStep): number {
  const order: Record<LoadingStep, number> = {
    extracting: 1,
    analyzing: 2,
    generating: 3,
    customizing: 4
  };
  return order[step] || 0;
}

function getStepTip(step: LoadingStep): string {
  const tips: Record<LoadingStep, string> = {
    extracting: 'The extension is reading the LinkedIn profile to gather all relevant information.',
    analyzing: 'AI is identifying talking points and connection opportunities based on both profiles.',
    generating: 'Creating a personalized message that references specific details from the profile.',
    customizing: 'Applying your tone and length preferences to the message.'
  };
  return tips[step] || 'Processing your request...';
}