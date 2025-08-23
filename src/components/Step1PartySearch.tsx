import React, { useState, useEffect, useCallback } from "react";
import { searchParties } from "@/utils/firebase";
import { debounce } from "@/utils/storage";
import type { Party } from "@/types/rsvp";

interface Step1PartySearchProps {
  onPartySelect: (party: Party) => void;
  selectedParty?: Party;
}

const Step1PartySearch: React.FC<Step1PartySearchProps> = ({
  onPartySelect,
  selectedParty,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchParties(term);
      console.log("Search results:", results);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (term: string) => debounce(performSearch, 300)(term),
    [performSearch]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handlePartySelect = (party: Party) => {
    onPartySelect(party);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Find Your Invitation
        </h3>
        <p className="text-gray-600 mb-4">
          Enter your name or the name of someone in your party to find your
          invitation.
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter your name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
          {searchResults.length > 0 ? (
            <>
              <h4 className="font-medium text-gray-900">
                Found {searchResults.length} invitation
                {searchResults.length > 1 ? "s" : ""}:
              </h4>
              {searchResults.map((party) => (
                <div
                  key={party.id}
                  onClick={() => handlePartySelect(party)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedParty?.id === party.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      {party.label && (
                        <h5 className="font-medium text-gray-900 mb-1">
                          {party.label}
                        </h5>
                      )}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Guests: </span>
                        {party.members
                          .map(
                            (member) => `${member.firstName} ${member.lastName}`
                          )
                          .join(", ")}
                      </div>
                      {/* <div className="text-xs text-gray-500 mt-2">
                        {party.invitedToPrayer &&
                          party.invitedToParty &&
                          "Invited to Prayer Ceremony & Party"}
                        {party.invitedToPrayer &&
                          !party.invitedToParty &&
                          "Invited to Prayer Ceremony"}
                        {!party.invitedToPrayer &&
                          party.invitedToParty &&
                          "Invited to Party"}
                      </div> */}
                    </div>
                    {selectedParty?.id === party.id && (
                      <div className="text-purple-500">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                No invitations found. Please check your spelling or try a
                different name.
              </p>
            </div>
          )}
        </div>
      )}

      {!hasSearched && searchTerm.length > 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p>Start typing to search for your invitation...</p>
        </div>
      )}
    </div>
  );
};

export default Step1PartySearch;
