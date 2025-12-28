/*********************************
 FIREBASE AUTH IMPORTS
*********************************/
import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/*********************************
 NAVIGATION
*********************************/
window.goHome = () => location.href = "home.html";
window.goUpload = () => location.href = "upload.html";
window.goQuiz = () => location.href = "quiz.html";
window.goToAnalysis = () => location.href = "analysis.html";
window.goImportant = () => location.href = "important.html";
window.goTimetable = () => location.href = "timetable.html";
window.goSignup = () => location.href = "signup.html";
window.goLogin = () => location.href = "index.html";

/*********************************
 SIGN UP
*********************************/
window.signup = async () => {
  const inputs = document.querySelectorAll("input");
  const name = inputs[0].value.trim();
  const email = inputs[1].value.trim();
  const password = inputs[2].value.trim();

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created successfully");
    goHome();
  } catch (error) {
    alert(error.message);
  }
};

/*********************************
 LOGIN
*********************************/
window.login = async () => {
  const inputs = document.querySelectorAll("input");
  const email = inputs[0].value.trim();
  const password = inputs[1].value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    goHome();
  } catch (error) {
    alert("Invalid login credentials");
  }
};

/*********************************
 AUTH GUARD
*********************************/
onAuthStateChanged(auth, user => {
  const page = location.pathname;
  if (!user && !page.includes("index.html") && !page.includes("signup.html")) {
    goLogin();
  }
});