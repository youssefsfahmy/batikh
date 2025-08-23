import React, { useState } from "react";
import ProgressBar from "@/components/ProgressBar";
import Step1PartySearch from "@/components/Step1PartySearch";
import Step3PrayerRSVP from "@/components/Step3PrayerRSVP";
import Step4PartyRSVP from "@/components/Step5PartyRSVP";
import Step6Confirmation from "@/components/Step6Confirmation";
import { submitRSVP } from "@/utils/firebase";
import type { FormState, Party, GuestRSVP, YesNo } from "@/types/rsvp";

interface StepInfo {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

const RSVPForm: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    rsvpsByGuest: {},
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStepsForParty = (party?: Party): StepInfo[] => {
    const baseSteps = [
      { id: 1, label: "Find Party", isActive: false, isCompleted: false },
    ];

    if (!party) return baseSteps;

    let stepId = 2;
    const dynamicSteps: StepInfo[] = [];

    if (party.invitedToPrayer) {
      dynamicSteps.push({
        id: stepId++,
        label: "Prayer RSVP",
        isActive: false,
        isCompleted: false,
      });
    }

    if (party.invitedToParty) {
      dynamicSteps.push({
        id: stepId++,
        label: "Party RSVP",
        isActive: false,
        isCompleted: false,
      });
    }

    dynamicSteps.push({
      id: stepId,
      label: "Confirm",
      isActive: false,
      isCompleted: false,
    });

    return [...baseSteps, ...dynamicSteps];
  };

  const getCurrentSteps = (): StepInfo[] => {
    const steps = getStepsForParty(formState.party);

    return steps.map((step) => ({
      ...step,
      isActive: step.id === currentStep,
      isCompleted:
        step.id < currentStep ||
        (step.id <= currentStep && isStepValid(step.id)),
    }));
  };

  const isStepValid = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return !!formState.party;
      case 2:
        // Prayer RSVP & Meal Selection step
        if (!formState.party?.invitedToPrayer) return true;

        // Check that all guests have made prayer RSVP decision
        const allHavePrayerRSVP = formState.party.members.every(
          (member) => formState.rsvpsByGuest[member.id]?.rsvpPrayer
        );

        // Check that guests attending prayer have selected meals
        const attendingPrayer = formState.party.members.filter(
          (member) => formState.rsvpsByGuest[member.id]?.rsvpPrayer === "yes"
        );
        const allAttendingHaveMeals = attendingPrayer.every(
          (member) => formState.rsvpsByGuest[member.id]?.meal
        );

