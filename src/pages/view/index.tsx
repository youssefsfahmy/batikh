import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Party, GuestRSVP } from "@/types/rsvp";

interface PartyWithSubmission extends Party {
  hasSubmission: boolean;
  submissionDate?: string;
}

const ViewPage: React.FC = () => {
  const [parties, setParties] = useState<PartyWithSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<"parties" | "submissions">(
    "parties"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParties = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const partiesRef = collection(db, "parties");
      const partiesSnapshot = await getDocs(partiesRef);

      const partiesData: PartyWithSubmission[] = partiesSnapshot.docs.map(
        (doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            label: data.label || "",
            members: data.members || [],
            invitedToPrayer: false,
            invitedToParty: false,

            // RSVP submission data
            partyLabel: data.partyLabel,
            submittingGuestId: data.submittingGuestId,
            confirmationCode: data.confirmationCode,
            createdAt: data.createdAt,
            guests: data.guests || [],
            hasSubmission: !!data.confirmationCode,
            submissionDate: data.createdAt
              ? new Date(data.createdAt).toLocaleString()
              : undefined,
          };
        }
      );

      setParties(partiesData);
    } catch (err) {
      console.error("Error fetching parties:", err);
      setError(
        `Failed to fetch parties: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    // Submissions are now part of the parties, so we filter parties that have submissions
    setIsLoading(true);
    setError(null);

    try {
      const partiesRef = collection(db, "parties");
      const partiesSnapshot = await getDocs(partiesRef);
      console.log("Fetched parties:", partiesSnapshot.docs.length);

      const submittedParties: PartyWithSubmission[] = partiesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            label: data.label || "",
            members: data.members || [],
            invitedToPrayer: false,
            invitedToParty: false,
            // RSVP submission data
            partyLabel: data.partyLabel,
            submittingGuestId: data.submittingGuestId,
            confirmationCode: data.confirmationCode,
            createdAt: data.createdAt,
            guests: data.guests || [],
            hasSubmission: !!data.confirmationCode,
            submissionDate: data.createdAt
              ? new Date(data.createdAt).toLocaleString()
              : undefined,
          };
        })
        .filter((party) => party.hasSubmission)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setParties(submittedParties);
    } catch (err) {
      console.log("Error fetching submissions:", err);
      setError(
        `Failed to fetch submissions: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "parties") {
      fetchParties();
    } else {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getInviteTypeBadge = (
    invitedToParty: boolean,
    invitedToPrayer: boolean
  ) => {
    const badges = [];
    if (invitedToPrayer) badges.push("Prayer");
    if (invitedToParty) badges.push("Party");
    return badges.length > 0 ? badges.join(" + ") : "None";
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

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Event Data Viewer
            </h1>
            <p className="text-gray-600">
              View all parties and RSVP submissions
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab("parties")}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === "parties"
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  All Parties ({parties.length})
                </button>
                <button
                  onClick={() => setActiveTab("submissions")}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === "submissions"
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Submitted ({parties.filter((p) => p.hasSubmission).length})
                </button>
              </nav>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === "parties" && !isLoading && (
            <div className="space-y-4">
              {parties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No parties found.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parties.map((party) => (
                      <div
                        key={party.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="mb-3">
                          <h3 className="font-semibold text-gray-900">
                            {party.label}
                          </h3>
                          <p className="text-xs text-gray-500">
                            ID: {party.id}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Members:</span>{" "}
                            {party.members.length}
                            <div className="text-xs text-gray-600 mt-1">
                              {party.members
                                .map((m) => `${m.firstName} ${m.lastName}`)
                                .join(", ")}
                            </div>
                          </div>

                          <div>
                            <span className="font-medium">Invited to:</span>{" "}
                            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {getInviteTypeBadge(
                                party.invitedToParty,
                                party.invitedToPrayer
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{party.members.length} members</span>
                            <span>
                              {party.hasSubmission ? (
                                <span className="text-green-600">
                                  ✓ Submitted
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  No submission
                                </span>
                              )}
                            </span>
                          </div>

                          {party.hasSubmission && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500">
                                <div>Code: {party.confirmationCode}</div>
                                <div>Submitted: {party.submissionDate}</div>
                                <div>
                                  Guests responded: {party.guests?.length || 0}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === "submissions" && !isLoading && (
            <div className="space-y-4">
              {parties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No RSVP submissions found.</p>
                </div>
              ) : (
                <>
                  {parties.map((party) => {
                    const summary = getRSVPSummary(party.guests || []);

                    return (
                      <div
                        key={party.id}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Confirmation: {party.confirmationCode}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Party ID: {party.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              Submitted: {formatDate(party.createdAt || 0)}
                            </p>
                          </div>

                          <div className="text-right text-sm">
                            <div className="font-medium">Summary</div>
                            <div className="text-gray-600">
                              {summary.totalGuests} guests total
                            </div>
                            {summary.prayerAttending > 0 && (
                              <div className="text-green-600">
                                {summary.prayerAttending} attending prayer
                              </div>
                            )}
                            {summary.partyAttending > 0 && (
                              <div className="text-blue-600">
                                {summary.partyAttending} attending party
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Guest Details */}
                        <div className="space-y-3">
                          {(party.guests || []).map((guest, guestIndex) => (
                            <div
                              key={guestIndex}
                              className="bg-gray-50 rounded p-3"
                            >
                              <div className="font-medium text-gray-900 mb-2">
                                {guest.firstName} {guest.lastName}
                                {guest.email && (
                                  <span className="text-sm text-gray-600 ml-2">
                                    ({guest.email})
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                                {guest.rsvpPrayer && (
                                  <div>
                                    <span className="font-medium">Prayer:</span>{" "}
                                    <span
                                      className={
                                        guest.rsvpPrayer === "yes"
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {guest.rsvpPrayer === "yes"
                                        ? "Attending"
                                        : "Not attending"}
                                    </span>
                                  </div>
                                )}

                                {guest.rsvpParty && (
                                  <div>
                                    <span className="font-medium">Party:</span>{" "}
                                    <span
                                      className={
                                        guest.rsvpParty === "yes"
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {guest.rsvpParty === "yes"
                                        ? "Attending"
                                        : "Not attending"}
                                    </span>
                                  </div>
                                )}

                                {guest.meal && (
                                  <div>
                                    <span className="font-medium">Meal:</span>{" "}
                                    <span className="capitalize">
                                      {guest.meal}
                                    </span>
                                  </div>
                                )}

                                {guest.dietaryNotes && (
                                  <div>
                                    <span className="font-medium">
                                      Dietary:
                                    </span>{" "}
                                    <span className="text-gray-600">
                                      {guest.dietaryNotes}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {(guest.notePrayer || guest.noteParty) && (
                                <div className="mt-2 text-sm">
                                  {guest.notePrayer && (
                                    <div>
                                      <span className="font-medium">
                                        Prayer note:
                                      </span>{" "}
                                      {guest.notePrayer}
                                    </div>
                                  )}
                                  {guest.noteParty && (
                                    <div>
                                      <span className="font-medium">
                                        Party note:
                                      </span>{" "}
                                      {guest.noteParty}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Meal Summary */}
                        {Object.keys(summary.meals).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Meal Summary:
                            </div>
                            <div className="flex gap-4 text-sm text-gray-600">
                              {Object.entries(summary.meals).map(
                                ([meal, count]) => (
                                  <span key={meal} className="capitalize">
                                    {meal}: {count as number}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ViewPage;
