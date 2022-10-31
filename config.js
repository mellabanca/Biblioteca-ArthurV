import firebase from "firebase/app";
require("@firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDzXzyMCMlprtOjTW9QCdjp-W38LFNEzKA",
  authDomain: "tedio-a8eab.firebaseapp.com",
  projectId: "tedio-a8eab",
  storageBucket: "tedio-a8eab.appspot.com",
  messagingSenderId: "458749508523",
  appId: "1:458749508523:web:4bc7417831f716140170ee"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();