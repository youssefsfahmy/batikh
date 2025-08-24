import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getPartyByConfirmationCode } from "@/utils/firebase";
import type { Party, GuestRSVP } from "@/types/rsvp";

const SubmissionViewPage: React.FC = () => {
  const router = useRouter();
  const { id: confirmationCode } = router.query;

  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationCode || typeof confirmationCode !== "string") {
      return;
    }

    const fetchSubmission = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const partyData = await getPartyByConfirmationCode(confirmationCode);

        if (!partyData || !partyData.confirmationCode) {
          setError(
            "RSVP submission not found. Please check your confirmation code."
          );
          return;
        }
        console.log("Fetched party data:", partyData);
        setParty(partyData);
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError("Failed to load RSVP details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [confirmationCode]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRSVPSummary = (guests: GuestRSVP[]) => {
    const prayerYes = guests.filter((g) => g.rsvpPrayer === "yes").length;
    const partyYes = guests.filter((g) => g.rsvpParty === "yes").length;
    const meals = guests.filter((g) => g.meal).map((g) => g.meal);

    return {
      prayerAttending: prayerYes,
      partyAttending: partyYes,
      totalGuests: guests.length,
      meals: meals.reduce((acc, meal) => {
        acc[meal!] = (acc[meal!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-neutral-600">
                Loading your RSVP details...
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <h1 className="text-2xl font-bold text-neutral-dark mb-4">
                RSVP Not Found
              </h1>
              <p className="text-neutral-600 mb-6">{error}</p>
              <button
                onClick={() => router.push("/form")}
                className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Submit New RSVP
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!party) return null;

  const summary = getRSVPSummary(party.guests || []);

  return (
    <main className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Thank You Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">
              Thank You for Your RSVP!
            </h1>
            <p className="text-lg text-neutral-600 mb-4">
              We&apos;re excited to celebrate with you, Youssef & Sandra&apos;s
              special day!
            </p>
            <div className="bg-primary-light border border-primary-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-primary-600 font-medium">
                Confirmation Code:{" "}
                <span className="font-bold text-primary-dark">
                  {party.confirmationCode}
                </span>
              </p>
              <p className="text-xs text-primary-500 mt-1">
                Submitted on {formatDate(party.createdAt || 0)}
              </p>
            </div>
          </div>

          {/* RSVP Summary */}
          <div className="bg-secondary-light border border-secondary-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-secondary-dark mb-4">
              Your RSVP Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-neutral-dark">
                  {summary.totalGuests}
                </div>
                <div className="text-sm text-neutral-600">Total Guests</div>
              </div>
              {summary.prayerAttending > 0 && (
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {summary.prayerAttending}
                  </div>
                  <div className="text-sm text-neutral-600">
                    Attending Prayer
                  </div>
                </div>
              )}
              {summary.partyAttending > 0 && (
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-accent-600">
                    {summary.partyAttending}
                  </div>
                  <div className="text-sm text-neutral-600">
                    Attending Party
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Guest Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">
              Guest Details
            </h2>
            <div className="space-y-4">
              {(party.guests || []).map((guest, index) => (
                <div
                  key={index}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg p-4"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-neutral-dark text-lg">
                        {guest.firstName} {guest.lastName}
                      </h3>
                      {guest.email && (
                        <p className="text-sm text-neutral-500">
                          {guest.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RSVP Status */}
                    <div>
                      <h4 className="font-medium text-neutral-700 mb-2">
                        Event Attendance
                      </h4>
                      <div className="space-y-1 text-sm">
                        {guest.rsvpPrayer && (
                          <div className="flex justify-between">
                            <span>Prayer Ceremony:</span>
                            <span
                              className={
                                guest.rsvpPrayer === "yes"
                                  ? "text-primary-600 font-medium"
                                  : "text-neutral-500"
                              }
                            >
                              {guest.rsvpPrayer === "yes"
                                ? "Attending"
                                : "Not Attending"}
                            </span>
                          </div>
                        )}
                        {guest.rsvpParty && (
                          <div className="flex justify-between">
                            <span>Reception Party:</span>
                            <span
                              className={
                                guest.rsvpParty === "yes"
                                  ? "text-accent-600 font-medium"
                                  : "text-neutral-500"
                              }
                            >
                              {guest.rsvpParty === "yes"
                                ? "Attending"
                                : "Not Attending"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meal & Dietary */}
                    <div>
                      {guest.meal && (
                        <h4 className="font-medium text-neutral-700 mb-2">
                          Meal Preferences
                        </h4>
                      )}
                      <div className="space-y-1 text-sm">
                        {guest.meal && (
                          <div className="flex justify-between">
                            <span>Meal Choice:</span>
                            <span className="text-secondary-600 font-medium capitalize">
                              {guest.meal}
                            </span>
                          </div>
                        )}
                        {guest.dietaryNotes && (
                          <div>
                            <span className="text-neutral-600">
                              Dietary Notes:
                            </span>
                            <p className="text-neutral-500 text-xs mt-1">
                              {guest.dietaryNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(guest.notePrayer || guest.noteParty) && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <h4 className="font-medium text-neutral-700 mb-2">
                        Additional Notes
                      </h4>
                      <div className="space-y-2 text-sm">
                        {guest.notePrayer && (
                          <div>
                            <span className="font-medium text-primary-600">
                              Prayer note:
                            </span>
                            <p className="text-neutral-600">
                              {guest.notePrayer}
                            </p>
                          </div>
                        )}
                        {guest.noteParty && (
                          <div>
                            <span className="font-medium text-accent-600">
                              Party note:
                            </span>
                            <p className="text-neutral-600">
                              {guest.noteParty}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meal Summary */}
          {Object.keys(summary.meals).length > 0 && (
            <div className="bg-accent-light border border-accent-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-accent-dark mb-3">
                Meal Summary
              </h2>
              <div className="flex gap-6">
                {Object.entries(summary.meals).map(([meal, count]) => (
                  <div key={meal} className="text-center">
                    <div className="text-xl font-bold text-accent-600">
                      {count as number}
                    </div>
                    <div className="text-sm text-accent-700 capitalize">
                      {meal}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-neutral-dark mb-3">
              Need to Make Changes?
            </h2>
            <p className="text-neutral-600 mb-4">
              If you need to update your RSVP or have any questions about the
              event, please don&apos;t hesitate to contact us directly.
            </p>
            <div className="space-y-2 text-sm text-neutral-500">
              <p>
                <strong className="text-neutral-700">Youssef & Sandra</strong>
              </p>
              <p>We&apos;re here to help make this day perfect for everyone!</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <button
              onClick={() => router.push("/")}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Event Details
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SubmissionViewPage;
