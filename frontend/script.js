
/*********************
 NAVIGATION HELPERS
*********************/
function goHome(){ location.href = "/frontend/home.html"; }
function goUpload(){ location.href = "/frontend/upload.html"; }
function startQuiz(){ location.href = "/frontend/quiz.html"; }
function generateTimetable(){ location.href = "/frontend/timetable.html"; }
function goImportant(){ location.href = "/frontend/important.html"; }
function goNotes(){ location.href = "/frontend/notes.html"; }
function goToAnalysis(){ location.href = "/frontend/analysis.html"; }
function goSignup(){ location.href = "/frontend/signup.html"; }
function goLogin(){ location.href = "/frontend/index.html"; }
function goQuiz(){ location.href = "/frontend/quiz.html"; }

/*********************
 QUIZ PLACEHOLDER
*********************/
function loadQuiz() {
  const q = document.getElementById("questionText");
  const o = document.getElementById("options");
  if (!q || !o) return;

  q.innerText = "Quiz will be generated after syllabus & PYQ analysis...";
  o.innerHTML = "<p>Please wait while AI prepares your quiz.</p>";
}
loadQuiz();

/*********************
 ANALYSIS PAGE LOGIC
*********************/
const analysisDiv = document.getElementById("analysisContent");
if (analysisDiv) {
  const quizCompleted = localStorage.getItem("quizCompleted") === "true";

  if (!quizCompleted) {
    analysisDiv.innerHTML = `
      <p>Please complete the quiz to view your performance analysis.</p>
    `;
  }
}

/*********************
 TIMETABLE PAGE LOGIC
*********************/
const timetableDiv = document.getElementById("timetableContent");
if (timetableDiv) {
  const timetableGenerated = localStorage.getItem("timetableGenerated") === "true";

  if (!timetableGenerated) {
    timetableDiv.innerHTML = `
      <p>Please complete the quiz and generate your study plan to view the timetable.</p>
    `;
  }
}

/*********************
 IMPORTANT QUESTIONS LOGIC
*********************/
const importantDiv = document.getElementById("importantContent");
if (importantDiv) {
  const importantReady = localStorage.getItem("importantReady") === "true";

  if (!importantReady) {
    importantDiv.innerHTML = `
      <p>Important questions will be available after generating your study plan.</p>
    `;
  }
}

/*********************
 MENU STATUS (HAMBURGER)
*********************/
function getProgress() {
  return {
    quizCompleted: localStorage.getItem("quizCompleted") === "true",
    timetableGenerated: localStorage.getItem("timetableGenerated") === "true",
    importantReady: localStorage.getItem("importantReady") === "true"
  };
}

function updateMenuStatus() {
  const { quizCompleted, timetableGenerated, importantReady } = getProgress();

  const quiz = document.getElementById("menuQuiz");
  const table = document.getElementById("menuTimetable");
  const imp = document.getElementById("menuImportant");

  if (!quiz || !table || !imp) return;

  quiz.innerHTML = quizCompleted
    ? "📘 Quiz ✔ Completed"
    : "📘 Quiz ⏳ Not started";

  table.innerHTML = timetableGenerated
    ? "📅 Timetable ✔ Generated"
    : "📅 Timetable 🔒 Locked";

  imp.innerHTML = importantReady
    ? "❓ Important Q ✔ Available"
    : "❓ Important Q 🔒 Locked";
}
updateMenuStatus();

/*********************
 FILE DISPLAY
*********************/
function showFiles(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) return;

  list.innerHTML = "";
  Array.from(input.files).forEach(file => {
    const div = document.createElement("div");
    div.innerText = file.name;
    list.appendChild(div);
  });
}

/*********************
 UPLOAD FILES (FINAL FIX)
*********************/
function uploadFiles() {
  const syllabus = document.getElementById("syllabusInput").files[0];
  const pyqs = document.getElementById("pyqInput").files;

  if (!syllabus || pyqs.length === 0) {
    alert("Please upload syllabus and previous year question papers");
    return;
  }

  const syllabusForm = new FormData();
  syllabusForm.append("syllabus", syllabus);

  fetch("http://127.0.0.1:5000/upload-syllabus", {
    method: "POST",
    body: syllabusForm
  })
  .then(res => {
    if (!res.ok) throw new Error("Syllabus upload failed");
    return res.json();
  })
  .then(() => {
    const pyqForm = new FormData();
    Array.from(pyqs).forEach(file => {
      pyqForm.append("pyqs", file);
    });

    return fetch("http://127.0.0.1:5000/upload-pyqs", {
      method: "POST",
      body: pyqForm
    });
  })
  .then(res => {
    if (!res.ok) throw new Error("PYQ upload failed");
    return res.json();
  })
  .then(() => {
    // ✅ NO alert — guaranteed redirect
    setTimeout(() => {
      window.location.href = "/frontend/quiz.html";
    }, 200);
  })
  .catch(err => {
    console.error(err);
    alert("Upload failed");
  });
}

/*********************
 MENU TOGGLE
*********************/
function toggleMenu() {
  const menu = document.getElementById("menuDropdown");
  if (menu) {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("generateBtn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();   // ⛔ STOP REFRESH
      uploadFiles();        // ✅ MANUAL CALL
    });
  }
});