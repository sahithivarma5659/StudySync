/*********************************
 FIREBASE AUTH IMPORTS
*********************************/
import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// API base URL - use relative path for same-origin, absolute for different origin
const API_BASE = window.location.hostname === "localhost" 
  ? "" 
  : "https://studysync-1-zgdy.onrender.com";

console.log("StudySync loaded, API:", API_BASE || "same-origin");



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
window.goNotes = () => location.href = "notes.html";
window.goResources = () => location.href = "resources.html";

/*********************************
 TOGGLE PASSWORD VISIBILITY
*********************************/
window.togglePassword = (inputId, toggleElement) => {
  const input = document.getElementById(inputId);
  const icon = toggleElement.querySelector('.eye-icon');
  if (input.type === "password") {
    input.type = "text";
    icon.classList.add('eye-off');
  } else {
    input.type = "password";
    icon.classList.remove('eye-off');
  }
};

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
  const page = location.pathname.toLowerCase();
  const href = location.href.toLowerCase();
  const isAuthPage = page.includes("index") || page.includes("signup") || 
                     href.includes("index") || href.includes("signup") ||
                     page === "/" || page === "";
  
  if (!user && !isAuthPage) {
    console.log("Not logged in, redirecting to login");
    goLogin();
  }
});

/*********************************
 UPLOAD PAGE — show selected files
*********************************/
window.showFiles = (inputId, listId) => {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) return;
  list.innerHTML = "";
  for (const file of input.files) {
    const item = document.createElement("div");
    item.textContent = file.name;
    list.appendChild(item);
  }
};

/*********************************
 DOMContentLoaded — page-specific logic
*********************************/
document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.toLowerCase();
  const href = window.location.href.toLowerCase();
  
  console.log("Page loaded:", page, "| Full URL:", href);

  // Helper to check page - works with both /path and /path.html
  const isPage = (name) => page.includes(name) || href.includes(name);

  // UPLOAD PAGE
  if (isPage("upload")) {
    console.log("Upload page detected");
    const generateBtn = document.getElementById("generateBtn");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        const syllabusInput = document.getElementById("syllabusInput");
        if (!syllabusInput || syllabusInput.files.length === 0) {
          alert("Please upload a syllabus first.");
          return;
        }
        location.href = "unitSelection.html";
      });
    }
  }

  // UNIT SELECTION PAGE
  if (isPage("unitselection") || isPage("unit")) {
    console.log("Unit Selection page detected");
    const generateQuizBtn = document.getElementById("generateQuizBtn");
    if (generateQuizBtn) {
      console.log("Generate Quiz button found, attaching listener");
      generateQuizBtn.addEventListener("click", () => {
        console.log("Generate Quiz clicked");
        const checked = document.querySelectorAll('input[name="unit"]:checked');
        if (checked.length === 0) {
          alert("Select at least one unit.");
          return;
        }
        const units = Array.from(checked).map(cb => cb.value);
        console.log("Selected units:", units);
        // Store selected units and initialize quiz state
        sessionStorage.setItem("selectedUnits", JSON.stringify(units));
        sessionStorage.setItem("currentUnitIndex", "0");
        sessionStorage.setItem("unitScores", JSON.stringify({}));
        location.href = "quiz.html";
      });
    } else {
      console.error("Generate Quiz button NOT found!");
    }
  }

  // QUIZ PAGE
  if (isPage("quiz")) {
    console.log("Quiz page detected");
    initQuiz();
  }

  // ANALYSIS PAGE
  if (isPage("analysis")) {
    console.log("Analysis page detected");
    displayAnalysis();
  }

  // TIMETABLE PAGE
  if (isPage("timetable")) {
    console.log("Timetable page detected");
    generateTimetable();
  }

  // IMPORTANT QUESTIONS PAGE
  if (isPage("important")) {
    console.log("Important page detected");
    loadImportantQuestions();
  }

  // NOTES PAGE
  if (isPage("notes")) {
    console.log("Notes page detected");
    loadNotes();
  }

  // RESOURCES PAGE
  if (isPage("resources")) {
    console.log("Resources page detected");
    loadResources();
  }
});

/*********************************
 QUIZ LOGIC — One unit at a time
*********************************/
let quizQuestions = [];
let currentIndex = 0;
let userAnswers = [];
let timerInterval = null;
let timeLeft = 300; // 5 minutes
let currentUnit = null;

