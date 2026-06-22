// ─── ScienceStar Firebase Config ─────────────────────────────────────────────
// Replace the values below with your actual Firebase project config.
// Get them from: Firebase Console → Project Settings → Your Apps → Web App
// ─────────────────────────────────────────────────────────────────────────────

const FIREBASE_CONFIG = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID"
};

// ─── Firebase SDK (modular v10, loaded via CDN in each HTML page) ─────────────
// Each page that uses this file must include these script tags BEFORE firebase.js:
//
//  <script type="module">
//    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
//    import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
//      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
//    import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp }
//      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
//  </script>
//
// This file is imported as a module itself — see arena/index.html and dashboard/index.html

export { FIREBASE_CONFIG };
