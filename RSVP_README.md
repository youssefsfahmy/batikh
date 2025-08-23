# Event RSVP System

A modern, multi-step RSVP form built with Next.js, React, TypeScript, and Tailwind CSS, powered by Firebase Firestore.

## Features

- **Multi-step Form**: Progressive flow with horizontal progress bar
- **Party Search**: Debounced search to find invitations by name
- **Dynamic Steps**: Steps adjust based on invitation type (Prayer/Party)
- **State Management**: All form state managed in parent component
- **Meal Selection**: Choice between chicken and beef with dietary notes
- **Confirmation**: Success page with confirmation code
- **Responsive Design**: Beautiful UI that works on all devices

## Setup Instructions

### 1. Install Dependencies

First, install Firebase:

```bash
npm install firebase
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Get your Firebase configuration from Project Settings
4. Copy `.env.local.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.local.example .env.local
```

### 3. Firestore Database Structure

Create the following collection in your Firestore database:

```
parties/{partyId}
  ├── label: "The Smith Family"
  ├── members: [
  │   {
  │     id: "guest1",
  │     firstName: "John",
  │     lastName: "Smith",
  │     email: "john@example.com"
  │   }
  │ ]
  ├── invite: {
  │     invitedToPrayer: true,
  │     invitedToParty: true
  │   }
  │
  └── RSVP Data (added after submission):
      ├── partyLabel: "The Smith Family"
      ├── submittingGuestId: "guest1"
      ├── confirmationCode: "ABC123"
      ├── createdAt: 1640995200000
      └── guests: [
          {
            guestId: "guest1",
            firstName: "John",
            lastName: "Smith",
            email: "john@example.com",
            rsvpPrayer: "yes",
            rsvpParty: "yes",
            meal: "chicken",
            dietaryNotes: "No allergies",
            notePrayer: "Looking forward to it",
            noteParty: "Thank you for inviting us"
          }
        ]
```

### 4. Security Rules

Set up Firestore security rules to allow read/write access to the parties collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to parties for searching
    match /parties/{partyId} {
      allow read: if true;
      allow write: if true; // Allow RSVP submissions
    }
  }
}
```

### 5. Sample Data

Create a sample party in Firestore:

```javascript
// Document path: parties/sample-party
{
  label: "The Johnson Family",
  members: [
    {
      id: "guest1",
      firstName: "Jane",
      lastName: "Johnson",
      email: "jane@example.com"
    },
    {
      id: "guest2",
      firstName: "John",
      lastName: "Johnson",
      email: "john@example.com"
    }
  ],
  invite: {
    invitedToPrayer: true,
    invitedToParty: true
  }
}
}
```

### 6. Development

```bash
npm run dev
```

Visit `http://localhost:3000/form` to see the RSVP form.

## Configuration

### Meal Options

The meal options are now integrated into the Prayer RSVP step. To modify them, edit the `Step3PrayerRSVP` component:

```typescript
// In Step3PrayerRSVP.tsx
<input value="chicken" />  // Change meal options here
<input value="beef" />
```

## Form Flow

1. **Find Party**: Search for invitation by name
2. **Prayer RSVP & Meal Selection** (if invited): RSVP for prayer ceremony and choose meal if attending
3. **Party RSVP** (if invited): RSVP for party
4. **Confirmation**: Review and submit

## Features

- **Simplified Data Model**: All party and RSVP data stored in a single collection
- **Progressive Enhancement**: Steps only show if relevant to the invitation
- **Multi-step Form**: Beautiful, guided flow with progress indicators
- **Debounced Search**: Efficient party searching by guest names
- **Validation**: Each step validates before proceeding
- **Responsive Design**: Works on mobile and desktop
- **Admin Dashboard**: View all parties and RSVP submissions
- **Accessibility**: Proper form labels and keyboard navigation

## Data Model

The system uses a simplified data model where:

1. **Parties Collection**: Contains all invitation and RSVP data

   - Initially stores party details (label, members, invite flags)
   - After RSVP submission, additional fields are added:
     - `confirmationCode`: Unique RSVP confirmation
     - `submittingGuestId`: Who submitted the RSVP
     - `guests`: Array of RSVP responses for each guest
     - `createdAt`: Submission timestamp

2. **No Separate Collections**: Unlike traditional systems, there are no separate submissions or rsvps collections

## TypeScript Types

All types are defined in `/src/types/rsvp.ts` for type safety throughout the application.

## Customization

- **Styling**: Modify Tailwind classes in components
- **Validation**: Update validation logic in `isStepValid` function
- **Steps**: Add/remove steps by modifying `getStepsForParty` function
- **Firebase**: Update Firestore operations in `/src/utils/firebase.ts`
