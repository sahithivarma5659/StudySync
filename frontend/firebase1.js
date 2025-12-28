// frontend/firebase1.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGdNWTp_w8WfJ9m8_TsYvk8h6lLd6CU48",
  authDomain: "studysync-3c20c.firebaseapp.com",
  projectId: "studysync-3c20c",
  storageBucket: "studysync-3c20c.appspot.com",
  messagingSenderId: "594969540404",
  appId: "1:594969540404:web:3c31aec3eca803a7ef9761"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);