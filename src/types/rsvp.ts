export type YesNo = "yes" | "no";

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};

export type Party = {
  id: string;
  label?: string;
  members: Guest[];
  // RSVP submission data (optional - only present after submission)
  partyId?: string; // Duplicate of id for consistency
  partyLabel?: string; // Duplicate of label for consistency
  invitedToPrayer: boolean;
  invitedToParty: boolean;
  confirmationCode?: string;
  createdAt?: number;
  guests?: GuestRSVP[]; // RSVP responses for each guest
};

export type GuestRSVP = {
  guestId: string;
  firstName: string;
  lastName: string;
  email?: string;
  rsvpPrayer?: YesNo;
  rsvpParty?: YesNo;
  meal?: "chicken" | "veal";
  dietaryNotes?: string;
  notePrayer?: string;
  noteParty?: string;
};

export type FormState = {
  party?: Party;
  rsvpsByGuest: Record<string, GuestRSVP>;
  confirmationCode?: string;
};
