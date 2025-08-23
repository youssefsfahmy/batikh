import React, { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Local types for form management
interface Member {
  firstName: string;
  lastName: string;
  email?: string;
}

interface MemberWithId extends Member {
  id: string;
}

interface PartyData {
  label: string;
  members: MemberWithId[];
  searchIndex: string[];
  invitedToPrayer: boolean;
  invitedToParty: boolean;
}

interface FormState {
  partyId: string;
  labelTemplate: string;
  customSuffix: string;
  invitedToPrayer: boolean;
  invitedToParty: boolean;
  members: Member[];
}

// Label template options
const LABEL_TEMPLATES = [
  "Bride's family – {Custom}",
  "Groom's family – {Custom}",
  "Bride's friends – {Custom}",
  "Groom's friends – {Custom}",
  "Coworkers – {Custom}",
  "Neighbors – {Custom}",
  "Other – {Custom}",
];

// Utility functions
const tokenize = (str: string): string[] => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((token) => token.length > 0);
};

const buildSearchIndex = (label: string, members: Member[]): string[] => {
  const tokens = new Set<string>();

  // Add label tokens
  tokenize(label).forEach((token) => tokens.add(token));

  // Add member name tokens
  members.forEach((member) => {
    tokenize(member.firstName).forEach((token) => tokens.add(token));
    tokenize(member.lastName).forEach((token) => tokens.add(token));
  });

  return Array.from(tokens);
};

const formatLabel = (template: string, custom: string): string => {
  return template.replace("{Custom}", custom || "Group");
};

const generateMemberIds = (count: number): string[] => {
  return Array.from(
    { length: count },
    (_, i) => `g-${String(i + 1).padStart(3, "0")}`
  );
};

const PartyCreator: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    partyId: `pty-${Math.random().toString(36).substring(2, 8)}`,
    labelTemplate: LABEL_TEMPLATES[0],
    customSuffix: "",
    invitedToPrayer: false,
    invitedToParty: false,
    members: [{ firstName: "", lastName: "", email: "" }],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
  };

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const addMember = () => {
    setFormState((prev) => ({
      ...prev,
      members: [...prev.members, { firstName: "", lastName: "", email: "" }],
    }));
  };

  const removeMember = (index: number) => {
    if (formState.members.length > 1) {
      setFormState((prev) => ({
        ...prev,
        members: prev.members.filter((_, i) => i !== index),
      }));
    }
  };

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setFormState((prev) => ({
      ...prev,
      members: prev.members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const resetForm = () => {
    setFormState({
      partyId: "",
      labelTemplate: LABEL_TEMPLATES[0],
      customSuffix: "",
      invitedToPrayer: false,
      invitedToParty: false,
      members: [{ firstName: "", lastName: "", email: "" }],
    });
    setMessage(null);
  };

  const validateForm = (): string | null => {
    if (!formState.partyId.trim()) return "Party ID is required";

    const validMembers = formState.members.filter(
      (member) => member.firstName.trim() && member.lastName.trim()
    );

    if (validMembers.length === 0) {
      return "At least one member with first and last name is required";
    }

    return null;
  };

  const saveParty = async () => {
    const validation = validateForm();
    if (validation) {
      showMessage("error", validation);
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out members without required fields
      const validMembers = formState.members.filter(
        (member) => member.firstName.trim() && member.lastName.trim()
      );

      // Generate member IDs
      const memberIds = generateMemberIds(validMembers.length);

      // Create members with IDs
      const membersWithIds: MemberWithId[] = validMembers.map(
        (member, index) => ({
          id: memberIds[index],
          firstName: member.firstName.trim(),
          lastName: member.lastName.trim(),
          ...(member.email?.trim() && { email: member.email.trim() }),
        })
      );

      // Build final label
      const label = formatLabel(
        formState.labelTemplate,
        formState.customSuffix
      );

      // Build search index
      const searchIndex = buildSearchIndex(label, validMembers);

      // Create party data
      const partyData: PartyData = {
        label,
        members: membersWithIds,
        searchIndex,
        invitedToPrayer: formState.invitedToPrayer,
        invitedToParty: formState.invitedToParty,
      };

      // Save to Firestore
      const partyRef = doc(db, "parties", formState.partyId);
      await setDoc(partyRef, partyData, { merge: true });

      showMessage("success", `Party saved successfully: ${formState.partyId}`);
    } catch (error) {
      console.error("Error saving party:", error);
      showMessage(
        "error",
        `Failed to save party: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLabel = formatLabel(
    formState.labelTemplate,
    formState.customSuffix
  );

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Party Creator
            </h1>
            <p className="text-gray-600">
              Create a new party for the event guest list
            </p>
          </div>

          {/* Message Toast */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Party ID */}
            {/* Party ID */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party ID *
              </label>
              <input
                type="text"
                value={formState.partyId}
                onChange={(e) => updateFormState({ partyId: e.target.value })}
                placeholder="e.g., pty-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            {/* Label Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party Label *
              </label>
              <div className="space-y-3">
                <select
                  value={formState.labelTemplate}
                  onChange={(e) =>
                    updateFormState({ labelTemplate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  {LABEL_TEMPLATES.map((template) => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formState.customSuffix}
                    onChange={(e) =>
                      updateFormState({ customSuffix: e.target.value })
                    }
                    placeholder="Custom suffix"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Preview:</strong> {currentLabel}
                </div>
              </div>
            </div>

            {/* Invitation Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Invitation Settings
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formState.invitedToPrayer}
                    onChange={(e) =>
                      updateFormState({ invitedToPrayer: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-700">
                    Invited to Prayer Ceremony
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formState.invitedToParty}
                    onChange={(e) =>
                      updateFormState({ invitedToParty: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-700">Invited to Party</span>
                </label>
              </div>
            </div>

            {/* Members */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Party Members *
                </label>
                <button
                  type="button"
                  onClick={addMember}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                >
                  + Add Member
                </button>
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                  <div className="col-span-4">First Name *</div>
                  <div className="col-span-4">Last Name *</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-1">Action</div>
                </div>

                {formState.members.map((member, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 grid grid-cols-12 gap-2 border-t border-gray-200"
                  >
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={member.firstName}
                        onChange={(e) =>
                          updateMember(index, "firstName", e.target.value)
                        }
                        placeholder="First name"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={member.lastName}
                        onChange={(e) =>
                          updateMember(index, "lastName", e.target.value)
                        }
                        placeholder="Last name"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="email"
                        value={member.email || ""}
                        onChange={(e) =>
                          updateMember(index, "email", e.target.value)
                        }
                        placeholder="Email"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        disabled={formState.members.length <= 1}
                        className="w-full text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                * At least one member with first and last name is required
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={saveParty}
                disabled={isSubmitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Party"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PartyCreator;