async function initQuiz() {
  const units = JSON.parse(sessionStorage.getItem("selectedUnits") || "[]");
  const unitIndex = parseInt(sessionStorage.getItem("currentUnitIndex") || "0", 10);

  if (units.length === 0) {
    alert("No units selected. Redirecting to unit selection.");
    location.href = "unitSelection.html";
    return;
  }

  if (unitIndex >= units.length) {
    // All units completed, go to analysis
    location.href = "analysis.html";
    return;
  }

  currentUnit = units[unitIndex];
  
  try {
    // Fetch from frontend/questions/ folder
    const filePath = "questions/unit" + currentUnit + ".json";
    console.log("Fetching:", filePath);
    const res = await fetch(filePath);
    console.log("Response status:", res.status);
    if (!res.ok) throw new Error("HTTP " + res.status + " - Failed to load unit " + currentUnit);
    const data = await res.json();
    console.log("Questions loaded:", data.questions.length);

    // Shuffle and pick 5 random questions
    const shuffled = shuffleArray([...data.questions]);
    quizQuestions = shuffled.slice(0, 5);
    
    // Tag with unit info
    quizQuestions.forEach(q => q.unitNum = currentUnit);

  } catch (err) {
    console.error("Error loading quiz:", err);
    document.getElementById("questionText").textContent = "Failed to load questions for Unit " + currentUnit;
    return;
  }

  if (quizQuestions.length === 0) {
    document.getElementById("questionText").textContent = "No questions available for Unit " + currentUnit;
    return;
  }

  userAnswers = new Array(quizQuestions.length).fill(null);
  currentIndex = 0;
  timeLeft = 300; // Reset timer for each unit
  
  document.getElementById("unitTitle").textContent = "Unit " + currentUnit + " Quiz";
  renderQuestion();
  startTimer();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderQuestion() {
  const q = quizQuestions[currentIndex];
  document.getElementById("questionText").textContent = "Q" + (currentIndex + 1) + ". " + q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn" + (userAnswers[currentIndex] === idx ? " selected" : "");
    btn.textContent = opt;
    btn.onclick = () => selectOption(idx);
    optionsDiv.appendChild(btn);
  });
}

function selectOption(idx) {
  userAnswers[currentIndex] = idx;
  renderQuestion();
}

window.nextQuestion = () => {
  // Require an option to be selected
  if (userAnswers[currentIndex] === null) {
    alert("Please select an answer before proceeding.");
    return;
  }
  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    endUnitQuiz();
  }
};

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endUnitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = "⏱ " + mins + ":" + secs;
}

function endUnitQuiz() {
  clearInterval(timerInterval);
  
  // Calculate score for this unit
  let score = 0;
  quizQuestions.forEach((q, i) => {
    // q.answer is 1-indexed string; userAnswers[i] is 0-indexed number
    if (userAnswers[i] !== null && String(userAnswers[i] + 1) === q.answer) {
      score++;
    }
  });

  // Store unit score
  const unitScores = JSON.parse(sessionStorage.getItem("unitScores") || "{}");
  unitScores["unit" + currentUnit] = score;
  sessionStorage.setItem("unitScores", JSON.stringify(unitScores));

  // Move to next unit
  const units = JSON.parse(sessionStorage.getItem("selectedUnits") || "[]");
  const unitIndex = parseInt(sessionStorage.getItem("currentUnitIndex") || "0", 10);
  
  if (unitIndex < units.length - 1) {
    // More units to go — show score and continue
    alert("Unit " + currentUnit + " completed! Score: " + score + "/5\n\nMoving to next unit...");
    sessionStorage.setItem("currentUnitIndex", String(unitIndex + 1));
    location.reload(); // Reload to start next unit quiz
  } else {
    // All units done — go to analysis
    alert("Unit " + currentUnit + " completed! Score: " + score + "/5\n\nAll units completed! Showing analysis...");
    location.href = "analysis.html";
  }
}

/*********************************
 ANALYSIS PAGE — Show scores, ask learner type
*********************************/
function displayAnalysis() {
  const analysisDiv = document.getElementById("analysisContent");
  const unitScores = JSON.parse(sessionStorage.getItem("unitScores") || "{}");
  const selectedUnits = JSON.parse(sessionStorage.getItem("selectedUnits") || "[]");

  if (Object.keys(unitScores).length === 0) {
    analysisDiv.innerHTML = "<p>No quiz data found. Please take the quiz first.</p>";
    return;
  }

  let totalScore = 0;
  let totalQuestions = 0;

  let html = '<table><thead><tr><th>Unit</th><th>Score</th><th>Performance</th></tr></thead><tbody>';

  selectedUnits.forEach(unitNum => {
    const key = "unit" + unitNum;
    const score = unitScores[key] !== undefined ? unitScores[key] : 0;
    totalScore += score;
    totalQuestions += 5;

    let performance = "Weak";
    let color = "#e74c3c";
    if (score >= 4) {
      performance = "Strong";
      color = "#27ae60";
    } else if (score >= 2) {
      performance = "Average";
      color = "#f39c12";
    }

    html += '<tr><td>Unit ' + unitNum + '</td><td>' + score + '/5</td><td style="color:' + color + ';font-weight:bold;">' + performance + '</td></tr>';
  });

  html += '</tbody></table>';
  html += '<p style="margin-top:20px;font-size:18px;"><strong>Total Score: ' + totalScore + '/' + totalQuestions + '</strong></p>';

  analysisDiv.innerHTML = html;
}

