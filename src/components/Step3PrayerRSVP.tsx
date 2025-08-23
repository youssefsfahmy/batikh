import React from "react";
import type { Guest, GuestRSVP, YesNo } from "@/types/rsvp";

interface Step3PrayerRSVPProps {
  guests: Guest[];
  rsvpsByGuest: Record<string, GuestRSVP>;
  onRSVPChange: (guestId: string, rsvpPrayer: YesNo) => void;
  onNoteChange: (guestId: string, notePrayer: string) => void;
  onMealChange: (guestId: string, meal: "chicken" | "beef") => void;
  onDietaryNotesChange: (guestId: string, dietaryNotes: string) => void;
}

const Step3PrayerRSVP: React.FC<Step3PrayerRSVPProps> = ({
  guests,
  rsvpsByGuest,
  onRSVPChange,
  onMealChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Prayer Ceremony RSVP
        </h3>
        <p className="text-gray-600 mb-4">
          Please let us know who will be attending the prayer ceremony.
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
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`prayer_${guest.id}`}
                      value="yes"
                      checked={rsvp?.rsvpPrayer === "yes"}
                      onChange={() => onRSVPChange(guest.id, "yes")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-gray-700">
                      ✓ Will attend prayer ceremony
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`prayer_${guest.id}`}
                      value="no"
                      checked={rsvp?.rsvpPrayer === "no"}
                      onChange={() => onRSVPChange(guest.id, "no")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-gray-700">
                      ✗ Cannot attend prayer ceremony
                    </span>
                  </label>
                </div>
              </div>

              {/* Meal Selection - Only show if attending */}
              {rsvp?.rsvpPrayer === "yes" && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Meal Selection
                  </h5>
                  <p className="text-sm text-gray-600 mb-4">
                    Please select your meal preference:
                  </p>

                  <div className="space-y-3 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`meal_${guest.id}`}
                        value="chicken"
                        checked={rsvp?.meal === "chicken"}
                        onChange={() => onMealChange(guest.id, "chicken")}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-gray-700">🍗 Chicken</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`meal_${guest.id}`}
                        value="beef"
                        checked={rsvp?.meal === "beef"}
                        onChange={() => onMealChange(guest.id, "beef")}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-gray-700">🥩 Beef</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {guests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No guests to RSVP for the prayer ceremony.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3PrayerRSVP;
