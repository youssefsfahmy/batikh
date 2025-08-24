import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProgressBar from "@/components/ProgressBar";
import Step1PartySearch from "@/components/PartySearch";
import Step3PrayerRSVP from "@/components/CombinedRSVP";
import PartyOnlyRSVP from "@/components/PartyOnlyRSVP";
import Step6Confirmation from "@/components/Confirmation";
import { submitRSVP, getParty } from "@/utils/firebase";
import type { FormState, Party, GuestRSVP, YesNo } from "@/types/rsvp";

interface StepInfo {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

const RSVPForm: React.FC = () => {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    rsvpsByGuest: {},
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingParty, setIsLoadingParty] = useState(false);

  // Auto-load party if partyId is in query params
  useEffect(() => {
    const loadPartyFromQuery = async () => {
      const { partyId } = router.query;
      if (partyId && typeof partyId === "string" && !formState.party) {
        setIsLoadingParty(true);
        try {
          const party = await getParty(partyId);
          if (party) {
            handlePartySelect(party);
            // Skip to step 2 if party is found
            setCurrentStep(2);
          } else {
            setError("Party not found. Please search for your invitation.");
          }
        } catch (error) {
          console.error("Error loading party:", error);
          setError("Failed to load party. Please try searching manually.");
        } finally {
          setIsLoadingParty(false);
        }
      }
    };

    if (router.isReady) {
      loadPartyFromQuery();
    }
  }, [router.isReady, router.query, formState.party]);

  const getStepsForParty = (): StepInfo[] => {
    return [
      { id: 1, label: "Find Invitation", isActive: false, isCompleted: false },
      {
        id: 2,
        label: "RSVP",
        isActive: false,
        isCompleted: false,
      },
      {
        id: 3,
        label: "Confirmation",
        isActive: false,
        isCompleted: false,
      },
    ];
  };

  const getCurrentSteps = (): StepInfo[] => {
    const steps = getStepsForParty();

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
        // Combined RSVP & Meal Selection step
        if (!formState.party) return true;

        // Check that all guests have made their RSVP decision
        const allHaveRSVP = formState.party.members.every((member) => {
          const rsvp = formState.rsvpsByGuest[member.id];

          // For party-only invitations, only check party RSVP
          if (
            !formState.party?.invitedToPrayer &&
            formState.party?.invitedToParty
          ) {
            return rsvp?.rsvpParty !== undefined;
          }

          // For combined invitations, check both prayer and party RSVP
          return (
            rsvp?.rsvpPrayer !== undefined && rsvp?.rsvpParty !== undefined
          );
        });

        // Check that guests attending (either prayer or party) have selected meals
        const attendingGuests = formState.party.members.filter((member) => {
          const rsvp = formState.rsvpsByGuest[member.id];
          return rsvp?.rsvpPrayer === "yes";
        });
        const allAttendingHaveMeals = attendingGuests.every(
          (member) => formState.rsvpsByGuest[member.id]?.meal
        );

        return allHaveRSVP && allAttendingHaveMeals;
      case 3:
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
          email: member.email || "",
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

  const handleCombinedRSVPChange = (
    guestId: string,
    rsvpPrayer: YesNo,
    rsvpParty: YesNo
  ) => {
    setFormState((prev) => ({
      ...prev,
      rsvpsByGuest: {
        ...prev.rsvpsByGuest,
        [guestId]: {
          ...prev.rsvpsByGuest[guestId],
          rsvpPrayer,
          rsvpParty,
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

  const handleMealChange = (guestId: string, meal: "chicken" | "veal") => {
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleNext = () => {
    console.log("handleNext called", formState);
    if (currentStep === 1 && formState.party?.confirmationCode) {
      window.location.href = `/rsvp/${formState.party.confirmationCode}`;
      return;
    }
    if (canGoNext) {
      setCurrentStep(currentStep + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep === 1) {
      window.location.href = "/"; // Redirect to home page
    }
    if (currentStep === 2) {
      // Check if we auto-loaded from query param
      const { partyId } = router.query;
      if (partyId && typeof partyId === "string") {
        // If we came from a direct link, go back to home
        window.location.href = "/";
      } else {
        // Otherwise, go back to party search
        setFormState((prev) => ({
          ...prev,
          rsvpsByGuest: {},
          party: undefined,
        }));
        setError(null);
        setCurrentStep(1);
      }
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }

    // scroll to top on step change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canGoNext =
    isStepValid(currentStep) && currentStep < getCurrentSteps().length;
  const canGoBack =
    currentStep === 1 ||
    (currentStep > 1 &&
      !formState.confirmationCode &&
      !formState.party?.confirmationCode);

  const renderCurrentStep = () => {
    if (isLoadingParty) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your invitation...</p>
        </div>
      );
    }

    if (!formState.party) {
      return (
        <Step1PartySearch
          onPartySelect={handlePartySelect}
          selectedParty={formState.party}
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <Step1PartySearch
            onPartySelect={handlePartySelect}
            selectedParty={formState.party}
          />
        );
      case 2:
        if (
          formState.party?.invitedToPrayer &&
          formState.party?.invitedToParty
        ) {
          return (
            <Step3PrayerRSVP
              guests={formState.party.members}
              rsvpsByGuest={formState.rsvpsByGuest}
              onRSVPChange={handleCombinedRSVPChange}
              onMealChange={handleMealChange}
              onDietaryNotesChange={handleDietaryNotesChange}
              invitedToPrayer={formState.party.invitedToPrayer || false}
            />
          );
        } else {
          return (
            <PartyOnlyRSVP
              guests={formState.party.members}
              rsvpsByGuest={formState.rsvpsByGuest}
              onRSVPChange={(guestId, value) =>
                handleRSVPChange(guestId, "rsvpParty", value)
              }
              onNoteChange={(guestId, value) =>
                handleNoteChange(guestId, "noteParty", value)
              }
            />
          );
        }

      default:
        return (
          <Step6Confirmation
            party={formState.party}
            guests={formState.party.members}
            rsvpsByGuest={formState.rsvpsByGuest}
            confirmationCode={
              formState.confirmationCode || formState.party.confirmationCode
            }
            isSubmitted={!!formState.confirmationCode}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-2xl mx-auto px-2">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-neutral-300">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-dark mb-2">
              Engagement RSVP
            </h1>
            <p className="text-neutral-600">
              Please complete the form below to confirm your attendance
            </p>
          </div>

          {/* Progress Bar */}
          <ProgressBar steps={getCurrentSteps()} />

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-primary font-medium">{error}</p>
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
            <div className="flex justify-between pt-6 border-t border-neutral-300">
              <button
                onClick={handleBack}
                disabled={!canGoBack}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  canGoBack
                    ? "bg-primary-100 text-primary hover:bg-neutral-200"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
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
                      ? "bg-primary text-white hover:bg-accent-hover shadow-lg"
                      : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
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
