// Firebase Configuration Module
// Loads Firebase configuration from environment or hardcoded values

const firebaseConfig = {
  apiKey: 'AIzaSyAjaN1dabndg-ccVFGcrxdkuHB9wozyrfw',
  authDomain: 'musicallo-3cd30.firebaseapp.com',
  projectId: 'musicallo-3cd30',
  storageBucket: 'musicallo-3cd30.appspot.com',
  messagingSenderId: '470668714876',
  appId: '1:470668714876:web:b26686b92ac4f6c6f87af9',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
