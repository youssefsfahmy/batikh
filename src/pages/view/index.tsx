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
  const [activeTab, setActiveTab] = useState<
    "parties" | "submissions" | "totals"
  >("totals");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPartyId, setCopiedPartyId] = useState<string | null>(null);

  // Filter states for parties tab
  const [searchTerm, setSearchTerm] = useState("");
  const [invitationFilter, setInvitationFilter] = useState<
    "all" | "prayer" | "party" | "both" | "none"
  >("all");
  const [submissionFilter, setSubmissionFilter] = useState<
    "all" | "submitted" | "pending"
  >("all");

  // Copy party link to clipboard
  const copyPartyLink = async (party: PartyWithSubmission) => {
    const baseUrl =
      party.invitedToPrayer && party.invitedToParty
        ? "https://youssefxsandra.com"
        : "https://party.youssefxsandra.com";

    const link = `${baseUrl}?partyId=${party.id}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedPartyId(party.id);
      setTimeout(() => setCopiedPartyId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedPartyId(party.id);
      setTimeout(() => setCopiedPartyId(null), 2000);
    }
  };

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
            invitedToPrayer: data.invitedToPrayer || false,
            invitedToParty: data.invitedToParty || false,

            // RSVP submission data
            partyLabel: data.partyLabel,
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
    if (activeTab === "parties" || activeTab === "totals") {
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

  const getOverallTotals = () => {
    const submittedParties = parties.filter((p) => p.hasSubmission);
    const allMembers = parties.flatMap((p) => p.members);
    const allGuests = submittedParties.flatMap((p) => p.guests || []);

    const totalPrayerAttending = allGuests.filter(
      (g) => g.rsvpPrayer === "yes"
    ).length;
    const totalPartyAttending = allGuests.filter(
      (g) => g.rsvpParty === "yes"
    ).length;
    const totalNotAttending = allGuests.filter(
      (g) => g.rsvpPrayer === "no" && g.rsvpParty === "no"
    ).length;

    const mealCounts = allGuests.reduce((acc, guest) => {
      if (guest.meal) {
        acc[guest.meal] = (acc[guest.meal] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const dietaryRestrictions = allGuests.filter(
      (g) => g.dietaryNotes && g.dietaryNotes.trim() !== ""
    ).length;
    console.log("parties", parties);
    // Calculate member invitation statistics
    const membersInvitedToBoth = parties
      .filter((p) => p.invitedToPrayer && p.invitedToParty)
      .flatMap((p) => p.members).length;

    const membersInvitedToPartyOnly = parties
      .filter((p) => !p.invitedToPrayer && p.invitedToParty)
      .flatMap((p) => p.members).length;

    const membersInvitedToPrayerOnly = parties
      .filter((p) => p.invitedToPrayer && !p.invitedToParty)
      .flatMap((p) => p.members).length;

    return {
      totalParties: parties.length,
      submittedParties: submittedParties.length,
      //total number of guests
      totalMembers: allMembers.length,
      totalGuests: allGuests.length,
      prayerAttending: totalPrayerAttending,
      partyAttending: totalPartyAttending,
      notAttending: totalNotAttending,
      mealCounts,
      dietaryRestrictions,
      responseRate:
        parties.length > 0
          ? ((submittedParties.length / parties.length) * 100).toFixed(1)
          : "0",
      // Member invitation statistics
      membersInvitedToBoth,
      membersInvitedToPartyOnly,
      membersInvitedToPrayerOnly,
    };
  };

  // Filter parties based on current filter settings
  const getFilteredParties = () => {
    let filtered = parties;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((party) => {
        const partyLabel = party.label?.toLowerCase() || "";
        const memberNames = party.members
          .map((m) => `${m.firstName} ${m.lastName}`.toLowerCase())
          .join(" ");
        return (
          partyLabel.includes(searchLower) || memberNames.includes(searchLower)
        );
      });
    }

    // Invitation filter
    if (invitationFilter !== "all") {
      filtered = filtered.filter((party) => {
        switch (invitationFilter) {
          case "prayer":
            return party.invitedToPrayer && !party.invitedToParty;
          case "party":
            return !party.invitedToPrayer && party.invitedToParty;
          case "both":
            return party.invitedToPrayer && party.invitedToParty;
          case "none":
            return !party.invitedToPrayer && !party.invitedToParty;
          default:
            return true;
        }
      });
    }

    // Submission filter
    if (submissionFilter !== "all") {
      filtered = filtered.filter((party) => {
        switch (submissionFilter) {
          case "submitted":
            return party.hasSubmission;
          case "pending":
            return !party.hasSubmission;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) =>
      (a.label || "").localeCompare(b.label || "")
    );
  };

  // Export parties and members to CSV
  const exportToCSV = () => {
    const csvData = [];

    // Add CSV headers
    csvData.push([
      "Party ID",
      "Party Label",
      "Member First Name",
      "Member Last Name",
      "Member Email",
      "Invited to Prayer",
      "Invited to Party",
      "RSVP Submitted",
      "Confirmation Code",
      "Submission Date",
      "RSVP Prayer",
      "RSVP Party",
      "Meal Choice",
      "Dietary Notes",
      "Prayer Note",
      "Party Note",
    ]);

    // Add data rows
    parties.forEach((party) => {
      party.members.forEach((member) => {
        // Find corresponding guest RSVP data if it exists
        const guestRSVP = party.guests?.find(
          (g) =>
            g.firstName === member.firstName && g.lastName === member.lastName
        );

        csvData.push([
          party.id,
          party.label || "",
          member.firstName,
          member.lastName,
          member.email || "",
          party.invitedToPrayer ? "Yes" : "No",
          party.invitedToParty ? "Yes" : "No",
          party.hasSubmission ? "Yes" : "No",
          party.confirmationCode || "",
          party.submissionDate || "",
          guestRSVP?.rsvpPrayer || "",
          guestRSVP?.rsvpParty || "",
          guestRSVP?.meal || "",
          guestRSVP?.dietaryNotes || "",
          guestRSVP?.notePrayer || "",
          guestRSVP?.noteParty || "",
        ]);
      });
    });

    // Convert to CSV string
    const csvContent = csvData
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `event-members-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                      ? "border-primary-1000 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  All Parties ({parties.length})
                </button>
                <button
                  onClick={() => setActiveTab("submissions")}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === "submissions"
                      ? "border-primary-1000 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Submitted ({parties.filter((p) => p.hasSubmission).length})
                </button>
                <button
                  onClick={() => setActiveTab("totals")}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === "totals"
                      ? "border-primary-1000 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Totals & Stats
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1000"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === "parties" && !isLoading && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-neutral-dark">
                    Filter Parties
                  </h3>
                  <button
                    onClick={exportToCSV}
                    className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export CSV
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Search by Name
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Party or member name..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Invitation Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Invitation Status
                    </label>
                    <select
                      value={invitationFilter}
                      onChange={(e) =>
                        setInvitationFilter(
                          e.target.value as typeof invitationFilter
                        )
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Invitations</option>
                      <option value="both">Both Events</option>
                      <option value="party">Party Only</option>
                      <option value="prayer">Prayer Only</option>
                      <option value="none">No Invitations</option>
                    </select>
                  </div>

                  {/* Submission Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      RSVP Status
                    </label>
                    <select
                      value={submissionFilter}
                      onChange={(e) =>
                        setSubmissionFilter(
                          e.target.value as typeof submissionFilter
                        )
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Parties</option>
                      <option value="submitted">Submitted</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm ||
                  invitationFilter !== "all" ||
                  submissionFilter !== "all") && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setInvitationFilter("all");
                        setSubmissionFilter("all");
                      }}
                      className="text-sm text-primary-600 hover:text-primary-dark font-medium"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Parties List */}
              <div>
                {(() => {
                  const filteredParties = getFilteredParties();

                  return filteredParties.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">
                        {parties.length === 0
                          ? "No parties found."
                          : "No parties match the current filters."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Results Count */}
                      <div className="mb-4 text-sm text-neutral-600">
                        Showing {filteredParties.length} of {parties.length}{" "}
                        parties
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredParties.map((party) => (
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
                                      Guests responded:{" "}
                                      {party.guests?.length || 0}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Copy Link Button */}
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => copyPartyLink(party)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-lg transition-colors"
                                >
                                  {copiedPartyId === party.id ? (
                                    <>
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      Link Copied!
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                      Copy RSVP Link
                                    </>
                                  )}
                                </button>
                                <div className="text-xs text-gray-500 mt-1 text-center">
                                  {party.invitedToPrayer && party.invitedToParty
                                    ? "youssefxsandra.com"
                                    : "party.youssefxsandra.com"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
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
                            <div className="text-gray-600">
                              Message: {party.message}
                            </div>
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

          {/* Totals Tab */}
          {activeTab === "totals" && !isLoading && (
            <div className="space-y-6">
              {(() => {
                const totals = getOverallTotals();

                return (
                  <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-primary-light border border-primary-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-dark">
                          {totals.totalParties}
                        </div>
                        <div className="text-sm text-primary-600">
                          Total Parties
                        </div>
                      </div>

                      <div className="bg-secondary-light border border-secondary-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-secondary-dark">
                          {totals.submittedParties}
                        </div>
                        <div className="text-sm text-secondary-600">
                          Submitted RSVPs
                        </div>
                      </div>

                      <div className="bg-accent-light border border-accent-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-accent-dark">
                          {totals.totalGuests}
                        </div>
                        <div className="text-sm text-accent-600">
                          Total Guests
                        </div>
                      </div>

                      <div className="bg-neutral-light border border-neutral-300 rounded-lg p-4">
                        <div className="text-2xl font-bold text-neutral-dark">
                          {totals.responseRate}%
                        </div>
                        <div className="text-sm text-neutral-600">
                          Response Rate
                        </div>
                      </div>
                    </div>

                    {/* Members Invitation Statistics */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-neutral-dark mb-4">
                        Invitation Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-neutral-dark">
                            {totals.totalMembers}
                          </div>
                          <div className="text-sm text-neutral-600">
                            Total Invited Members
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-primary-600">
                            {totals.membersInvitedToBoth}
                          </div>
                          <div className="text-sm text-neutral-600">
                            Invited to Both Events
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-secondary-600">
                            {totals.membersInvitedToPartyOnly}
                          </div>
                          <div className="text-sm text-neutral-600">
                            Party Only Invites
                          </div>
                        </div>
                      </div>

                      {totals.membersInvitedToPrayerOnly > 0 && (
                        <div className="mt-4">
                          <div className="bg-white rounded-lg p-4 text-center inline-block">
                            <div className="text-2xl font-bold text-accent-600">
                              {totals.membersInvitedToPrayerOnly}
                            </div>
                            <div className="text-sm text-neutral-600">
                              Prayer Only Invites
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attendance Statistics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-neutral-dark mb-4">
                          Event Attendance
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">
                              Prayer Ceremony
                            </span>
                            <span className="font-semibold text-primary-600">
                              {totals.prayerAttending} guests
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">
                              Reception Party
                            </span>
                            <span className="font-semibold text-secondary-600">
                              {totals.partyAttending} guests
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">
                              Not Attending
                            </span>
                            <span className="font-semibold text-neutral-500">
                              {totals.notAttending} guests
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Meal Counts */}
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-neutral-dark mb-4">
                          Meal Preferences
                        </h3>
                        <div className="space-y-3">
                          {Object.keys(totals.mealCounts).length > 0 ? (
                            Object.entries(totals.mealCounts).map(
                              ([meal, count]) => (
                                <div
                                  key={meal}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-neutral-600 capitalize">
                                    {meal}
                                  </span>
                                  <span className="font-semibold text-accent-600">
                                    {count} guests
                                  </span>
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-neutral-500 text-sm">
                              No meal preferences recorded
                            </p>
                          )}
                          {totals.dietaryRestrictions > 0 && (
                            <div className="pt-3 border-t border-neutral-200">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600">
                                  Special Dietary Needs
                                </span>
                                <span className="font-semibold text-primary-600">
                                  {totals.dietaryRestrictions} guests
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-neutral-dark mb-4">
                        Summary Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-neutral-700 mb-3">
                            RSVP Status
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Parties invited:</span>
                              <span className="font-medium">
                                {totals.totalParties}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Responses received:</span>
                              <span className="font-medium text-secondary-600">
                                {totals.submittedParties}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pending responses:</span>
                              <span className="font-medium text-neutral-500">
                                {totals.totalParties - totals.submittedParties}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-neutral-700 mb-3">
                            Guest Totals
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Attending prayer:</span>
                              <span className="font-medium text-primary-600">
                                {totals.prayerAttending}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Attending party:</span>
                              <span className="font-medium text-secondary-600">
                                {totals.partyAttending}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ViewPage;
