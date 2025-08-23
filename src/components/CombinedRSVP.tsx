import React from "react";
import type { Guest, GuestRSVP, YesNo } from "@/types/rsvp";

interface Step3PrayerRSVPProps {
  guests: Guest[];
  rsvpsByGuest: Record<string, GuestRSVP>;
  onRSVPChange: (guestId: string, rsvpPrayer: YesNo, rsvpParty: YesNo) => void;
  onMealChange: (guestId: string, meal: "chicken" | "veal") => void;
  onDietaryNotesChange: (guestId: string, dietaryNotes: string) => void;
  invitedToPrayer: boolean;
}

const CombinedRSVP: React.FC<Step3PrayerRSVPProps> = ({
  guests,
  rsvpsByGuest,
  onRSVPChange,
  onMealChange,
  invitedToPrayer,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">RSVP</h3>
        <p className="text-foreground mb-4">Please let us know your plans:</p>
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
                  {invitedToPrayer ? (
                    // Options for guests invited to prayer + party
                    <>
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`rsvp_${guest.id}`}
                          value="prayer_and_party"
                          checked={
                            rsvp?.rsvpPrayer === "yes" &&
                            rsvp?.rsvpParty === "yes"
                          }
                          onChange={() => onRSVPChange(guest.id, "yes", "yes")}
                          className="w-4 h-4 text-brown-sugar border-gray-300 focus:ring-brown-sugar"
                        />
                        <span className="ml-3 text-gray-700">
                          I&apos;ll be there for the prayer & lunch (4:30 – 7:30
                          PM)
                        </span>
                      </label>

                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`rsvp_${guest.id}`}
                          value="party_only"
                          checked={
                            rsvp?.rsvpPrayer === "no" &&
                            rsvp?.rsvpParty === "yes"
                          }
                          onChange={() => onRSVPChange(guest.id, "no", "yes")}
                          className="w-4 h-4 text-brown-sugar border-gray-300 focus:ring-brown-sugar"
                        />
                        <span className="ml-3 text-gray-700">
                          I&apos;ll join later for the party (from 7:30 PM)
                        </span>
                      </label>

                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`rsvp_${guest.id}`}
                          value="cannot_attend"
                          checked={
                            rsvp?.rsvpPrayer === "no" &&
                            rsvp?.rsvpParty === "no"
                          }
                          onChange={() => onRSVPChange(guest.id, "no", "no")}
                          className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-1000"
                        />
                        <span className="ml-3 text-gray-700">
                          I won&apos;t be able to attend
                        </span>
                      </label>
                    </>
                  ) : (
                    // Options for guests invited to party only
                    <>
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`rsvp_${guest.id}`}
                          value="party_only"
                          checked={rsvp?.rsvpParty === "yes"}
                          onChange={() => onRSVPChange(guest.id, "no", "yes")}
                          className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-1000"
                        />
                        <span className="ml-3 text-gray-700">
                          I&apos;ll be there
                        </span>
                      </label>

                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`rsvp_${guest.id}`}
                          value="cannot_attend"
                          checked={rsvp?.rsvpParty === "no"}
                          onChange={() => onRSVPChange(guest.id, "no", "no")}
                          className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-1000"
                        />
                        <span className="ml-3 text-gray-700">
                          I won&apos;t be able to attend
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Meal Selection - Only show if attending (either prayer or party) */}
              {rsvp?.rsvpPrayer === "yes" && (
                <div className="mt-6 p-4 bg-primary-100 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Lunch Main Course Selection
                  </h5>
                  <p className="text-sm text-gray-600 mb-4">
                    Please choose one of the following entrées:
                  </p>

                  <div className="space-y-4 mb-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name={`meal_${guest.id}`}
                        value="veal"
                        checked={rsvp?.meal === "veal"}
                        onChange={() => onMealChange(guest.id, "veal")}
                        className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-1000"
                      />
                      <span className="ml-3">
                        <span className="block font-medium text-gray-900">
                          Veal Milanese
                        </span>
                        <span className="block text-sm text-gray-600">
                          Crispy breaded veal cutlet served with parmesan
                          cheese, arugula, cherry tomatoes, and roasted
                          potatoes.
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name={`meal_${guest.id}`}
                        value="chicken"
                        checked={rsvp?.meal === "chicken"}
                        onChange={() => onMealChange(guest.id, "chicken")}
                        className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-1000"
                      />
                      <span className="ml-3">
                        <span className="block font-medium text-gray-900">
                          Chicken Parmesan
                        </span>
                        <span className="block text-sm text-gray-600">
                          Breaded chicken breast topped with marinara sauce and
                          melted mozzarella.
                        </span>
                      </span>
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
          <p className="text-gray-600">No guests to RSVP.</p>
        </div>
      )}
    </div>
  );
};

export default CombinedRSVP;
