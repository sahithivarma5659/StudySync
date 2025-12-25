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
 MOCK QUIZ DATA (3 UNITS)
*********************/
const QUIZ_DATA = {
  2: [
    { q: "What is RDBMS?", options: ["Relational DB", "Network DB", "File System"], answer: 0 },
    { q: "Which is a DDL command?", options: ["SELECT", "INSERT", "CREATE"], answer: 2 },
    { q: "Relational Algebra is?", options: ["Procedural", "Non-Procedural", "None"], answer: 0 },
    { q: "Which is an aggregate function?", options: ["WHERE", "SUM", "JOIN"], answer: 1 },
    { q: "SQL Views are?", options: ["Virtual tables", "Indexes", "Triggers"], answer: 0 }
  ],
  3: [
    { q: "Functional Dependency defines?", options: ["Relation", "Constraint", "Key"], answer: 1 },
    { q: "Trivial dependency?", options: ["X→Y where Y⊆X", "X→Y", "Y→X"], answer: 0 },
    { q: "Lossless decomposition ensures?", options: ["No redundancy", "No data loss", "No joins"], answer: 1 },
    { q: "BCNF is stronger than?", options: ["1NF", "2NF", "3NF"], answer: 2 },
    { q: "Multivalued dependency used in?", options: ["3NF", "BCNF", "4NF"], answer: 2 }
  ],
  4: [
    { q: "ACID stands for?", options: ["Atomicity, Consistency, Isolation, Durability", "Accuracy"], answer: 0 },
    { q: "Deadlock occurs when?", options: ["Circular wait", "Timeout", "Crash"], answer: 0 },
    { q: "Serializability ensures?", options: ["Speed", "Correctness", "Recovery"], answer: 1 },
    { q: "Checkpoint used for?", options: ["Concurrency", "Recovery", "Indexing"], answer: 1 },
    { q: "Timestamp protocol prevents?", options: ["Deadlock", "Starvation", "Crash"], answer: 0 }
  ]
};

/*********************
 QUIZ LOGIC (ONLY quiz.html)
*********************/
if (CURRENT_PAGE.includes("quiz.html")) {
  let unit = Number(localStorage.getItem("currentUnit")) || 2;
  let index = 0;
  let score = 0;
  let timeLeft = 300;
  let timer;

  const unitTitle = document.getElementById("unitTitle");
  const questionText = document.getElementById("questionText");
  const optionsDiv = document.getElementById("options");
  const timerDiv = document.getElementById("timer");

  unitTitle.innerText = `Unit ${unit} Quiz`;

  function loadQuestion() {
    const q = QUIZ_DATA[unit][index];
    questionText.innerText = q.q;
    optionsDiv.innerHTML = "";

    q.options.forEach((opt, i) => {
      optionsDiv.innerHTML += `
        <label>
          <input type="radio" name="opt" value="${i}"> ${opt}
        </label><br>
      `;
    });
  }

  function startTimer() {
    timer = setInterval(() => {
      timeLeft--;
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      timerDiv.innerText = `⏱ ${m}:${s.toString().padStart(2,"0")}`;

      if (timeLeft <= 0) finishUnit();
    }, 1000);
  }

  window.nextQuestion = function () {
    const selected = document.querySelector("input[name=opt]:checked");
    if (selected && Number(selected.value) === QUIZ_DATA[unit][index].answer) {
      score++;
    }

    index++;
    if (index < 5) {
      loadQuestion();
    } else {
      finishUnit();
    }
  };

  function finishUnit() {
    clearInterval(timer);
    localStorage.setItem(`unit_${unit}_score`, score);

    if (unit === 2) {
      localStorage.setItem("currentUnit", 3);
      location.reload();
    } else if (unit === 3) {
      localStorage.setItem("currentUnit", 4);
      location.reload();
    } else {
      localStorage.setItem("quizCompleted", "true");
      localStorage.removeItem("currentUnit");
      location.href = "/frontend/analysis.html";
    }
  }

  loadQuestion();
  startTimer();
}

/*********************
 ANALYSIS PAGE
*********************/
if (CURRENT_PAGE.includes("analysis.html")) {
  const div = document.getElementById("analysisContent");

  const scores = [
    { u: "Unit II", s: localStorage.getItem("unit_2_score") },
    { u: "Unit III", s: localStorage.getItem("unit_3_score") },
    { u: "Unit IV", s: localStorage.getItem("unit_4_score") }
  ];

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
 UPLOAD PAGE
*********************/
if (CURRENT_PAGE.includes("upload.html")) {
  const btn = document.getElementById("generateBtn");
  if (btn) btn.addEventListener("click", uploadFiles);
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
 FILE UPLOAD + REDIRECT
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
  .then(res => res.json())
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
  .then(res => res.json())
  .then(() => {
    console.log("✅ Upload complete");
    window.location.href = "/frontend/quiz.html";
  })
  .catch(err => {
    console.error(err);
    alert("Upload failed");
  });
}

/*********************
 ATTACH BUTTON (UPLOAD PAGE ONLY)
*********************/
if (CURRENT_PAGE.includes("upload.html")) {
  const btn = document.getElementById("generateBtn");
  if (btn) btn.addEventListener("click", uploadFiles);
}

/*********************
 MENU
*********************/
function toggleMenu() {
  const m = document.getElementById("menuDropdown");
  if (m) m.style.display = m.style.display === "block" ? "none" : "block";
}