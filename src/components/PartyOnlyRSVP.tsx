import React from "react";
import type { Guest, GuestRSVP, YesNo } from "@/types/rsvp";

interface Step4PartyRSVPProps {
  guests: Guest[];
  rsvpsByGuest: Record<string, GuestRSVP>;
  onRSVPChange: (guestId: string, rsvpParty: YesNo) => void;
  onNoteChange: (guestId: string, noteParty: string) => void;
}

const PartyOnlyRSVP: React.FC<Step4PartyRSVPProps> = ({
  guests,
  rsvpsByGuest,
  onRSVPChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Party RSVP</h3>
        <p className="text-gray-600 mb-4">
          Please let us know who will be attending the party.
        </p>
      </div>

      <div className="space-y-6">
        {guests.map((guest) => {
          const rsvp = rsvpsByGuest[guest.id];

          return (
            <div
              key={guest.id}
              className="border border-gray-200 rounded-lg p-6"
            >
              <h4 className="font-medium text-gray-900 mb-4">
                {guest.firstName} {guest.lastName}
              </h4>

              {/* RSVP Options */}
              <div className="mb-4">
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`party_${guest.id}`}
                      value="yes"
                      checked={rsvp?.rsvpParty === "yes"}
                      onChange={() => onRSVPChange(guest.id, "yes")}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-1000"
                    />
                    <span className="ml-3 text-gray-700">
                      I&apos;ll be there
                    </span>
                  </label>

                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`party_${guest.id}`}
                      value="no"
                      checked={rsvp?.rsvpParty === "no"}
                      onChange={() => onRSVPChange(guest.id, "no")}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-1000"
                    />
                    <span className="ml-3 text-gray-700">
                      I won&apos;t be able to attend
                    </span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {guests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No guests to RSVP for the party.</p>
        </div>
      )}
    </div>
  );
};

export default PartyOnlyRSVP;
