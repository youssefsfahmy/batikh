import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Party, GuestRSVP } from "@/types/rsvp";

/**
 * Search for parties by name tokens
 */
export async function searchParties(searchTerm: string): Promise<Party[]> {
  if (!searchTerm.trim()) return [];

  const tokens = searchTerm.toLowerCase().split(" ").filter(Boolean);
  const partiesRef = collection(db, "parties");

  // Get all parties and filter in memory since we don't have searchIndex
  const snapshot = await getDocs(partiesRef);
  const results: Party[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const party: Party = {
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

    // Create searchable text from party label and member names
    const searchableText = [
      party.label || "",
      ...party.members.map((m) => `${m.firstName} ${m.lastName}`),
    ]
      .join(" ")
      .toLowerCase();

    // Check if any search token matches the searchable text
    const matches = tokens.some((token) => searchableText.includes(token));

    if (matches) {
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
  rsvpsByGuest: Record<string, GuestRSVP>
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
  };

  console.log("Submitting RSVP data:", rsvpData);

  await setDoc(partyRef, rsvpData, { merge: true });
  return confirmationCode;
}