window.saveSpeed = () => {
  const selected = document.querySelector("input[name='speed']:checked");
  const daysLeftInput = document.getElementById("daysLeft");
  const hoursPerDayInput = document.getElementById("hoursPerDay");

  if (!selected) {
    alert("Please select your learning speed");
    return;
  }

  const daysLeft = parseInt(daysLeftInput?.value, 10);
  const hoursPerDay = parseFloat(hoursPerDayInput?.value);

  if (!daysLeft || daysLeft < 1) {
    alert("Please enter how many days are left for your exam.");
    return;
  }

  if (!hoursPerDay || hoursPerDay < 1) {
    alert("Please enter how many hours you can study per day.");
    return;
  }

  sessionStorage.setItem("learnerSpeed", selected.value);
  sessionStorage.setItem("daysLeft", String(daysLeft));
  sessionStorage.setItem("hoursPerDay", String(hoursPerDay));
  location.href = "timetable.html";
};

/*********************************
 TIMETABLE PAGE — Generate based on learner type, days left, and hours per day
*********************************/

// Helper function to format hours as "X hr Y min"
function formatTime(hours) {
  const totalMinutes = Math.round(hours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (mins === 0) {
    return hrs + ' hr' + (hrs !== 1 ? 's' : '');
  } else if (hrs === 0) {
    return mins + ' min';
  } else {
    return hrs + ' hr ' + mins + ' min';
  }
}

function generateTimetable() {
  const timetableContent = document.getElementById("timetableContent");
  const slowLearnerNote = document.getElementById("slowLearnerNote");
  const learnerSpeed = sessionStorage.getItem("learnerSpeed") || "average";
  const unitScores = JSON.parse(sessionStorage.getItem("unitScores") || "{}");
  const selectedUnits = JSON.parse(sessionStorage.getItem("selectedUnits") || "[]");
  const daysLeft = parseInt(sessionStorage.getItem("daysLeft") || "7", 10);
  const hoursPerDay = parseFloat(sessionStorage.getItem("hoursPerDay") || "4");

  if (selectedUnits.length === 0) {
    timetableContent.innerHTML = "<tr><td colspan='4'>No units selected.</td></tr>";
    return;
  }

  // Show slow learner note if applicable
  if (slowLearnerNote && learnerSpeed === "slow") {
    slowLearnerNote.style.display = "block";
  }

  // Total available study hours based on user input (exact values)
  const totalHours = daysLeft * hoursPerDay;

  // Calculate buffer time based on learner speed
  // Buffer comes FROM total time - faster learners need less study time, so they have buffer
  let bufferPercent = 0;
  let bufferLabel = "";
  if (learnerSpeed === "slow") {
    bufferPercent = 0; // No buffer - uses all available time for study
    bufferLabel = "Uses all available time for study";
  } else if (learnerSpeed === "average") {
    bufferPercent = 15; // 15% buffer - uses 85% for study
    bufferLabel = "15% buffer time available";
  } else if (learnerSpeed === "fast") {
    bufferPercent = 25; // 25% buffer - uses 75% for study
    bufferLabel = "25% buffer time available";
  }
  
  const bufferTime = Math.round(totalHours * (bufferPercent / 100) * 10) / 10;
  const effectiveStudyTime = totalHours - bufferTime; // Actual time allocated for study

  // Calculate weight for each unit based on performance (weaker = more time needed)
  const weights = { weak: 3, average: 2, strong: 1 };
  
  // Calculate total weight
  let totalWeight = 0;
  const unitData = [];
  selectedUnits.forEach(unitNum => {
    const key = "unit" + unitNum;
    const score = unitScores[key] !== undefined ? unitScores[key] : 0;
    let performance = "weak";
    if (score >= 4) performance = "strong";
    else if (score >= 2) performance = "average";
    const weight = weights[performance];
    unitData.push({ unitNum, performance, weight });
    totalWeight += weight;
  });

  // Reserve time for revision (10% of effective study time, minimum 0.5 hrs)
  const revisionHours = Math.max(0.5, Math.round(effectiveStudyTime * 0.10 * 10) / 10);
  const studyHours = effectiveStudyTime - revisionHours;

  // Distribute study hours based on weights
  let allocatedTotal = 0;
  unitData.forEach((u, idx) => {
    if (idx === unitData.length - 1) {
      // Last unit gets remaining hours to ensure exact total
      u.hours = Math.round((studyHours - allocatedTotal) * 10) / 10;
    } else {
      u.hours = Math.round((u.weight / totalWeight) * studyHours * 10) / 10;
    }
    allocatedTotal += u.hours;
  });

  // Build day-wise schedule respecting hoursPerDay exactly
  let html = "";
  let currentDay = 1;
  let hoursRemainingToday = hoursPerDay;
  
  // Create schedule that respects exact hours per day
  unitData.forEach((u, idx) => {
    let unitHoursLeft = u.hours;
    
    while (unitHoursLeft > 0 && currentDay <= daysLeft) {
      const hoursThisSession = Math.min(unitHoursLeft, hoursRemainingToday);
      
      html += '<tr>';
      html += '<td>Day ' + currentDay + '</td>';
      html += '<td>Unit ' + u.unitNum + '</td>';
      html += '<td style="color:' + (u.performance === 'weak' ? '#e74c3c' : u.performance === 'average' ? '#f39c12' : '#27ae60') + ';font-weight:bold;">' + u.performance.charAt(0).toUpperCase() + u.performance.slice(1) + '</td>';
      html += '<td>' + formatTime(hoursThisSession) + '</td>';
      html += '</tr>';
      
      unitHoursLeft -= hoursThisSession;
      hoursRemainingToday -= hoursThisSession;
      
      if (hoursRemainingToday <= 0.1) {
        currentDay++;
        hoursRemainingToday = hoursPerDay;
      }
    }
  });

  // Add revision if there's time left
  if (currentDay <= daysLeft && revisionHours > 0) {
    let revisionLeft = revisionHours;
    while (revisionLeft > 0 && currentDay <= daysLeft) {
      const hoursThisSession = Math.min(revisionLeft, hoursRemainingToday);
      
      html += '<tr>';
      html += '<td>Day ' + currentDay + '</td>';
      html += '<td>Revision (All Units)</td>';
      html += '<td style="color:#3498db;font-weight:bold;">Review</td>';
      html += '<td>' + formatTime(hoursThisSession) + '</td>';
      html += '</tr>';
      
      revisionLeft -= hoursThisSession;
      hoursRemainingToday -= hoursThisSession;
      
      if (hoursRemainingToday <= 0.1) {
        currentDay++;
        hoursRemainingToday = hoursPerDay;
      }
    }
  }

  // Summary section
  const actualTotal = Math.round((allocatedTotal + revisionHours) * 10) / 10;
  const speedEmoji = learnerSpeed === 'fast' ? '🚀' : learnerSpeed === 'slow' ? '🐢' : '🚶';
  
  // Total available time header
  html += '<tr style="background:#f0f7ff;font-weight:bold;"><td colspan="3">⏰ Total Available Time (' + daysLeft + ' days × ' + hoursPerDay + ' hrs)</td><td>' + formatTime(totalHours) + '</td></tr>';
  
  // Study time allocated
  html += '<tr style="background:#e8f4e8;"><td colspan="3">📚 Study Time Allocated</td><td style="font-weight:bold;">' + formatTime(actualTotal) + '</td></tr>';
  
  // Buffer time based on learner type
  if (learnerSpeed === "slow") {
    // Slow learner - no buffer, uses all time
    html += '<tr style="background:#fff3e0;"><td colspan="3">⏱️ Buffer Time</td><td style="color:#e65100;font-weight:bold;">0 min</td></tr>';
    html += '<tr style="background:#fff8e1;"><td colspan="4">' + speedEmoji + ' <strong>Slow Learner</strong> - ' + bufferLabel + '</td></tr>';
  } else if (learnerSpeed === "average") {
    // Average learner - 15% buffer
    html += '<tr style="background:#e3f2fd;"><td colspan="3">⏱️ Buffer Time (Free Time)</td><td style="color:#1976d2;font-weight:bold;">' + formatTime(bufferTime) + '</td></tr>';
    html += '<tr style="background:#e8f4fc;"><td colspan="4">' + speedEmoji + ' <strong>Average Learner</strong> - ' + bufferLabel + '</td></tr>';
  } else if (learnerSpeed === "fast") {
    // Fast learner - 25% buffer
    html += '<tr style="background:#e8f5e9;"><td colspan="3">⏱️ Buffer Time (Free Time)</td><td style="color:#2e7d32;font-weight:bold;">' + formatTime(bufferTime) + '</td></tr>';
    html += '<tr style="background:#f1f8e9;"><td colspan="4">' + speedEmoji + ' <strong>Fast Learner</strong> - ' + bufferLabel + '</td></tr>';
  }

  timetableContent.innerHTML = html;
}

/*********************************
 IMPORTANT QUESTIONS PAGE
*********************************/
async function loadImportantQuestions() {
  const container = document.getElementById("importantContent");
  const selectedUnits = JSON.parse(sessionStorage.getItem("selectedUnits") || "[]");

  if (selectedUnits.length === 0) {
    container.innerHTML = "<p>No units selected. Please take the quiz first.</p>";
    return;
  }

  let html = "";

  for (const unitNum of selectedUnits) {
    try {
      const filePath = "important/unit" + unitNum + ".json";
      console.log("Fetching important:", filePath);
      const res = await fetch(filePath);
      console.log("Response status:", res.status);
      if (!res.ok) throw new Error("HTTP " + res.status + " - Failed to load unit " + unitNum);
      const data = await res.json();
      console.log("Important questions loaded for unit " + unitNum + ":", data.questions.length);

      html += '<div class="unit-section">';
      html += '<h3 class="unit-header">' + data.unit + '</h3>';
      html += '<p class="topics"><strong>Topics:</strong> ' + data.topics.join(", ") + '</p>';
      html += '<div class="questions-list">';

      data.questions.forEach((q, idx) => {
        const freqClass = q.frequency === "Very High" ? "freq-high" : (q.frequency === "High" ? "freq-medium" : "freq-low");
        html += '<div class="question-card">';
        html += '<div class="question-header">';
        html += '<span class="q-number">Q' + (idx + 1) + '</span>';
        html += '<span class="q-type">' + q.type + '</span>';
        html += '<span class="q-marks">' + q.marks + ' Marks</span>';
        html += '<span class="q-freq ' + freqClass + '">' + q.frequency + '</span>';
        html += '</div>';
        html += '<p class="q-text">' + q.question + '</p>';
        html += '</div>';
      });

      html += '</div></div>';
    } catch (err) {
      console.error("Error loading unit " + unitNum + ":", err);
      html += '<div class="unit-section"><h3>Unit ' + unitNum + '</h3><p>Questions not available.</p></div>';
    }
  }

  container.innerHTML = html;
}

/*********************************
 NOTES PAGE — AI Generated Notes
*********************************/
const notesData = {
  "1": {
    title: "Unit 1: Introduction to Databases and DBMS",
    content: `
<h4>What is a Database?</h4>
<p>A <strong>database</strong> is an organized collection of structured data stored electronically. It allows for efficient storage, retrieval, and management of information.</p>

<h4>Database Management System (DBMS)</h4>
<p>A <strong>DBMS</strong> is software that interacts with users, applications, and the database itself to capture and analyze data. Examples: MySQL, Oracle, PostgreSQL, MongoDB.</p>

<h4>Advantages of DBMS over File Systems</h4>
<ul>
  <li><strong>Data Redundancy Control:</strong> Minimizes duplicate data</li>
  <li><strong>Data Consistency:</strong> Ensures uniform data across the system</li>
  <li><strong>Data Sharing:</strong> Multiple users can access data simultaneously</li>
  <li><strong>Data Security:</strong> Access control and authentication</li>
  <li><strong>Data Independence:</strong> Changes to data structure don't affect applications</li>
</ul>

<h4>Three-Level Architecture</h4>
<ol>
  <li><strong>External Level (View Level):</strong> How users see the data</li>
  <li><strong>Conceptual Level (Logical Level):</strong> Overall structure of the database</li>
  <li><strong>Internal Level (Physical Level):</strong> How data is physically stored</li>
</ol>

<h4>Entity-Relationship (ER) Model</h4>
<p>The ER model is used for database design. Key components:</p>
<ul>
  <li><strong>Entity:</strong> Real-world object (e.g., Student, Course)</li>
  <li><strong>Attribute:</strong> Property of an entity (e.g., Name, Age)</li>
  <li><strong>Relationship:</strong> Association between entities (e.g., Student enrolls in Course)</li>
  <li><strong>Primary Key:</strong> Unique identifier for an entity</li>
</ul>

<h4>Types of Attributes</h4>
<ul>
  <li><strong>Simple:</strong> Atomic, cannot be divided (e.g., Age)</li>
  <li><strong>Composite:</strong> Can be divided (e.g., Full Name → First, Last)</li>
  <li><strong>Derived:</strong> Calculated from other attributes (e.g., Age from DOB)</li>
  <li><strong>Multi-valued:</strong> Can have multiple values (e.g., Phone Numbers)</li>
</ul>
`
  },
  "2": {
    title: "Unit 2: Relational Model and SQL",
    content: `
<h4>Relational Model</h4>
<p>Data is organized in <strong>tables (relations)</strong> consisting of rows (tuples) and columns (attributes).</p>

<h4>Properties of Relations</h4>
<ul>
  <li>Each cell contains a single atomic value</li>
  <li>Each column has a unique name</li>
  <li>All values in a column are of the same domain</li>
  <li>Order of rows and columns doesn't matter</li>
  <li>No duplicate rows</li>
</ul>

<h4>Integrity Constraints</h4>
<ul>
  <li><strong>Domain Constraint:</strong> Values must be from the defined domain</li>
  <li><strong>Key Constraint:</strong> Primary key must be unique</li>
  <li><strong>Entity Integrity:</strong> Primary key cannot be NULL</li>
  <li><strong>Referential Integrity:</strong> Foreign key must reference a valid primary key</li>
</ul>

<h4>Relational Algebra Operations</h4>
<ul>
  <li><strong>Selection (σ):</strong> Filters rows based on condition</li>
  <li><strong>Projection (π):</strong> Selects specific columns</li>
  <li><strong>Union (∪):</strong> Combines rows from two tables</li>
  <li><strong>Set Difference (-):</strong> Rows in first but not in second</li>
  <li><strong>Cartesian Product (×):</strong> All combinations of rows</li>
  <li><strong>Join (⋈):</strong> Combines tables based on condition</li>
</ul>

<h4>SQL Commands</h4>
<p><strong>DDL (Data Definition Language):</strong></p>
<pre>CREATE TABLE Student (id INT PRIMARY KEY, name VARCHAR(50));
ALTER TABLE Student ADD email VARCHAR(100);
DROP TABLE Student;</pre>

<p><strong>DML (Data Manipulation Language):</strong></p>
<pre>INSERT INTO Student VALUES (1, 'John');
UPDATE Student SET name = 'Jane' WHERE id = 1;
DELETE FROM Student WHERE id = 1;
SELECT * FROM Student WHERE name LIKE 'J%';</pre>

<h4>Types of JOINs</h4>
<ul>
  <li><strong>INNER JOIN:</strong> Matching rows from both tables</li>
  <li><strong>LEFT JOIN:</strong> All from left + matching from right</li>
  <li><strong>RIGHT JOIN:</strong> All from right + matching from left</li>
  <li><strong>FULL OUTER JOIN:</strong> All rows from both tables</li>
</ul>
`
  },
  "3": {
    title: "Unit 3: Functional Dependencies and Normalization",
    content: `
<h4>Functional Dependency (FD)</h4>
<p>A constraint between two sets of attributes. If X → Y, then Y is functionally dependent on X.</p>
<p><strong>Example:</strong> StudentID → StudentName (Student name is determined by ID)</p>

<h4>Types of Dependencies</h4>
<ul>
  <li><strong>Trivial FD:</strong> Y ⊆ X (e.g., {A, B} → A)</li>
  <li><strong>Non-trivial FD:</strong> Y ⊄ X (e.g., A → B)</li>
</ul>

<h4>Closure of Attributes</h4>
<p>X⁺ = Set of all attributes that can be derived from X using given FDs.</p>

<h4>Normal Forms</h4>

<p><strong>1NF (First Normal Form):</strong></p>
<ul>
  <li>All attributes must be atomic (no multi-valued attributes)</li>
  <li>Each row must be unique</li>
</ul>

<p><strong>2NF (Second Normal Form):</strong></p>
<ul>
  <li>Must be in 1NF</li>
  <li>No partial dependency (non-key attribute depends on part of composite key)</li>
</ul>

<p><strong>3NF (Third Normal Form):</strong></p>
<ul>
  <li>Must be in 2NF</li>
  <li>No transitive dependency (non-key attribute depends on another non-key attribute)</li>
</ul>

<p><strong>BCNF (Boyce-Codd Normal Form):</strong></p>
<ul>
  <li>For every FD X → Y, X must be a superkey</li>
  <li>Stricter than 3NF</li>
</ul>

<h4>Decomposition</h4>
<ul>
  <li><strong>Lossless Join:</strong> Original table can be reconstructed without loss</li>
  <li><strong>Dependency Preserving:</strong> All FDs are preserved after decomposition</li>
</ul>
`
  },
  "4": {
    title: "Unit 4: Transaction Management and Concurrency Control",
    content: `
<h4>Transaction</h4>
<p>A logical unit of work that must be completed entirely or not at all.</p>

<h4>ACID Properties</h4>
<ul>
  <li><strong>Atomicity:</strong> All or nothing - transaction completes fully or rolls back</li>
  <li><strong>Consistency:</strong> Database remains in a valid state</li>
  <li><strong>Isolation:</strong> Concurrent transactions don't interfere</li>
  <li><strong>Durability:</strong> Committed changes are permanent</li>
</ul>

<h4>Transaction States</h4>
<ol>
  <li><strong>Active:</strong> Transaction is executing</li>
  <li><strong>Partially Committed:</strong> Final statement executed</li>
  <li><strong>Committed:</strong> Successfully completed</li>
  <li><strong>Failed:</strong> Cannot proceed normally</li>
  <li><strong>Aborted:</strong> Rolled back and database restored</li>
</ol>

<h4>Concurrency Problems</h4>
<ul>
  <li><strong>Lost Update:</strong> Two transactions update same data, one is lost</li>
  <li><strong>Dirty Read:</strong> Reading uncommitted data</li>
  <li><strong>Unrepeatable Read:</strong> Same query gives different results</li>
  <li><strong>Phantom Read:</strong> New rows appear between reads</li>
</ul>

<h4>Lock-Based Protocols</h4>
<ul>
  <li><strong>Shared Lock (S):</strong> Read-only access, multiple allowed</li>
  <li><strong>Exclusive Lock (X):</strong> Write access, only one allowed</li>
  <li><strong>Two-Phase Locking (2PL):</strong> Growing phase (acquire locks) → Shrinking phase (release locks)</li>
</ul>

<h4>Deadlock</h4>
<p>Two or more transactions waiting for each other's locks.</p>
<p><strong>Solutions:</strong> Prevention, Detection (wait-for graph), Recovery (abort one transaction)</p>

<h4>Recovery Techniques</h4>
<ul>
  <li><strong>Log-Based Recovery:</strong> Undo (rollback) and Redo (replay) operations</li>
  <li><strong>Checkpoints:</strong> Periodic saving of database state to reduce recovery time</li>
</ul>
`
  },
  "5": {
    title: "Unit 5: File Organization, Indexing, and Hashing",
    content: `
<h4>File Organization</h4>
<ul>
  <li><strong>Heap File:</strong> Records stored in no particular order (fast insert, slow search)</li>
  <li><strong>Sequential File:</strong> Records sorted by key (fast range queries)</li>
  <li><strong>Hash File:</strong> Records distributed using hash function (fast exact match)</li>
</ul>

<h4>Indexing</h4>
<p>Data structure that improves query performance by providing quick access to rows.</p>

<h4>Types of Indexes</h4>
<ul>
  <li><strong>Primary Index:</strong> On primary key, one per table</li>
  <li><strong>Secondary Index:</strong> On non-key attributes</li>
  <li><strong>Clustering Index:</strong> On non-key, ordered attribute</li>
  <li><strong>Dense Index:</strong> Entry for every record</li>
  <li><strong>Sparse Index:</strong> Entry for some records (blocks)</li>
</ul>

<h4>B-Tree</h4>
<ul>
  <li>Balanced tree with data in all nodes</li>
  <li>All leaves at same level</li>
  <li>Order m: max m children, min ⌈m/2⌉ children</li>
</ul>

<h4>B+ Tree</h4>
<ul>
  <li>Data only in leaf nodes</li>
  <li>Leaf nodes linked for sequential access</li>
  <li>Better for range queries</li>
  <li>More keys per node (higher fan-out)</li>
</ul>

<h4>Hashing</h4>
<p>Uses hash function to map keys to bucket addresses.</p>

<p><strong>Static Hashing:</strong></p>
<ul>
  <li>Fixed number of buckets</li>
  <li>Overflow chains for collisions</li>
</ul>

<p><strong>Dynamic Hashing:</strong></p>
<ul>
  <li><strong>Extendible Hashing:</strong> Uses directory that doubles when needed</li>
  <li><strong>Linear Hashing:</strong> Buckets split in linear order</li>
</ul>

<h4>Indexing vs Hashing</h4>
<table>
  <tr><th>Indexing</th><th>Hashing</th></tr>
  <tr><td>Good for range queries</td><td>Good for exact match</td></tr>
  <tr><td>Sorted access</td><td>No inherent order</td></tr>
  <tr><td>O(log n) search</td><td>O(1) average search</td></tr>
</table>
`
  }
};

function loadNotes() {
  const container = document.getElementById("notesContent");
  const selectedUnits = JSON.parse(sessionStorage.getItem("selectedUnits") || "[]");

  if (selectedUnits.length === 0) {
    container.innerHTML = "<p>No units selected. Please take the quiz first.</p>";
    return;
  }

  let html = "";

  selectedUnits.forEach(unitNum => {
    const note = notesData[unitNum];
    if (note) {
      html += '<div class="notes-section">';
      html += '<h3>' + note.title + '</h3>';
      html += '<div class="notes-content">' + note.content + '</div>';
      html += '</div>';
    } else {
      html += '<div class="notes-section"><h3>Unit ' + unitNum + '</h3><p>Notes not available.</p></div>';
    }
  });

  container.innerHTML = html;
}

/*********************************
 RESOURCES PAGE — YouTube Videos
*********************************/
const resourcesData = {
  "1": {
    title: "Unit 1: Introduction to Databases",
    videos: [
      { title: "DBMS Full Course - Introduction to Database", url: "https://www.youtube.com/watch?v=eYpXCdvKwEQ", channel: "Apna College" },
      { title: "Database Management System (DBMS) Full Course", url: "https://www.youtube.com/watch?v=c5HAwKX-suM", channel: "Neso Academy" },
      { title: "ER Diagram Tutorial - How to Design Databases", url: "https://www.youtube.com/watch?v=QpdhBUYk7Kk", channel: "Lucidchart" },
      { title: "Learn Database Normalization - 1NF, 2NF, 3NF", url: "https://www.youtube.com/watch?v=GFQaEYEc8_8", channel: "Decomplexify" }
    ]
  },
  "2": {
    title: "Unit 2: Relational Model and SQL",
    videos: [
      { title: "SQL Tutorial - Full Database Course for Beginners", url: "https://www.youtube.com/watch?v=HXV3zeQKqGY", channel: "freeCodeCamp" },
      { title: "MySQL Tutorial for Beginners [Full Course]", url: "https://www.youtube.com/watch?v=7S_tz1z_5bA", channel: "Programming with Mosh" },
      { title: "SQL Joins Tutorial for Beginners", url: "https://www.youtube.com/watch?v=2HVMiPPuPIM", channel: "Programming with Mosh" },
      { title: "Learn SQL in 60 Minutes", url: "https://www.youtube.com/watch?v=p3qvj9hO_Bo", channel: "Web Dev Simplified" }
    ]
  },
  "3": {
    title: "Unit 3: Normalization",
    videos: [
      { title: "Database Normalization - 1NF 2NF 3NF", url: "https://www.youtube.com/watch?v=ABwD8IYByfk", channel: "Decomplexify" },
      { title: "Learn Database Normalization", url: "https://www.youtube.com/watch?v=GFQaEYEc8_8", channel: "Decomplexify" },
      { title: "Normalization in DBMS with Examples", url: "https://www.youtube.com/watch?v=mUtAPbb1ECM", channel: "Neso Academy" },
      { title: "Database Design Course - Learn how to design databases", url: "https://www.youtube.com/watch?v=ztHopE5Wnpc", channel: "freeCodeCamp" }
    ]
  },
  "4": {
    title: "Unit 4: Transaction Management",
    videos: [
      { title: "Database Transactions (ACID) Explained", url: "https://www.youtube.com/watch?v=pomxJOFVcQs", channel: "Hussein Nasser" },
      { title: "ACID Properties in DBMS", url: "https://www.youtube.com/watch?v=GAe5oB742dw", channel: "Neso Academy" },
      { title: "Database Concurrency Control", url: "https://www.youtube.com/watch?v=oS60pr8H1e0", channel: "CMU Database Group" },
      { title: "Understanding Database Transactions", url: "https://www.youtube.com/watch?v=5ZjhNTM8XU8", channel: "IBM Technology" }
    ]
  },
  "5": {
    title: "Unit 5: Indexing and Hashing",
    videos: [
      { title: "B Trees and B+ Trees - How they are useful in Databases", url: "https://www.youtube.com/watch?v=aZjYr87r1b8", channel: "Abdul Bari" },
      { title: "Database Indexing Explained", url: "https://www.youtube.com/watch?v=fsG1XaZEa78", channel: "Be A Better Dev" },
      { title: "How Database Indexing Works", url: "https://www.youtube.com/watch?v=-qNSXK7s7_w", channel: "Hussein Nasser" },
      { title: "SQL Index Tutorial - Optimize Your Database", url: "https://www.youtube.com/watch?v=HubezKbFL7E", channel: "Socratica" }
    ]
  }
};

function loadResources() {
  const container = document.getElementById("resourcesContent");
  const selectedUnits = JSON.parse(sessionStorage.getItem("selectedUnits") || "[]");

  if (selectedUnits.length === 0) {
    container.innerHTML = "<p>No units selected. Please take the quiz first.</p>";
    return;
  }

  let html = "";

  selectedUnits.forEach(unitNum => {
    const resource = resourcesData[unitNum];
    if (resource) {
      html += '<div class="resource-section">';
      html += '<h3>🎥 ' + resource.title + '</h3>';
      html += '<div class="video-list">';
      
      resource.videos.forEach(video => {
        html += '<a href="' + video.url + '" target="_blank" rel="noopener noreferrer" class="video-card">';
        html += '<div class="video-icon">▶️</div>';
        html += '<div class="video-info">';
        html += '<p class="video-title">' + video.title + '</p>';
        html += '<p class="video-channel">' + video.channel + '</p>';
        html += '</div>';
        html += '</a>';
      });
      
      html += '</div></div>';
    }
  });

  container.innerHTML = html;
}
