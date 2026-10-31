// Ready-to-use Firebase security rules and setup instructions for DOFU Furniture & Interior Design
export const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DOFU Business Management Rules
    // Allow read/write to all authenticated staff or allow during initial development/testing
    match /{document=**} {
      allow read, write: if true; // In production, restrict to authenticated users: request.auth != null;
    }
  }
}`;

export const FIREBASE_SETUP_STEPS = [
  {
    step: 1,
    title: 'Create a Firebase Project',
    desc: 'Go to the Firebase Console (console.firebase.google.com) and click "Add project". Name it "dofu-furniture".'
  },
  {
    step: 2,
    title: 'Enable Cloud Firestore',
    desc: 'In the left sidebar, navigate to "Firestore Database" and click "Create database". Choose "Start in test mode" (or paste the rules below) and select a region close to your clients.'
  },
  {
    step: 3,
    title: 'Register a Web App',
    desc: 'Go to Project Settings (gear icon) > General > "Your apps" > click the Web icon (</>). Name it "DOFU Web App".'
  },
  {
    step: 4,
    title: 'Copy the Firebase Config',
    desc: 'Copy the firebaseConfig object (apiKey, authDomain, projectId, storageBucket, etc.) and paste it directly into the Firebase Connection Manager modal in this system.'
  }
];
