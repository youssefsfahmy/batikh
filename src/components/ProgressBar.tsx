import React from "react";

interface Step {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface ProgressBarProps {
  steps: Step[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps }) => {
  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => step.isCompleted).length;
  const currentStep = steps.find((step) => step.isActive);
  const currentStepIndex = currentStep ? currentStep.id - 1 : 0;

  const progressPercentage =
    totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-secondary-dark">
          {currentStep?.label || "Complete"}
        </h2>
        <span className="text-sm text-neutral-500">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
      </div>

      <div className="relative">
        {/* Progress bar background */}
        <div className="w-full bg-primary-100 rounded-full h-2">
          {/* Progress bar fill */}
          <div
            className="bg-gradient-to-r from-primary-600 to-primary-300 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-4">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step.isCompleted
                    ? "bg-primary text-white"
                    : step.isActive
                    ? "bg-primary text-white"
                    : "bg-primary-100 text-neutral-500"
                }`}
              >
                {step.isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className="text-xs text-neutral-600 mt-2 text-center max-w-20">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
