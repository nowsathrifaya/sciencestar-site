# Firebase Setup — Science Arena Phase 2

Follow these steps exactly. Takes about 15 minutes.

---

## Step 1 — Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Name it: `sciencestar-arena`
4. Disable Google Analytics (not needed)
5. Click **Create project**

---

## Step 2 — Enable Google Sign-In

1. In your project, go to **Build → Authentication**
2. Click **Get started**
3. Click **Google** under Sign-in providers
4. Toggle **Enable**
5. Set support email to your email address
6. Click **Save**

---

## Step 3 — Create Firestore Database

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select region: `asia-southeast1` (Singapore)
5. Click **Enable**

---

## Step 4 — Set Firestore Security Rules

In Firestore → **Rules** tab, replace everything with:

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

Click **Publish**.

This means: each user can only read and write their own data.

---

## Step 5 — Register Your Web App

1. In Firebase Console, click the **gear icon** → **Project settings**
2. Scroll down to **Your apps**
3. Click the **</>** (web) icon
4. App nickname: `ScienceStar Arena`
5. Do NOT tick Firebase Hosting (you use Cloudflare Pages)
6. Click **Register app**
7. You will see a `firebaseConfig` block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sciencestar-arena.firebaseapp.com",
  projectId: "sciencestar-arena",
  storageBucket: "sciencestar-arena.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Copy all these values.**

---

## Step 6 — Add Your Config to the Site Files

You need to replace `REPLACE_WITH_YOUR_...` in **3 files**:

### File 1: `arena/index.html`
Search for `REPLACE_WITH_YOUR_API_KEY` (around line 380).
Replace the entire `FIREBASE_CONFIG` object with your values.

### File 2: `dashboard/index.html`
Same — search for `REPLACE_WITH_YOUR_API_KEY` (around line 100).
Replace the entire `FIREBASE_CONFIG` object with your values.

### File 3: `arena/firebase.js`
Same replacement (this file is a reference only, not loaded directly).

---

## Step 7 — Add Your Domain to Authorised Domains

1. Firebase Console → **Authentication → Settings → Authorised domains**
2. Click **Add domain**
3. Add: `primayscience.org`
4. Add: `www.primayscience.org`

This is required — Google Sign-In will be blocked without this.

---

## Step 8 — Deploy to Cloudflare Pages

Upload your site zip to Cloudflare Pages as normal.
The Arena and Dashboard will work immediately once deployed.

---

## What Gets Stored in Firestore

Each user gets one document at `users/{uid}`:

```json
{
  "xp": 350,
  "streak": 4,
  "quizzesDone": 12,
  "bestScores": {
    "living": 9,
    "forces": 7,
    "bio-cell": 8
  },
  "lastQuizDate": "2025-06-11",
  "displayName": "Nasar",
  "email": "nasar@example.com",
  "photoURL": "https://...",
  "updatedAt": "timestamp"
}
```

---

## Free Tier Limits (Firestore Spark Plan)

| Metric | Free limit |
|--------|-----------|
| Reads per day | 50,000 |
| Writes per day | 20,000 |
| Storage | 1 GB |
| Network | 10 GB/month |

At 100 daily active users, you use roughly 500 writes/day.
You won't hit limits until you have thousands of daily users.

---

## Testing Locally

Open `arena/index.html` directly in a browser — Firebase will work
but Google Sign-In requires `localhost` to be in authorised domains.

Add `localhost` to Firebase → Authentication → Authorised domains
while testing.

---

## Questions?

If Sign-In throws `auth/unauthorized-domain`, go back to Step 7.
If Firestore throws `permission-denied`, check your rules in Step 4.

---

## Phase 3 — Additional Firestore Rules

Replace your Firestore rules with this updated version that covers
exams, groups, and leaderboard reads:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users — own data only
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Exams — any signed-in user can read; creator can write
    match /exams/{examId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }

    // Groups — members can read; owner can write structure; members update own data
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;

      match /challenges/{cid} {
        allow read: if request.auth != null;
        allow write: if request.auth != null &&
          get(/databases/$(database)/documents/groups/$(groupId)).data.ownerUid
          == request.auth.uid;
      }
    }
  }
}
```

Click **Publish** after pasting.

---

## New Pages in Phase 3

| URL | Purpose |
|-----|---------|
| `/exam/` | Create and join scheduled mock exams |
| `/leaderboard/` | Global top 50 + friends leaderboard |
| `/groups/` | Study groups with group leaderboard and challenges |

All three pages use the same Firebase project — no extra setup needed.
