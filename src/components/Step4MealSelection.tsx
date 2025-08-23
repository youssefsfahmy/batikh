import React from "react";
import type { Guest, GuestRSVP } from "@/types/rsvp";

interface Step5MealSelectionProps {
  guests: Guest[];
  rsvpsByGuest: Record<string, GuestRSVP>;
  onMealChange: (guestId: string, meal: "chicken" | "beef") => void;
  onDietaryNotesChange: (guestId: string, dietaryNotes: string) => void;
}

const Step5MealSelection: React.FC<Step5MealSelectionProps> = ({
  guests,
  rsvpsByGuest,
  onMealChange,
}) => {
  // Only show guests who are attending the party
  const attendingGuests = guests.filter(
    (guest) => rsvpsByGuest[guest.id]?.rsvpPrayer === "yes"
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Meal Selection
        </h3>
        <p className="text-gray-600 mb-4">
          Please select meal preferences for guests attending the party.
        </p>
      </div>

      <div className="space-y-6">
        {attendingGuests.map((guest) => {
          const rsvp = rsvpsByGuest[guest.id];

          return (
            <div
              key={guest.id}
              className="border border-gray-200 rounded-lg p-6"
            >
              <h4 className="font-medium text-gray-900 mb-4">
                {guest.firstName} {guest.lastName}
              </h4>

              {/* Meal Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Meal preference:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`meal_${guest.id}`}
                      value="chicken"
                      checked={rsvp?.meal === "chicken"}
                      onChange={() => onMealChange(guest.id, "chicken")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">Chicken</div>
                      <div className="text-sm text-gray-600">
                        Grilled chicken with herbs
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`meal_${guest.id}`}
                      value="beef"
                      checked={rsvp?.meal === "beef"}
                      onChange={() => onMealChange(guest.id, "beef")}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">Beef</div>
                      <div className="text-sm text-gray-600">
                        Roasted beef with vegetables
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {attendingGuests.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <p className="text-gray-600">
            No meal selection needed - no one is attending the party.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step5MealSelection;
