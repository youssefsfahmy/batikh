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
  const resultsWithScores: Array<{ party: Party; score: number }> = [];

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

    // Create searchable text components
    const partyLabel = (party.label || "").toLowerCase();
    const memberNames = party.members.map((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase()
    );
    const originalSearchTerm = searchTerm.toLowerCase().trim();

    // Calculate relevance score
    let score = 0;
    let hasMatch = false;

    // Check for exact phrase match first (highest priority)
    if (partyLabel.includes(originalSearchTerm)) {
      hasMatch = true;
      if (partyLabel === originalSearchTerm) {
        score += 200; // Exact party label phrase match
      } else {
        score += 150; // Party label contains exact phrase
      }
    }

    memberNames.forEach((name) => {
      if (name.includes(originalSearchTerm)) {
        hasMatch = true;
        if (name === originalSearchTerm) {
          score += 180; // Exact full name phrase match
        } else {
          score += 120; // Name contains exact phrase
        }
      }
    });

    // Track which tokens have been matched to avoid duplicate scoring
    const matchedTokensInPartyLabel = new Set<string>();
    const matchedTokensInMemberNames = new Set<string>();

    tokens.forEach((token) => {
      // Party label token matches (only score once per token)
      if (partyLabel.includes(token) && !matchedTokensInPartyLabel.has(token)) {
        hasMatch = true;
        matchedTokensInPartyLabel.add(token);

        if (partyLabel === token) {
          score += 100; // Exact party label match
        } else if (partyLabel.startsWith(token)) {
          score += 50; // Party label starts with token
        } else {
          score += 25; // Party label contains token
        }
      }

      // Member name token matches (only score once per token across all names)
      memberNames.forEach((name) => {
        if (name.includes(token) && !matchedTokensInMemberNames.has(token)) {
          hasMatch = true;
          matchedTokensInMemberNames.add(token);

          if (name === token) {
            score += 80; // Exact full name match
          } else if (name.startsWith(token)) {
            score += 40; // Name starts with token
          } else {
            // Check if token matches first or last name exactly
            const [firstName, lastName] = name.split(" ");
            if (firstName === token || lastName === token) {
              score += 60; // Exact first or last name match
            } else {
              score += 15; // Name contains token
            }
          }
        }
      });
    });

    // Bonus for matching multiple tokens (only count unique matches)
    const uniqueMatchedTokens = new Set([
      ...matchedTokensInPartyLabel,
      ...matchedTokensInMemberNames,
    ]);
    if (uniqueMatchedTokens.size > 1) {
      score += uniqueMatchedTokens.size * 10;
    }

    if (hasMatch) {
      resultsWithScores.push({ party, score });
    }
  });

  // Check if we have any exact matches (score >= 180 indicates exact phrase match)
  const exactMatches = resultsWithScores.filter(
    (result) => result.score >= 180
  );

  // If we have exact matches, only return those
  if (exactMatches.length > 0) {
    return exactMatches
      .sort((a, b) => b.score - a.score)
      .map((result) => result.party);
  }

  // Otherwise, return all matches sorted by score
  return resultsWithScores
    .sort((a, b) => b.score - a.score)
    .map((result) => result.party);
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
