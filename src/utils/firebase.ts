import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Party, GuestRSVP } from "@/types/rsvp";

/**
 * Search for parties by name tokens
 */
export async function searchParties(searchTerm: string): Promise<Party[]> {
  if (!searchTerm.trim()) return [];

  const searchLower = searchTerm.toLowerCase().trim();
  const tokens = searchLower.split(" ").filter(Boolean);

  const partiesRef = collection(db, "parties");
  const snapshot = await getDocs(partiesRef);
  const results: Party[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const party: Party = {
      id: doc.id,
      label: data.label,
      members: data.members || [],
      partyId: data.partyId,
      partyLabel: data.partyLabel,
      invitedToPrayer: data.invitedToPrayer,
      invitedToParty: data.invitedToParty,
      confirmationCode: data.confirmationCode,
      createdAt: data.createdAt,
      guests: data.guests,
    };

    // Check if any member matches the search
    const hasMatch = party.members.some((member) => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();

      // Check exact full name match
      if (fullName.includes(searchLower)) {
        return true;
      }

      // Check if all tokens match somewhere in the name
      return tokens.every((token) => fullName.includes(token));
    });

    if (hasMatch) {
      results.push(party);
    }
  });

  return results;
}

/**
 * Get a specific party by ID
 */
export async function getParty(partyId: string): Promise<Party | null> {
  try {
    const partyDoc = await getDoc(doc(db, "parties", partyId));

    if (!partyDoc.exists()) {
      return null;
    }

    const data = partyDoc.data();
    return {
      id: partyDoc.id,
      label: data.label,
      members: data.members || [],

      // Include RSVP data if present
      partyId: data.partyId,
      partyLabel: data.partyLabel,
      invitedToPrayer: data.invitedToPrayer,
      invitedToParty: data.invitedToParty,
      confirmationCode: data.confirmationCode,
      createdAt: data.createdAt,
      guests: data.guests,
    };
  } catch (error) {
    console.error("Error fetching party:", error);
    return null;
  }
}

/**
 * Get a party by confirmation code
 */
export async function getPartyByConfirmationCode(
  confirmationCode: string
): Promise<Party | null> {
  try {
    const partiesRef = collection(db, "parties");
    const snapshot = await getDocs(partiesRef);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log("Checking party:", data);
      if (data.confirmationCode === confirmationCode) {
        return {
          id: doc.id,
          label: data.label,
          members: data.members || [],
          // Include RSVP data if present
          partyId: data.partyId,
          partyLabel: data.partyLabel,
          invitedToPrayer: data.invitedToPrayer,
          invitedToParty: data.invitedToParty,
          confirmationCode: data.confirmationCode,
          createdAt: data.createdAt,
          guests: data.guests,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching party by confirmation code:", error);
    return null;
  }
}

/**
 * Generate a random confirmation code
 */
function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Submit RSVP data to Firestore by updating the party document
 */
export async function submitRSVP(
  partyId: string,
  partyLabel: string | undefined,
  invitedToPrayer: boolean,
  invitedToParty: boolean,
  rsvpsByGuest: Record<string, GuestRSVP>,
  message: string = ""
): Promise<string> {
  const confirmationCode = generateConfirmationCode();
  const createdAt = Date.now();

  // Update the party document with RSVP data
  const partyRef = doc(db, "parties", partyId);

  const rsvpData = {
    partyId: partyId, // Store duplicate for consistency
    partyLabel,
    invitedToPrayer,
    invitedToParty,
    guests: Object.values(rsvpsByGuest),
    confirmationCode,
    createdAt,
    message,
  };

  console.log("Submitting RSVP data:", rsvpData);

  await setDoc(partyRef, rsvpData, { merge: true });
  return confirmationCode;
}
