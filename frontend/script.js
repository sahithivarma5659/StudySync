/*********************
 PAGE DETECTION
*********************/
const CURRENT_PAGE = window.location.pathname;

/*********************
 NAVIGATION HELPERS
*********************/
function goHome(){ location.href = "/frontend/home.html"; }
function goUpload(){ location.href = "/frontend/upload.html"; }
function goQuiz(){ location.href = "/frontend/quiz.html"; }
function goToAnalysis(){ location.href = "/frontend/analysis.html"; }
function generateTimetable(){ location.href = "/frontend/timetable.html"; }
function goImportant(){ location.href = "/frontend/important.html"; }
function goNotes(){ location.href = "/frontend/notes.html"; }
function goSignup(){ location.href = "/frontend/signup.html"; }
function goLogin(){ location.href = "/frontend/index.html"; }



/*********************
 QUIZ LOGIC (quiz.html)
*********************/
if (CURRENT_PAGE.includes("quiz.html")) {

  const quizData = JSON.parse(localStorage.getItem("quizData"));
  if (!quizData) {
    alert("No quiz data found. Please select units again.");
    window.location.href = "/frontend/unitSelection.html";
    return;
  }

  const unitKeys = Object.keys(quizData);

  let unitIndex = Number(localStorage.getItem("currentUnitIndex")) || 0;
  let questionIndex = 0;
  let score = 0;
  let timeLeft = 300; // 5 minutes
  let timer = null;

  const unitTitle = document.getElementById("unitTitle");
  const questionText = document.getElementById("questionText");
  const optionsDiv = document.getElementById("options");
  const timerDiv = document.getElementById("timer");

  const currentUnit = unitKeys[unitIndex];
  const questions = quizData[currentUnit];

  unitTitle.innerText = currentUnit.replace("_", " ").toUpperCase();

  /* ---------- TIMER ---------- */
  function startTimer() {
    clearInterval(timer);
    timeLeft = 300;

    timerDiv.innerText = "⏱ 05:00";

    timer = setInterval(() => {
      timeLeft--;

      const min = Math.floor(timeLeft / 60);
      const sec = timeLeft % 60;

      timerDiv.innerText = `⏱ ${min}:${sec.toString().padStart(2, "0")}`;

      if (timeLeft <= 0) {
        clearInterval(timer);
        finishUnit();
      }
    }, 1000);
  }

  /* ---------- LOAD QUESTION ---------- */
  function loadQuestion() {
    const q = questions[questionIndex];
    questionText.innerText = q.question;
    optionsDiv.innerHTML = "";

    q.options.forEach(opt => {
      optionsDiv.innerHTML += `
        <label>
          <input type="radio" name="opt" value="${opt}">
          ${opt}
        </label><br>
      `;
    });
  }

  /* ---------- NEXT QUESTION ---------- */
  window.nextQuestion = () => {
    const selected = document.querySelector("input[name='opt']:checked");

    if (selected && selected.value === questions[questionIndex].answer) {
      score++;
    }

    questionIndex++;

    if (questionIndex < questions.length) {
      loadQuestion();
    } else {
      finishUnit();
    }
  };

  /* ---------- FINISH UNIT ---------- */
  function finishUnit() {
    clearInterval(timer);

    localStorage.setItem(`${currentUnit}_score`, score);

    unitIndex++;
    questionIndex = 0;
    score = 0;

    if (unitIndex < unitKeys.length) {
      localStorage.setItem("currentUnitIndex", unitIndex);
      location.reload();
    } else {
      localStorage.setItem("quizCompleted", "true");
      localStorage.removeItem("currentUnitIndex");
      window.location.href = "/frontend/analysis.html";
    }
  }

  /* ---------- INIT ---------- */
  loadQuestion();
  startTimer();
}



/*********************
 ANALYSIS PAGE
*********************/
if (CURRENT_PAGE.includes("analysis.html")) {
  const div = document.getElementById("analysisContent");

  const quizData = JSON.parse(localStorage.getItem("quizData"));
const scores = Object.keys(quizData).map(k => ({
  u: k.replace("_", " ").toUpperCase(),
  s: localStorage.getItem(`${k}_score`)
}));


  let html = "<table><tr><th>Unit</th><th>Score</th><th>Level</th></tr>";

  scores.forEach(x => {
    const lvl = x.s <= 2 ? "Weak" : x.s == 3 ? "Average" : "Strong";
    html += `<tr><td>${x.u}</td><td>${x.s}/5</td><td>${lvl}</td></tr>`;
  });

  html += "</table>";
  div.innerHTML = html;

  localStorage.setItem("timetableGenerated", "true");
  localStorage.setItem("importantReady", "true");
}



/*********************
 FILE DISPLAY (UPLOAD PAGE)
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
 UPLOAD PAGE → VALIDATE → SELECT UNITS
*********************/
if (CURRENT_PAGE.includes("upload.html")) {
  const btn = document.getElementById("generateBtn");

  if (btn) {
    btn.onclick = () => {

      const syllabus = document.getElementById("syllabusInput").files.length;
      const pyqs = document.getElementById("pyqInput").files.length;

      if (!syllabus || !pyqs) {
        alert("Please upload syllabus and previous year question papers before proceeding.");
        return;
      }

      window.location.href = "/frontend/unitSelection.html";
    };
  }
}

/*********************
 MENU
*********************/
function toggleMenu() {
  const m = document.getElementById("menuDropdown");
  if (m) m.style.display = m.style.display === "block" ? "none" : "block";
}

/*********************
 Unit selection
*********************/


document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("generateQuizBtn");
  if (!btn) return; // Not on unitSelection page

  btn.addEventListener("click", () => {

    console.log("✅ Generate Quiz clicked");

    const selectedUnits = [];

    document
      .querySelectorAll("input[name='unit']:checked")
      .forEach(cb => selectedUnits.push(cb.value));

    if (selectedUnits.length === 0) {
      alert("Please select at least one unit");
      return;
    }

    fetch("http://127.0.0.1:5000/get-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ units: selectedUnits })
    })
    .then(res => {
      if (!res.ok) throw new Error("Server error");
      return res.json();
    })
    .then(data => {
      console.log("📦 Quiz data:", data);

      if (!data.quiz || Object.keys(data.quiz).length === 0) {
        alert("No questions found for selected units");
        return;
      }

      localStorage.setItem("quizData", JSON.stringify(data.quiz));
      localStorage.setItem("currentUnitIndex", 0);

      window.location.href = "/frontend/quiz.html";
    })
    .catch(err => {
      console.error("❌ Quiz generation failed:", err);
      alert("Failed to generate quiz");
    });

  });
});