        return allHavePrayerRSVP && allAttendingHaveMeals;
      case 3:
        // Party RSVP step
        if (!formState.party?.invitedToParty) return true;
        return formState.party.members.every(
          (member) => formState.rsvpsByGuest[member.id]?.rsvpParty
        );
      case 4:
        return true; // Confirmation step is always valid to view
      default:
        return false;
    }
  };

  const handlePartySelect = (party: Party) => {
    setFormState((prev) => ({
      ...prev,
      party,
      rsvpsByGuest: party.members.reduce((acc, member) => {
        acc[member.id] = {
          guestId: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
        };
        return acc;
      }, {} as Record<string, GuestRSVP>),
    }));
    setError(null);
  };

  const handleRSVPChange = (
    guestId: string,
    field: "rsvpPrayer" | "rsvpParty",
    value: YesNo
  ) => {
    setFormState((prev) => ({
      ...prev,
      rsvpsByGuest: {
        ...prev.rsvpsByGuest,
        [guestId]: {
          ...prev.rsvpsByGuest[guestId],
          [field]: value,
        },
      },
    }));
  };

  const handleNoteChange = (
    guestId: string,
    field: "notePrayer" | "noteParty",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      rsvpsByGuest: {
        ...prev.rsvpsByGuest,
        [guestId]: {
          ...prev.rsvpsByGuest[guestId],
          [field]: value,
        },
      },
    }));
  };

  const handleMealChange = (guestId: string, meal: "chicken" | "beef") => {
    setFormState((prev) => ({
      ...prev,
      rsvpsByGuest: {
        ...prev.rsvpsByGuest,
        [guestId]: {
          ...prev.rsvpsByGuest[guestId],
          meal,
        },
      },
    }));
  };

  const handleDietaryNotesChange = (guestId: string, dietaryNotes: string) => {
    setFormState((prev) => ({
      ...prev,
      rsvpsByGuest: {
        ...prev.rsvpsByGuest,
        [guestId]: {
          ...prev.rsvpsByGuest[guestId],
          dietaryNotes,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    if (!formState.party) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const confirmationCode = await submitRSVP(
        formState.party.id,
        formState.party.label,
        formState.party.invitedToPrayer,
        formState.party.invitedToParty,
        undefined, // No submittingGuestId needed
        formState.rsvpsByGuest
      );

      setFormState((prev) => ({ ...prev, confirmationCode }));
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit RSVP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      const steps = getCurrentSteps();
      console.log(steps);
      const nextStep = steps.find((s) => s.id > currentStep);
      console.log("Next step:", nextStep);
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoNext =
    isStepValid(currentStep) && currentStep < getCurrentSteps().length;
  const canGoBack = currentStep > 1 && !formState.confirmationCode;

  const renderCurrentStep = () => {
    const steps = getCurrentSteps();
    console.log("Current steps:", steps);
    console.log("Current step ID:", currentStep);
    const prayerStep = steps.find((s) => s.label.includes("Prayer"));
    const partyStep = steps.find((s) => s.label.includes("Party RSVP"));
    console.log("partyStep:", partyStep);

    switch (currentStep) {
      case 1:
        return (
          <Step1PartySearch
            onPartySelect={handlePartySelect}
            selectedParty={formState.party}
          />
        );
      default:
        if (prayerStep && currentStep === prayerStep.id) {
          return formState.party ? (
            <Step3PrayerRSVP
              guests={formState.party.members}
              rsvpsByGuest={formState.rsvpsByGuest}
              onRSVPChange={(guestId, value) =>
                handleRSVPChange(guestId, "rsvpPrayer", value)
              }
              onNoteChange={(guestId, value) =>
                handleNoteChange(guestId, "notePrayer", value)
              }
              onMealChange={handleMealChange}
              onDietaryNotesChange={handleDietaryNotesChange}
            />
          ) : null;
        }
        if (partyStep && currentStep === partyStep.id) {
          return formState.party ? (
            <Step4PartyRSVP
              guests={formState.party.members}
              rsvpsByGuest={formState.rsvpsByGuest}
              onRSVPChange={(guestId, value) =>
                handleRSVPChange(guestId, "rsvpParty", value)
              }
              onNoteChange={(guestId, value) =>
                handleNoteChange(guestId, "noteParty", value)
              }
            />
          ) : null;
        }
        // Confirmation step
        return formState.party ? (
          <Step6Confirmation
            party={formState.party}
            guests={formState.party.members}
            rsvpsByGuest={formState.rsvpsByGuest}
            confirmationCode={formState.confirmationCode}
            isSubmitted={!!formState.confirmationCode}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        ) : null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Engagement RSVP
            </h1>
            <p className="text-gray-600">
              Please complete the form below to confirm your attendance
            </p>
          </div>

          {/* Progress Bar */}
          <ProgressBar steps={getCurrentSteps()} />

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step Content with Animation */}
          <div className="mb-8">
            <div className="transition-all duration-300 ease-in-out">
              {renderCurrentStep()}
            </div>
          </div>

          {/* Navigation Buttons */}
          {!formState.confirmationCode && (
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={!canGoBack}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  canGoBack
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
              >
                ← Back
              </button>

              {currentStep < getCurrentSteps().length ? (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    canGoNext
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Next →
                </button>
              ) : (
                <div /> // Placeholder for layout
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSVPForm;
