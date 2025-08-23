import React from "react";
import type { Guest } from "@/types/rsvp";

interface Step2GuestSelectionProps {
  guests: Guest[];
  selectedGuestId?: string;
  onGuestSelect: (guestId: string) => void;
}

const Step2GuestSelection: React.FC<Step2GuestSelectionProps> = ({
  guests,
  selectedGuestId,
  onGuestSelect,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Who is submitting this RSVP?
        </h3>
        <p className="text-gray-600 mb-4">
          Please select who you are from the list below.
        </p>
      </div>

      <div className="space-y-3">
        {guests.map((guest) => (
          <label
            key={guest.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
              selectedGuestId === guest.id
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="submittingGuest"
              value={guest.id}
              checked={selectedGuestId === guest.id}
              onChange={() => onGuestSelect(guest.id)}
              className="sr-only"
            />
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedGuestId === guest.id
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-300"
                }`}
              >
                {selectedGuestId === guest.id && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {guest.firstName} {guest.lastName}
                </div>
                {guest.email && (
                  <div className="text-sm text-gray-600">{guest.email}</div>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>

      {guests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No guests found in this party.</p>
        </div>
      )}
    </div>
  );
};

export default Step2GuestSelection;
