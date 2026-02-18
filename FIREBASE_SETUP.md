# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name: "Study Tracker" (or any name)
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Phone Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Click "Phone" provider
3. Toggle "Enable"
4. Click "Save"

## Step 3: Enable Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select location (closest to you)
5. Click "Enable"

## Step 4: Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "</>" (Web app icon)
4. Register app with nickname: "Study Tracker Web"
5. Copy the firebaseConfig object

## Step 5: Add Config to Your App

Open `login.html` and replace this section:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

With your actual config from Firebase Console.

Also update the same config in `firebase-sync.js`.

## Step 6: Add Authorized Domain

1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your GitHub Pages domain: `yourusername.github.io`

## Step 7: Test

1. Commit and push changes to GitHub
2. Visit your site
3. Click "Sign in with Google"
4. Your data will now sync across all browsers!

## Security Rules (Optional - for production)

In Firestore Database → Rules, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures users can only access their own data.

## Cost

Firebase free tier includes:
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

This is more than enough for personal use!
