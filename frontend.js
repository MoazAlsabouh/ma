const UNIT_ORDER = {"الفصل الأول": 0, "الفصل الثاني": 1, "الفصل الثالث": 2, "الفصل الرابع": 3, "القسم النظري": 4, "القسم العملي": 5};
const LESSON_ORDER = {"المحاضرة 1": 0, "المحاضرة 2": 1, "المحاضرة 3": 2, "المحاضرة 4": 3, "المحاضرة 5": 4, "المحاضرة 6": 5, "المحاضرة 7": 6, "المحاضرة 8": 7, "المحاضرة الأولى": 8, "المحاضرة الثانية": 9, "المحاضرة الثالثة": 10};

ï»؟import { app, auth, db, onAuthStateChanged, signOut, collection, getDocs, getDoc, doc, setDoc, updateDoc, query, where, addDoc, deleteDoc } from './firebase-init.js';

const state = {
  data: null,
  lessons: [],
  units: [],
  unitIndex: 0,
  weekly: [],
  exams: [],
  examTimer: null,
  weeklyTimer: null,
  weeklyActivity: null
};

const page = document.body.dataset.page;
const $ = (id) => document.getElementById(id);
const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;"
}[c]));
const attr = esc;

const subjectsFallback = ["قواعد بيانات", "برمجة 1", "خوارزميات", "شبكات حاسوب", "رياضيات متقطعة", "لغة إنجليزية"];

// ط§ظ„ط£ظٹط§ظ… ط§ظ„ط¯ط±ط§ط³ظٹط© ط§ظ„ط®ظ…ط³ط© ط§ظ„ظ…ط¹طھظ…ط¯ط© ظپظ‚ط· (ظ…ظ† ط§ظ„ط£ط­ط¯ ط¥ظ„ظ‰ ط§ظ„ط®ظ…ظٹط³)
const WEEKDAYS = [
  { key: "ط§ظ„ط¬ظ…ط¹ط©", label: "ط§ظ„ط¬ظ…ط¹ط©", short: "ط¬ظ…ط¹ط©" },
  { key: "ط§ظ„ط³ط¨طھ", label: "ط§ظ„ط³ط¨طھ", short: "ط³ط¨طھ" },
  { key: "ط§ظ„ط£ط­ط¯", label: "ط§ظ„ط£ط­ط¯", short: "ط£ط­ط¯" },
  { key: "ط§ظ„ط¥ط«ظ†ظٹظ†", label: "ط§ظ„ط¥ط«ظ†ظٹظ†", short: "ط¥ط«ظ†ظٹظ†" },
  { key: "ط§ظ„ط«ظ„ط§ط«ط§ط،", label: "ط§ظ„ط«ظ„ط§ط«ط§ط،", short: "ط«ظ„ط§ط«ط§ط،" },
  { key: "ط§ظ„ط£ط±ط¨ط¹ط§ط،", label: "ط§ظ„ط£ط±ط¨ط¹ط§ط،", short: "ط£ط±ط¨ط¹ط§ط،" },
  { key: "ط§ظ„ط®ظ…ظٹط³", label: "ط§ظ„ط®ظ…ظٹط³", short: "ط®ظ…ظٹط³" }
];

const LEVANT_MONTHS_SHORT = [
  "ظƒط§ظ†ظˆظ† 2", "ط´ط¨ط§ط·", "ط¢ط°ط§ط±", "ظ†ظٹط³ط§ظ†", "ط£ظٹط§ط±", "ط­ط²ظٹط±ط§ظ†",
  "طھظ…ظˆط²", "ط¢ط¨", "ط£ظٹظ„ظˆظ„", "طھط´ط±ظٹظ† 1", "طھط´ط±ظٹظ† 2", "ظƒط§ظ†ظˆظ† 1"
];

const LEVANT_MONTHS_FULL = [
  "ظƒط§ظ†ظˆظ† ط§ظ„ط«ط§ظ†ظٹ", "ط´ط¨ط§ط·", "ط¢ط°ط§ط±", "ظ†ظٹط³ط§ظ†", "ط£ظٹط§ط±", "ط­ط²ظٹط±ط§ظ†",
  "طھظ…ظˆط²", "ط¢ط¨", "ط£ظٹظ„ظˆظ„", "طھط´ط±ظٹظ† ط§ظ„ط£ظˆظ„", "طھط´ط±ظٹظ† ط§ظ„ط«ط§ظ†ظٹ", "ظƒط§ظ†ظˆظ† ط§ظ„ط£ظˆظ„"
];

const GREGORIAN_MONTHS = [
  "ظٹظ†ط§ظٹط±", "ظپط¨ط±ط§ظٹط±", "ظ…ط§ط±ط³", "ط£ط¨ط±ظٹظ„", "ظ…ط§ظٹظˆ", "ظٹظˆظ†ظٹظˆ",
  "ظٹظˆظ„ظٹظˆ", "ط£ط؛ط³ط·ط³", "ط³ط¨طھظ…ط¨ط±", "ط£ظƒطھظˆط¨ط±", "ظ†ظˆظپظ…ط¨ط±", "ط¯ظٹط³ظ…ط¨ط±"
];

// ط¯ط§ظ„ط© ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط§ظ…طھط­ط§ظ†ط§طھ ظ„ظ…ظ†ط¹ ط­ط¯ظˆط« ط®ط·ط£ toExam is not defined
function toExam(item) {
  if (!item) return { id: "", subject: "", name: "", at: "" };
  return {
    id: item.id || "",
    subject: item.subject || item.title || "ظ…ط§ط¯ط© ط؛ظٹط± ظ…ط­ط¯ط¯ط©",
    name: item.name || item.exam || item.subject || "ط§ظ…طھط­ط§ظ†",
    at: item.at || item.date || item.dateTime || ""
  };
}
// ط¥طھط§ط­طھظ‡ط§ ظپظٹ ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ط¹ط§ظ… ظ„ظ…ظ†ط¹ ط£ظٹ ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹
window.toExam = toExam;

function normDay(str = "") {
  return String(str)
    .replace(/[ط£ط¥ط¢]/g, "ط§")
    .replace(/ط©/g, "ظ‡")
    .replace(/ظ‰/g, "ظٹ")
    .trim();
}

function getTasksForDay(dayName, weeklyList = state.weekly) {
  const target = normDay(dayName);
  return (weeklyList || []).filter(item => normDay(item.day) === target);
}

function bar(percent, cls = "") {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return `<div class="progress ${cls}"><span style="width:${p}%"></span></div>`;
}

function shell({title, subtitle = "", active = ""}, content) {
  document.title = `${title} | ط®ظڈط·ظ‰ | ط±ظپظٹظ‚ظƒ ظ†ط­ظˆ ط§ظ„طھظپظˆظ‚`;
  const appEl = $("app");
  if (!appEl) return;
  
  // Fetch user info to show/hide admin link
  const user = auth.currentUser;
const data = { user: user ? { name: (state.userProfile && state.userProfile.name) || user.displayName || user.email.split('@')[0], role: (state.userProfile && state.userProfile.role) || 'user' } : null };
if (true) {
    const isAdmin = true; // Always admin in single-user personal project
    const adminLink = `<a href="admin.html">ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ‚ط±ط±ط§طھ</a>`;
    const userName = data.user ? `<span style="margin-left:10px;">${data.user.name}</span>` : "";

    appEl.innerHTML = `
      <main class="container">
        <header class="topbar">
          <a class="brand" href="index.html">
            <img src="logo.jpg" alt="Logo" style="height: 40px; border-radius: 5px; margin-left: 10px; mix-blend-mode: multiply;">
            <span><b>ط®ظڈط·ظ‰</b><small>ط±ظپظٹظ‚ظƒ ظ†ط­ظˆ ط§ظ„طھظپظˆظ‚</small></span>
          </a>
          <nav class="nav">
            <a class="${active === "dashboard" ? "active" : ""}" href="index.html">ط§ظ„ط±ط¦ظٹط³ظٹط©</a>
            <a class="${active === "subjects" ? "active" : ""}" href="subjects.html">ط§ظ„ظ…ظˆط§ط¯</a>
            <a class="${active === "weekly" ? "active" : ""}" href="weekly.html">ط§ظ„ط¬ط¯ظˆظ„</a>
            <a class="${active === "exams" ? "active" : ""}" href="exams.html">ط§ظ„ط§ظ…طھط­ط§ظ†ط§طھ</a>
            <a class="${active === "channels" ? "active" : ""}" href="channels.html">ط§ظ„ظ‚ظ†ظˆط§طھ</a>
            ${adminLink}
          </nav>
          <div class="top-actions">
            ${userName}
            <button id="refresh" class="icon-btn" title="طھط­ط¯ظٹط«">â†»</button>
            <button id="logout" class="secondary">ط®ط±ظˆط¬</button>
          </div>
        </header>
        <section class="page-heading">
          <div>
            <span class="eyebrow">ط®ظڈط·ظ‰ | ط±ظپظٹظ‚ظƒ ظ†ط­ظˆ ط§ظ„طھظپظˆظ‚</span>
            <h1>${title}</h1>
            ${subtitle ? `<p>${subtitle}</p>` : ""}
          </div>
        </section>
        <div id="error" class="error hidden"></div>
        ${content}
        <footer style="text-align: center; padding: 25px 20px; font-size: 0.9em; background: linear-gradient(135deg, #f0f7ff, #e6f0fa); color: #333; margin-top: 50px; border-top: 2px solid #cce0ff; border-radius: 10px 10px 0 0;">
          <strong style="color: #4285F4; font-size: 1.1em;">ط®ظڈط·ظ‰ | ط±ظپظٹظ‚ظƒ ظ†ط­ظˆ ط§ظ„طھظپظˆظ‚</strong><br>
          ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ‚ ظ…ط­ظپظˆط¸ط© ط§ظ„ظ…ط¨ط±ظ…ط¬ ظ…ط¹ط§ط° ط§ظ„طµط¨ظˆط­ &copy; ${new Date().getFullYear()}<br>
          <div style="margin-top: 15px; display: flex; justify-content: center; gap: 20px; align-items: center;">
            <a href="https://github.com/MoazAlsabouh/" target="_blank" title="GitHub">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#333"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/moazalsabouh/" target="_blank" title="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="https://x.com/moazAlsabouh" target="_blank" title="X (Twitter)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#1da1f2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </footer>
      </main>`;

    const logoutBtn = $("logout");
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await signOut(auth);
        location.href = "/login.html";
      };
    }

    const refreshBtn = $("refresh");
    if (refreshBtn) {
      refreshBtn.onclick = () => location.reload();
    }
  }
}



function showError(error) {
  const box = $("error");
  if (!box) return;
  box.textContent = `âڑ ï¸ڈ ${error.message || error}`;
  box.classList.remove("hidden");
}

function hideError() {
  const box = $("error");
  if (box) box.classList.add("hidden");
}



async function fetchUserProfile() {
  if (!auth.currentUser) return null;
  try {
    const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {}
  return { name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0], stream: 'ط¹ظ„ظ…ظٹ' };
}

async function fetchLessons() {
  const q = query(collection(db, "lessons"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchProgress() {
  if (!auth.currentUser) return [];
  const q = query(collection(db, "progress"), where("user", "==", auth.currentUser.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchExams() {
  if (!auth.currentUser) return [];
  const q = query(collection(db, "exams"), where("user", "==", auth.currentUser.uid));
  const snap = await getDocs(q);
  const exams = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return exams.sort((a, b) => new Date(a.at) - new Date(b.at));
}

async function fetchChannels() {
  if (!auth.currentUser) return [];
  const q = query(collection(db, "channels"), where("user", "==", auth.currentUser.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchWeeklyTasks() {
  if (!auth.currentUser) return [];
  const q = query(collection(db, "weeklyTasks"), where("user", "==", auth.currentUser.uid));
  const snap = await getDocs(q);
  const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 2) % 7)); // Align to Friday
  startOfWeek.setHours(0,0,0,0);
  
  for (const t of tasks) {
    if (t.done && t.doneDate) {
      if (new Date(t.doneDate) < startOfWeek) {
        t.done = false;
        t.doneDate = null;
        updateDoc(doc(db, 'weeklyTasks', t.id), { done: false, doneDate: null }).catch(e=>console.error(e));
      }
    }
  }
  return tasks;
}

async function fetchWeeklyActivities() {
  if (!auth.currentUser) return { weeks: [], current: null, window: {} };
  
  const q = query(collection(db, "weeklyActivity"), where("user", "==", auth.currentUser.uid));
  const snap = await getDocs(q);
  const activities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Generate 52 weeks starting from Sunday, Aug 30, 2026
  const academicYearStart = new Date("2026-08-28T00:00:00Z");
  const weeks = [];
  for (let i = 0; i < 52; i++) {
    const start = new Date(academicYearStart);
    start.setUTCDate(start.getUTCDate() + (i * 7));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    
    const saved = activities.find(a => a.start === startStr);
    weeks.push({
      start: startStr,
      end: endStr,
      completed: saved ? saved.completed : 0,
      percent: saved ? saved.percent : 0,
      days: saved ? saved.days : {}
    });
  }
  
  const now = new Date();
  const startDay = new Date(now);
  startDay.setDate(now.getDate() - ((now.getDay() + 2) % 7)); // Align to Friday
  startDay.setHours(0,0,0,0);
  const endDay = new Date(startDay);
  endDay.setDate(startDay.getDate() + 6);
  
  const currentWindow = { start: startDay.toISOString().slice(0, 10), end: endDay.toISOString().slice(0, 10) };
  let current = weeks.find(a => a.start === currentWindow.start);
  
  return { weeks, current, window: currentWindow };
}

async function loadProgress() {
  const user = auth.currentUser;
  if (!user) return { overallPercent: 0, totalLessons: 0, subjects: [], stages: [] };

  const [allLessons, progressList, userProfile] = await Promise.all([
    fetchLessons(),
    fetchProgress(),
    fetchUserProfile()
  ]);
  state.userProfile = userProfile;
  const lessons = allLessons.filter(x => !x.stream || x.stream === 'ظ…ط´طھط±ظƒ' || x.stream === userProfile.stream);


  const progressMap = {};
  progressList.forEach(p => { progressMap[p.lesson] = p; });

  const subjects = [...new Set(lessons.map(x => x.subject).filter(Boolean))].sort();
  const stages = [["first","ط§ظ„ط¯ط±ط§ط³ط© ط§ظ„ط£ظˆظ„ظ‰"],["review1","ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط£ظˆظ„ظ‰"],["review2","ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط«ط§ظ†ظٹط©"],["retention","ظ…ط±ط§ط¬ط¹ط© ط§ظ„طھط«ط¨ظٹطھ"],["final","ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط§ظ…طھط­ط§ظ†ظٹط© ط§ظ„ط£ط®ظٹط±ط©"]];

  const stageProgress = Object.fromEntries(stages.map(([key, label]) => { 
    const done = lessons.filter(x => progressMap[x.id]?.[key]).length; 
    return [key, {label, done, total: lessons.length, percent: lessons.length ? Math.round((done/lessons.length)*100) : 0}]; 
  }));

  const subjectProgress = subjects.map(subject => { 
    const rows = lessons.filter(x => x.subject === subject); 
    const stage = Object.fromEntries(stages.map(([key, label]) => {
      const done = rows.filter(x => progressMap[x.id]?.[key]).length;
      return [key, {label, done, total: rows.length, percent: rows.length ? Math.round((done/rows.length)*100) : 0}];
    })); 
    const completedStages = rows.reduce((sum, x) => sum + stages.filter(([key]) => progressMap[x.id]?.[key]).length, 0); 
    const totalChecks = rows.length * stages.length; 
    return {subject, lessons: rows.length, percent: totalChecks ? Math.round((completedStages/totalChecks)*100) : 0, stages: stage}; 
  });

  const totalChecks = lessons.length * stages.length; 
  const completedChecks = lessons.reduce((sum, x) => sum + stages.filter(([key]) => progressMap[x.id]?.[key]).length, 0);

  state.data = { academicYear: "2026/2027", updatedAt: new Date().toISOString(), totalLessons: lessons.length, overallPercent: totalChecks ? Math.round((completedChecks/totalChecks)*100) : 0, stages: stageProgress, subjects: subjectProgress };
  return state.data;
}


function countdown(at) {
  if (!at) return { expired: true, text: "ظ„ظ… ظٹط­ط¯ط¯ ظ…ظˆط¹ط¯" };
  const diff = new Date(at).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return { expired: true, text: "ط§ظ†طھظ‡ظ‰ ط§ظ„ظ…ظˆط¹ط¯" };
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    expired: false,
    text: `${days} ظٹظˆظ… â€¢ ${hours} ط³ â€¢ ${minutes} ط¯ â€¢ ${seconds} ط«`,
    days, hours, minutes, seconds
  };
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const parts = String(timeStr).trim().split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  if (isNaN(hours)) return timeStr;
  const period = hours >= 12 ? "ظ…" : "طµ";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

function formatDate(value) {
  if (!value) return "â€”";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "â€”";
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "ظ…" : "طµ";
  hours = hours % 12 || 12;
  return `${d.getDate()} ${LEVANT_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}طŒ ${hours}:${mins} ${period}`;
}

function renderDashboard(d, examsList = []) {
  const safeExams = Array.isArray(examsList) ? examsList.map(toExam) : [];
  const upcoming = safeExams
    .filter(x => x.at && new Date(x.at).getTime() > Date.now())
    .sort((a, b) => new Date(a.at) - new Date(b.at))[0];

  const overall = Number(d?.overallPercent) || 0;
  const totalLessons = d?.totalLessons || 0;
  const subjectsList = Array.isArray(d?.subjects) ? d.subjects : [];
  const stagesList = d?.stages && typeof d.stages === "object" ? Object.values(d.stages) : [];
  const totalDoneStages = stagesList.reduce((s, x) => s + (Number(x.done) || 0), 0);

  shell({
    title: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…",
    subtitle: "ظ…ظ„ط®طµ ط³ط±ظٹط¹ ظ„ظ„طھظ‚ط¯ظ… ط§ظ„ط¹ط§ظ… ظˆظ…ظˆط¹ط¯ ط§ظ„ط§ظ…طھط­ط§ظ† ط§ظ„ظ‚ط§ط¯ظ….",
    active: "dashboard"
  }, `
    <section class="hero-grid">
      <article class="card overall-card">
        <div class="card-kicker">ط§ظ„طھظ‚ط¯ظ… ط§ظ„ط¹ط§ظ…</div>
        <div class="overall-value">${overall}%</div>
        ${bar(overall)}
        <div class="stats-row">
          <div><b>${totalLessons}</b><span>ط¯ط±ط³ظ‹ط§</span></div>
          <div><b>${subjectsList.length}</b><span>ظ…ظˆط§ط¯</span></div>
          <div><b>${totalDoneStages}</b><span>ظ…ط±ط§ط­ظ„ ظ…ظ†ط¬ط²ط©</span></div>
        </div>
      </article>
      <article class="card exam-hero">
        <div class="card-kicker">âڈ³ ط§ظ„ط§ظ…طھط­ط§ظ† ط§ظ„ظ‚ط§ط¯ظ…</div>
        ${upcoming ? `
          <h2>${esc(upcoming.name || upcoming.subject)}</h2>
          <p class="muted">${esc(upcoming.subject)} â€¢ ${formatDate(upcoming.at)}</p>
          <div id="mainCountdown" class="countdown-big">${countdown(upcoming.at).text}</div>
          <a class="button" href="exams.html">ط¹ط±ط¶ ظƒظ„ ط§ظ„ط§ظ…طھط­ط§ظ†ط§طھ</a>
        ` : `<div class="empty compact">ظ„ط§ ظٹظˆط¬ط¯ ط§ظ…طھط­ط§ظ† ظ‚ط§ط¯ظ… ظ…ط³ط¬ظ„ ط­ط§ظ„ظٹظ‹ط§.<br><a href="exams.html">ط£ط¶ظپ ط£ظˆظ„ ط§ظ…طھط­ط§ظ†</a></div>`}
      </article>
    </section>

    <section class="section-block">
      <div class="section-title">
        <div>
          <h2>ًں“ٹ ظ†ط¸ط±ط© ط³ط±ظٹط¹ط© ط¹ظ„ظ‰ ط§ظ„ظ…ظˆط§ط¯</h2>
          <p>ط§ط¶ط؛ط· ط¹ظ„ظ‰ ط£ظٹ ظ…ط§ط¯ط© ظ„ظپطھط­ طµظپط­طھظ‡ط§ ظˆطھظپط§طµظٹظ„ ط§ظ„ظˆط­ط¯ط§طھ ظˆط§ظ„ط¯ط±ظˆط³.</p>
        </div>
        <a class="button secondary" href="subjects.html">ظƒظ„ ط§ظ„ظ…ظˆط§ط¯</a>
      </div>
      <div class="subject-grid">
        ${subjectsList.map(s => `
          <a class="subject-card" href="subject.html?name=${encodeURIComponent(s.subject)}">
            <div class="subject-card-head">
              <span>${esc(s.subject)}</span>
              <strong>${s.percent || 0}%</strong>
            </div>
            ${bar(s.percent || 0, "mini-progress")}
            <small>${s.lessons || 0} ط¯ط±ط³</small>
          </a>
        `).join("")}
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <div>
          <h2>ًں§­ ظ…ط±ط§ط­ظ„ ط§ظ„ط¯ط±ط§ط³ط©</h2>
          <p>طھظ‚ط¯ظ… ظƒظ„ ظ…ط±ط­ظ„ط© ط¹ظ„ظ‰ ظ…ط³طھظˆظ‰ ط¬ظ…ظٹط¹ ط§ظ„ط¯ط±ظˆط³.</p>
        </div>
      </div>
      <div class="stage-grid">
        ${stagesList.map(s => `
          <article class="stage-card">
            <strong>${s.percent || 0}%</strong>
            <b>${esc(s.label || "ظ…ط±ط­ظ„ط©")}</b>
            <span>${s.done || 0} ظ…ظ† ${s.total || 0} ط¯ط±ط³</span>
            ${bar(s.percent || 0)}
          </article>
        `).join("")}
      </div>
    </section>`);

  if (upcoming) {
    clearInterval(state.examTimer);
    const update = () => {
      const el = $("mainCountdown");
      if (el) el.textContent = countdown(upcoming.at).text;
    };
    update();
    state.examTimer = setInterval(update, 1000);
  }
}

async function dashboardPage() {
  try {
    const [d, rawExams] = await Promise.all([
      loadProgress(),
      fetchExams()
    ]);
    const safeExams = Array.isArray(rawExams) ? rawExams.map(toExam) : [];
    renderDashboard(d, safeExams);
  } catch (e) {
    shell({
      title: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…",
      subtitle: "ظ…ظ„ط®طµ ط§ظ„ط¯ط±ط§ط³ط© ظ„ط¹ط§ظ… 2026/2027.",
      active: "dashboard"
    }, `<div class="card empty">طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ.</div>`);
    showError(e);
  }
}

async function subjectsPage() {
  shell({
    title: "ط§ظ„ظ…ظˆط§ط¯",
    subtitle: "ظƒظ„ ظ…ط§ط¯ط© ظ„ظ‡ط§ طµظپط­ط© ظ…ط³طھظ‚ظ„ط© ط­طھظ‰ طھط¨ظ‚ظ‰ ط§ظ„ط¯ط±ط§ط³ط© ظ…ط±طھط¨ط© ظˆظˆط§ط¶ط­ط©.",
    active: "subjects"
  }, `<div id="subjectPageGrid" class="subject-grid large"></div>`);

  try {
    const d = await loadProgress();
    const subjects = Array.isArray(d?.subjects) ? d.subjects : [];
    const gridEl = $("subjectPageGrid");
    if (!gridEl) return;

    gridEl.innerHTML = subjects.map(s => {
      const stages = s.stages && typeof s.stages === "object" ? Object.values(s.stages) : [];
      return `
        <a class="subject-card detailed" href="subject.html?name=${encodeURIComponent(s.subject)}">
          <div class="subject-card-head">
            <span>${esc(s.subject)}</span>
            <strong>${s.percent || 0}%</strong>
          </div>
          ${bar(s.percent || 0)}
          <div class="subject-meta">
            <span>${s.lessons || 0} ط¯ط±ط³</span>
            <span>ظپطھط­ ط§ظ„ظ…ط§ط¯ط© â†گ</span>
          </div>
          <div class="tiny-stages">
            ${stages.map(x => `<span>${esc(x.label)}: <b>${x.percent || 0}%</b></span>`).join("")}
          </div>
        </a>`;
    }).join("");
  } catch (e) {
    showError(e);
  }
}

function subjectFromUrl() {
  return new URLSearchParams(location.search).get("name") || "";
}

function renderSubjectPage(d, subjectName) {
  const subject = (d?.subjects || []).find(x => x.subject === subjectName);
  if (!subject) {
    shell({
      title: "ط§ظ„ظ…ط§ط¯ط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©",
      subtitle: "ط§ط®طھط± ظ…ط§ط¯ط© ظ…ظ† ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط§ط¯.",
      active: "subjects"
    }, `<div class="card empty"><a class="button" href="subjects.html">ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ ط§ظ„ظ…ظˆط§ط¯</a></div>`);
    return;
  }

  const stages = subject.stages && typeof subject.stages === "object" ? Object.values(subject.stages) : [];

  shell({
    title: subject.subject,
    subtitle: `${subject.lessons} ط¯ط±ط³ â€¢ ط¥ظ†ط¬ط§ط² ط§ظ„ظ…ط§ط¯ط© ${subject.percent}%`,
    active: "subjects"
  }, `
    <section class="subject-summary card">
      <div>
        <span class="card-kicker">طھظ‚ط¯ظ… ط§ظ„ظ…ط§ط¯ط©</span>
        <strong class="summary-percent">${subject.percent}%</strong>
      </div>
      <div class="summary-progress">
        ${bar(subject.percent)}
        <small>ظٹظ…ظƒظ†ظƒ ظپطھط­ ط§ظ„ظˆط­ط¯ط§طھ ظˆط§ظ„طھظ†ظ‚ظ„ ط¨ظٹظ†ظ‡ط§ ط¯ظˆظ† ط§ط²ط¯ط­ط§ظ… ط§ظ„طµظپط­ط©.</small>
      </div>
    </section>
    <section class="stage-grid compact-stages">
      ${stages.map(s => `
        <article class="stage-card">
          <strong>${s.percent}%</strong>
          <b>${esc(s.label)}</b>
          <span>${s.done} ظ…ظ† ${s.total}</span>
          ${bar(s.percent)}
        </article>
      `).join("")}
    </section>
    <section class="card lessons-card">
      <div class="section-title">
        <div>
          <h2>ًں“– ظˆط­ط¯ط§طھ ط§ظ„ظ…ط§ط¯ط©</h2>
          <p>ظ†ط¹ط±ط¶ ظˆط­ط¯ط© ظˆط§ط­ط¯ط© ظپظٹ ظƒظ„ ظ…ط±ط© ظ„طھظƒظˆظ† ط§ظ„ظ…طھط§ط¨ط¹ط© ط£ط³ظ„ط³.</p>
        </div>
        <a class="button secondary" href="subjects.html">â†گ ظƒظ„ ط§ظ„ظ…ظˆط§ط¯</a>
      </div>
      <div class="unit-toolbar">
        <button id="prevUnit" class="secondary">â†’ ط§ظ„ط³ط§ط¨ظ‚ط©</button>
        <div class="unit-current">
          <span id="unitCounter">â€”</span>
          <strong id="unitTitle">â€”</strong>
        </div>
        <button id="nextUnit" class="secondary">ط§ظ„طھط§ظ„ظٹط© â†گ</button>
      </div>
      <div id="unitProgress"></div>
      <div id="lessons" class="lessons"></div>
    </section>
    <section class="card">
      <div class="section-title">
        <div>
          <h2>ًںژ¥ ظ…طµط§ط¯ط± ظ‡ط°ظ‡ ط§ظ„ظ…ط§ط¯ط©</h2>
          <p>ط§ظ„ظ‚ظ†ظˆط§طھ ظˆظ‚ظˆط§ط¦ظ… ط§ظ„طھط´ط؛ظٹظ„ ط§ظ„ظ…ط±طھط¨ط·ط© ط¨ط§ظ„ظ…ط§ط¯ط©.</p>
        </div>
        <a class="button secondary" href="channels.html">ط¥ط¯ط§ط±ط© ط§ظ„ظ…طµط§ط¯ط±</a>
      </div>
      <div id="subjectChannels" class="channels"></div>
    </section>`);
}

function getUnitsForSubject(subjectName) {
  const rows = state.lessons.filter(x => x.subject === subjectName);
  const units = [...new Set(rows.map(x => x.unit || "ط¯ط±ظˆط³ ط¨ط¯ظˆظ† ظˆط­ط¯ط©"))];
  return { rows, units };
}

function renderLessons(subjectName) {
  const { rows, units } = getUnitsForSubject(subjectName);
  if (!units.length) {
    $("unitCounter").textContent = "ظ„ط§ طھظˆط¬ط¯ ظˆط­ط¯ط§طھ";
    $("unitTitle").textContent = "â€”";
    $("unitProgress").innerHTML = "";
    $("lessons").innerHTML = `<div class="empty">ظ„ط§ طھظˆط¬ط¯ ط¯ط±ظˆط³ ظ…ط³ط¬ظ„ط© ظ„ظ‡ط°ظ‡ ط§ظ„ظ…ط§ط¯ط©.</div>`;
    $("prevUnit").disabled = $("nextUnit").disabled = true;
    return;
  }

  state.unitIndex = Math.max(0, Math.min(state.unitIndex, units.length - 1));
  const unit = units[state.unitIndex];
  const unitRows = rows.filter(x => (x.unit || "ط¯ط±ظˆط³ ط¨ط¯ظˆظ† ظˆط­ط¯ط©") === unit).sort((a, b) => (LESSON_ORDER[a.lesson] ?? 9999) - (LESSON_ORDER[b.lesson] ?? 9999));
  const checks = unitRows.reduce((sum, x) => sum + x.stages.filter(s => s.checked).length, 0);
  const total = unitRows.length * 5;
  const percent = total ? Math.round((checks / total) * 100) : 0;

  $("unitCounter").textContent = `ط§ظ„ظˆط­ط¯ط© ${state.unitIndex + 1} ظ…ظ† ${units.length}`;
  $("unitTitle").textContent = unit;
  $("unitProgress").innerHTML = `
    <div class="unit-progress-head">
      <span>ط¥ظ†ط¬ط§ط² ط§ظ„ظˆط­ط¯ط©</span>
      <strong>${percent}%</strong>
    </div>
    ${bar(percent)}`;

  $("lessons").innerHTML = unitRows.map(x => `
    <article class="lesson-row">
      <div class="lesson-info">
        <strong>${esc(x.lesson)}</strong>
        <p>${x.page ? `طµظپط­ط© ${esc(x.page)}` : ""}</p>
      </div>
      <div class="checks">
        ${x.stages.map(s => `
          <label>
            <input type="checkbox" ${s.checked ? "checked" : ""} data-id="${attr(x.id)}" data-prop="${attr(s.property)}">
            ${esc(s.label)}
          </label>
        `).join("")}
      </div>
    </article>
  `).join("");

  $("prevUnit").disabled = state.unitIndex === 0;
  $("nextUnit").disabled = state.unitIndex >= units.length - 1;

  document.querySelectorAll("#lessons input[data-id]").forEach(cb => {
    cb.onchange = async e => {
      const el = e.target;
      try {
        const allowed = { "ط§ظ„ط¯ط±ط§ط³ط© ط§ظ„ط£ظˆظ„ظ‰": "first", "ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط£ظˆظ„ظ‰": "review1", "ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط«ط§ظ†ظٹط©": "review2", "ظ…ط±ط§ط¬ط¹ط© ط§ظ„طھط«ط¨ظٹطھ": "retention", "ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط§ظ…طھط­ط§ظ†ظٹط© ط§ظ„ط£ط®ظٹط±ط©": "final" };
  const key = allowed[el.dataset.prop];
  const q = query(collection(db, "progress"), where("user", "==", auth.currentUser.uid), where("lesson", "==", el.dataset.id));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { [key]: el.checked });
  } else {
    await addDoc(collection(db, "progress"), { user: auth.currentUser.uid, lesson: el.dataset.id, [key]: el.checked });
  }
        const old = state.unitIndex;
        await loadProgress();
        await loadLessonsForSubject(subjectName, false);
        state.unitIndex = old;
        renderLessons(subjectName);
      } catch (err) {
        el.checked = !el.checked;
        showError(err);
      }
    };
  });
}

async function loadLessonsForSubject(subjectName, reset = true) {
  state.lessons = await (async function() {
  const [allLessons, progressList, userProfile] = await Promise.all([
    fetchLessons(),
    fetchProgress(),
    fetchUserProfile()
  ]);
  state.userProfile = userProfile;
  const lessons = allLessons.filter(x => !x.stream || x.stream === 'ظ…ط´طھط±ظƒ' || x.stream === userProfile.stream);

  const progressMap = {};
  progressList.forEach(p => { progressMap[p.lesson] = p; });
  const stages = [["first","ط§ظ„ط¯ط±ط§ط³ط© ط§ظ„ط£ظˆظ„ظ‰"],["review1","ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط£ظˆظ„ظ‰"],["review2","ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط«ط§ظ†ظٹط©"],["retention","ظ…ط±ط§ط¬ط¹ط© ط§ظ„طھط«ط¨ظٹطھ"],["final","ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط§ظ…طھط­ط§ظ†ظٹط© ط§ظ„ط£ط®ظٹط±ط©"]];
  return lessons.map(x => {
    const p = progressMap[x.id] || {};
    return {
      id: x.id, lesson: x.lesson, subject: x.subject, unit: x.unit,
      stages: stages.map(([key, label]) => ({ property: label, label, checked: !!p[key] }))
    };
  });
})();
  if (reset) state.unitIndex = 0;
  renderLessons(subjectName);
}

async function renderSubjectChannels(subjectName) {
  const rows = (await fetchChannels()).filter(x => x.subject === subjectName);
  $("subjectChannels").innerHTML = rows.length
    ? rows.map(channelCard).join("")
    : `<div class="empty">ظ„ط§ طھظˆط¬ط¯ ظ…طµط§ط¯ط± ظ…ط³ط¬ظ„ط© ظ„ظ‡ط°ظ‡ ط§ظ„ظ…ط§ط¯ط© ط­طھظ‰ ط§ظ„ط¢ظ†.</div>`;
}

function channelCard(x) {
  return `
    <article class="channel">
      <span class="tag">${esc(x.subject || "")}</span>
      <h3>${esc(x.name || "ظ‚ظ†ط§ط© ط¨ط¯ظˆظ† ط§ط³ظ…")}</h3>
      ${x.channelUrl ? `<a href="${attr(x.channelUrl)}" target="_blank" rel="noopener noreferrer">ًںژ¥ ظپطھط­ ط§ظ„ظ‚ظ†ط§ط©</a>` : ""}
      ${x.playlistName ? (x.playlistUrl ? `<a href="${attr(x.playlistUrl)}" target="_blank" rel="noopener noreferrer">â–¶ ${esc(x.playlistName)}</a>` : `<span class="source-note">â–¶ ${esc(x.playlistName)}</span>`) : ""}
      ${x.notes ? `<p>${esc(x.notes)}</p>` : ""}
      ${x.user === auth.currentUser?.uid ? `<button class="danger-link" data-del-channel="${attr(x.id)}" style="margin-top: 10px; font-size: 0.8em;">ط­ط°ظپ ط§ظ„ظ…طµط¯ط±</button>` : ""}
    </article>`;
}

async function subjectPage() {
  const subjectName = subjectFromUrl();
  try {
    const d = await loadProgress();
    renderSubjectPage(d, subjectName);
    if (!d.subjects.some(x => x.subject === subjectName)) return;
    await loadLessonsForSubject(subjectName);
    await renderSubjectChannels(subjectName);
    $("prevUnit").onclick = () => {
      if (state.unitIndex > 0) {
        state.unitIndex--;
        renderLessons(subjectName);
      }
    };
    $("nextUnit").onclick = () => {
      const { units } = getUnitsForSubject(subjectName);
      if (state.unitIndex < units.length - 1) {
        state.unitIndex++;
        renderLessons(subjectName);
      }
    };
  } catch (e) {
    if (!document.getElementById("app").innerHTML) {
      shell({ title: "ط§ظ„ظ…ط§ط¯ط©", active: "subjects" }, "");
    }
    showError(e);
  }
}

function weeklyForm() {
  return `
    <form id="weeklyForm" class="form-grid">
      <select name="day" required>
        ${WEEKDAYS.map(x => `<option value="${x.key}">${x.label}</option>`).join("")}
      </select>
      <input name="subject" placeholder="ط§ظ„ظ…ط§ط¯ط©" required>
      <input name="task" placeholder="ط§ظ„ظ…ظ‡ظ…ط© / ط§ظ„ط¯ط±ط³" required>
      <input name="time" type="time" aria-label="ط§ظ„ظˆظ‚طھ">
      <button class="button" type="submit">ï¼‹ ط¥ط¶ط§ظپط©</button>
    </form>`;
}

function activityLevelClass(percent) {
  const p = Number(percent) || 0;
  if (p <= 0) return "activity-0";
  if (p < 25) return "activity-1";
  if (p < 50) return "activity-2";
  if (p < 75) return "activity-3";
  if (p < 100) return "activity-4";
  return "activity-5";
}

function weekLabel(x) {
  if (!x?.start) return "ط£ط³ط¨ظˆط¹";
  const start = new Date(`${x.start}T00:00:00Z`);
  const end = new Date(`${x.end}T00:00:00Z`);
  const fmt = d => `${d.getUTCDate()} ${LEVANT_MONTHS_SHORT[d.getUTCMonth()]}`;
  return `${fmt(start)} â€” ${fmt(end)}`;
}

function getDateForCell(weekStartStr, dayOffset) {
  if (!weekStartStr) return null;
  const d = new Date(`${weekStartStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d;
}

function renderWeeklyActivity(payload) {
  const rawWeeks = Array.isArray(payload?.weeks) ? payload.weeks : [];
  const weeks = rawWeeks.slice().sort((a, b) => {
    return new Date(`${a.start}T00:00:00Z`).getTime() - new Date(`${b.start}T00:00:00Z`).getTime();
  });

  const current = payload?.current;
  state.weeklyActivity = payload;

  const totalCompleted = weeks.reduce((sum, x) => sum + Number(x.completed || 0), 0);
  const activeWeeks = weeks.filter(x => Number(x.completed || 0) > 0).length;
  const average = weeks.length ? Math.round(weeks.reduce((sum, x) => sum + Number(x.percent || 0), 0) / weeks.length) : 0;

  // طھط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط§ط¨ظٹط¹ ط­ط³ط¨ ط§ظ„ط´ظ‡ظˆط± ط§ظ„ظ…طھط¹ط§ظ‚ط¨ط©
  const monthBlocks = [];
  let curBlock = null;

  weeks.forEach((w, idx) => {
    const d = new Date(`${w.start}T00:00:00Z`);
    if (isNaN(d.getTime())) return;
    const m = d.getUTCMonth();
    const y = d.getUTCFullYear();
    const key = `${y}-${m}`;
    if (!curBlock || curBlock.key !== key) {
      if (curBlock) monthBlocks.push(curBlock);
      curBlock = { key, m, y, startCol: idx + 1, span: 1 };
    } else {
      curBlock.span++;
    }
  });
  if (curBlock) monthBlocks.push(curBlock);

  const cellDataStore = [];

  const gridHtml = weeks.map((w) => {
    const isCurrentWeek = Boolean(current && w.start === current.start);

    return WEEKDAYS.map((dayObj, dayIdx) => {
      let dayCompleted = 0;
      let dayTotal = 0;
      let dayPercent = 0;

      if (isCurrentWeek) {
        // ط­ط³ط§ط¨ ط¥ظ†ط¬ط§ط² ط§ظ„ظٹظˆظ… ط¨ط¯ظ‚ط© ظ…طھظ†ط§ظ‡ظٹط© ظ…ظ† ظ…ظ‡ط§ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظ…ط­ط¯ط¯ط© ظ„ظ„ط£ط³ط¨ظˆط¹ ط§ظ„ط­ط§ظ„ظٹ
        const tasks = getTasksForDay(dayObj.key, state.weekly);
        dayTotal = tasks.length;
        dayCompleted = tasks.filter(t => t.done).length;
        dayPercent = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
      } else if (w.days && typeof w.days === "object") {
        const dayRecord = Array.isArray(w.days) ? w.days[dayIdx] : (w.days[dayObj.key] || w.days[normDay(dayObj.key)]);
        if (dayRecord) {
          dayCompleted = Number(dayRecord.completed || 0);
          dayTotal = Number(dayRecord.total || 0);
          dayPercent = Number(dayRecord.percent || 0);
        }
      }

      const cellDate = getDateForCell(w.start, dayIdx);
      const dateText = cellDate ? `${cellDate.getUTCDate()} ${LEVANT_MONTHS_SHORT[cellDate.getUTCMonth()]}` : "";
      const storeIndex = cellDataStore.length;

      cellDataStore.push({
        dayName: dayObj.label,
        dateText,
        completed: dayCompleted,
        total: dayTotal,
        percent: dayPercent,
        weekText: weekLabel(w),
        isCurrent: isCurrentWeek
      });

      const titleAttr = `${dayObj.label} (${dateText}) â€¢ ${dayCompleted}/${dayTotal} ظ…ظ†ط¬ط² (${dayPercent}%)`;

      return `<button type="button"
        class="activity-cell ${activityLevelClass(dayPercent)} ${isCurrentWeek ? "is-current-week" : ""}"
        title="${esc(titleAttr)}"
        aria-label="${esc(titleAttr)}"
        data-store-idx="${storeIndex}">
      </button>`;
    }).join("");
  }).join("");

  const targetEl = $("weeklyActivity");
  if (!targetEl) return;

  targetEl.innerHTML = `
    <section class="weekly-activity card">
      <div class="section-title activity-heading">
        <div>
          <h2>ًں“ˆ ظ†ط´ط§ط· ط§ظ„ط³ظ†ط© ط§ظ„ط¯ط±ط§ط³ظٹط©</h2>
          <p>ظƒظ„ ظ…ط±ط¨ط¹ ظٹظ…ط«ظ„ ظٹظˆظ…ظ‹ط§ ط¯ط±ط§ط³ظٹظ‹ط§ ظ…ط³طھظ‚ظ„ط§ظ‹طŒ ظˆظٹطھظ… طھط­ط¯ظٹط« ظ†ط³ط¨ط© ط§ظ„ط¥ظ†ط¬ط§ط² ظٹظˆظ…ظٹظ‹ط§.</p>
        </div>
        <span class="current-week-badge">ط§ظ„ط£ط³ط¨ظˆط¹ ط§ظ„ط­ط§ظ„ظٹ: ${current ? esc(weekLabel(current)) : ""}</span>
      </div>
      <div class="activity-summary">
        <div><strong>${activeWeeks}</strong><span>ط£ط³ط§ط¨ظٹط¹ ظ†ط´ط·ط©</span></div>
        <div><strong>${totalCompleted}</strong><span>ظ…ظ‡ط§ظ… ظ…ظ†ط¬ط²ط©</span></div>
        <div><strong>${average}%</strong><span>ظ…طھظˆط³ط· ط§ظ„ظ†ط´ط§ط·</span></div>
        <div><strong>${state.weekly ? state.weekly.filter(t=>t.done).length : 0}/${state.weekly ? state.weekly.length : 0}</strong><span>ظ‡ط°ط§ ط§ظ„ط£ط³ط¨ظˆط¹</span></div>
      </div>
      <div class="activity-scroll">
        <div class="activity-calendar">
          <div class="activity-months-wrap">
            <div class="activity-weekday-spacer"></div>
            <div class="activity-months" style="grid-template-columns: repeat(${weeks.length || 53}, 14px);">
              ${monthBlocks.map(b => {
                const name = LEVANT_MONTHS_SHORT[b.m];
                const fullName = `${LEVANT_MONTHS_FULL[b.m]} (${GREGORIAN_MONTHS[b.m]} ${b.y})`;
                return `<span style="grid-column:${b.startCol} / span ${b.span}" class="activity-month-label" title="${esc(fullName)}">${esc(name)}</span>`;
              }).join("")}
            </div>
          </div>
          <div class="activity-board">
            <div class="activity-weekdays" aria-hidden="true">
              ${WEEKDAYS.map(d => `<span title="${d.label}">${d.label}</span>`).join("")}
            </div>
            <div class="activity-grid" aria-label="ط®ط±ظٹط·ط© ط§ظ„ظ†ط´ط§ط· ط§ظ„ظٹظˆظ…ظٹ">
              ${gridHtml}
            </div>
          </div>
        </div>
      </div>
      <div class="activity-legend">
        <span>ط£ظ‚ظ„</span>
        <i class="activity-cell activity-0" title="0%"></i>
        <i class="activity-cell activity-1" title="1-24%"></i>
        <i class="activity-cell activity-2" title="25-49%"></i>
        <i class="activity-cell activity-3" title="50-74%"></i>
        <i class="activity-cell activity-4" title="75-99%"></i>
        <i class="activity-cell activity-5" title="100%"></i>
        <span>ط£ط¹ظ„ظ‰</span>
      </div>
      <div id="activityDetails" class="activity-details"></div>
    </section>`;

  document.querySelectorAll("[data-store-idx]").forEach(btn => {
    btn.onclick = () => {
      const item = cellDataStore[Number(btn.dataset.storeIdx)];
      if (!item) return;
      const detailsEl = $("activityDetails");
      if (detailsEl) {
        detailsEl.innerHTML = `
          <div>
            <b>${esc(item.dayName)} (${esc(item.dateText)})</b>
            <span>${item.completed} ظ…ظ† ${item.total} ظ…ظ‡ط§ظ… ظ…ظƒطھظ…ظ„ط©</span>
            <strong>${item.percent}%</strong>
            <small style="color:var(--muted)">[ط§ظ„ط£ط³ط¨ظˆط¹: ${esc(item.weekText)}]</small>
          </div>`;
      }
    };
  });
}

function renderWeekly(rows) {
  const currentDayIndex = new Date().getDay();
  // طھط­ظˆظٹظ„ ظ…ط¤ط´ط± ط§ظ„ظٹظˆظ… ظ„ظٹطھظˆط§ظپظ‚ ظ…ط¹ ط£ظٹط§ظ… ط§ظ„ط¯ط±ط§ط³ط© (ط§ظ„ط£ط­ط¯ = 0)
  const studyDaysIndices = [0, 1, 2, 3, 4];
  const todayKey = studyDaysIndices.includes(currentDayIndex) ? WEEKDAYS[currentDayIndex].key : "ط§ظ„ط£ط­ط¯";

  const listEl = $("weeklyList");
  if (!listEl) return;

  listEl.innerHTML = WEEKDAYS.map(d => {
    const items = getTasksForDay(d.key, rows);
    if (!items.length) return "";
    const doneCount = items.filter(x => x.done).length;
    const isToday = normDay(d.key) === normDay(todayKey);

    return `
      <section class="day-block ${isToday ? "today" : ""}">
        <div class="day-head">
          <h3>${d.label}</h3>
          <span>${doneCount}/${items.length} ظ…ظ†ط¬ط²</span>
        </div>
        ${items.map(x => `
          <article class="task-row">
            <label>
              <input type="checkbox" data-week-id="${attr(x.id)}" ${x.done ? "checked" : ""}>
              <span><b>${esc(x.subject)}</b> â€” ${esc(x.task)}${x.time ? ` <small>(${esc(formatTime12(x.time))})</small>` : ""}</span>
            </label>
            <button class="danger-link" data-delweek-id="${attr(x.id)}">ط­ط°ظپ</button>
          </article>
        `).join("")}
      </section>`;
  }).join("") || `<div class="empty">ظ„ظ… طھط¶ظپ ط£ظٹ ظ…ظ‡ط§ظ… ط¨ط¹ط¯.</div>`;

  document.querySelectorAll("[data-week-id]").forEach(el => {
    el.onchange = async () => {
      try {
        await updateDoc(doc(db, 'weeklyTasks', el.dataset.weekId), { done: el.checked, doneDate: el.checked ? new Date().toISOString() : null });
        state.weekly = await fetchWeeklyTasks();
        renderWeekly(state.weekly);
        renderWeeklyActivity(await fetchWeeklyActivities());
      } catch (e) {
        el.checked = !el.checked;
        showError(e);
      }
    };
  });

  document.querySelectorAll("[data-delweek-id]").forEach(el => {
    el.onclick = async () => {
      try {
        await deleteDoc(doc(db, 'weeklyTasks', el.dataset.delweekId));
        state.weekly = await fetchWeeklyTasks();
        renderWeekly(state.weekly);
        renderWeeklyActivity(await fetchWeeklyActivities());
      } catch (e) {
        showError(e);
      }
    };
  });
}

async function refreshWeeklyView() {
  const before = state.weeklyActivity?.current?.start || "";
  state.weekly = await fetchWeeklyTasks();
  const activity = await fetchWeeklyActivities();
  renderWeekly(state.weekly);
  renderWeeklyActivity(activity);
  return before !== (activity.current?.start || "");
}

async function weeklyPage() {
  shell({
    title: "ط§ظ„ط¬ط¯ظˆظ„ ط§ظ„ط£ط³ط¨ظˆط¹ظٹ",
    subtitle: "ظٹظڈط¹ط§ط¯ ط¶ط¨ط· ط¹ظ„ط§ظ…ط§طھ ط§ظ„ط¥ظ†ط¬ط§ط² ظƒظ„ ظٹظˆظ… ط®ظ…ظٹط³طŒ ظˆظٹظڈط­ظپط¸ ظ†ط´ط§ط· ظƒظ„ ط£ط³ط¨ظˆط¹ ظپظٹ ط³ط¬ظ„ ط§ظ„ط³ظ†ط© ظƒط§ظ…ظ„ط©.",
    active: "weekly"
  }, `
    <section class="card">${weeklyForm()}</section>
    <div id="weeklyList" class="days"></div>
    <div id="weeklyActivity"></div>`);

  try {
    await refreshWeeklyView();
    const form = $("weeklyForm");
    if (form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
          await addDoc(collection(db, 'weeklyTasks'), { user: auth.currentUser.uid, done: false, 
              day: f.get("day"),
              subject: f.get("subject"),
              task: f.get("task"),
              time: f.get("time")
             });
          e.target.reset();
          await refreshWeeklyView();
        } catch (err) {
          showError(err);
        }
      };
    }

    clearInterval(state.weeklyTimer);
    state.weeklyTimer = setInterval(async () => {
      try { await refreshWeeklyView(); } catch (e) { console.error(e); }
    }, 60000);
  } catch (e) {
    showError(e);
  }
}

function examCard(x) {
  const item = toExam(x);
  return `
    <article class="exam-card">
      <div>
        <span class="tag">${esc(item.subject)}</span>
        <h3>${esc(item.name)}</h3>
        <p>${formatDate(item.at)}</p>
      </div>
      <div class="exam-count" data-countdown="${attr(item.at)}">${countdown(item.at).text}</div>
      <button class="danger-link" data-delexam-id="${attr(item.id)}">ط­ط°ظپ</button>
    </article>`;
}

function renderExams(rows) {
  const safeList = Array.isArray(rows) ? rows.map(toExam) : [];
  const sorted = [...safeList].sort((a, b) => new Date(a.at) - new Date(b.at));
  const listEl = $("examList");
  if (!listEl) return;

  listEl.innerHTML = sorted.length
    ? sorted.map(examCard).join("")
    : `<div class="empty">ظ„ط§ طھظˆط¬ط¯ ط§ظ…طھط­ط§ظ†ط§طھ ظ…ط³ط¬ظ„ط©.</div>`;

  document.querySelectorAll("[data-delexam-id]").forEach(el => {
    el.onclick = async () => {
      try {
        await deleteDoc(doc(db, 'exams', el.dataset.delexamId));
        state.exams = await fetchExams();
        renderExams(state.exams);
      } catch (e) {
        showError(e);
      }
    };
  });
}

function updateExamTimers() {
  document.querySelectorAll("[data-countdown]").forEach(el => {
    el.textContent = countdown(el.dataset.countdown).text;
  });
}

async function examsPage() {
  shell({
    title: "ط§ظ„ط§ظ…طھط­ط§ظ†ط§طھ",
    subtitle: "ظƒظ„ ط§ظ„ظ…ظˆط§ط¹ظٹط¯ ظˆط§ظ„ط§ظ…طھط­ط§ظ†ط§طھ ظ…ط­ظپظˆط¸ط© ط¨ط¯ظ‚ط©طŒ ظˆط§ظ„ط¹ط¯ ط§ظ„طھظ†ط§ط²ظ„ظٹ ظٹطھط­ط¯ط« طھظ„ظ‚ط§ط¦ظٹط§ظ‹.",
    active: "exams"
  }, `
    <section class="card">
      <form id="examForm" class="form-grid">
        <input name="subject" placeholder="ط§ظ„ظ…ط§ط¯ط©" required>
        <input name="name" placeholder="ط§ط³ظ… ط§ظ„ط§ظ…طھط­ط§ظ†">
        <input name="date" type="date" required>
        <input name="time" type="time" required>
        <button class="button" type="submit">ï¼‹ ط¥ط¶ط§ظپط© ط§ظ…طھط­ط§ظ†</button>
      </form>
    </section>
    <div id="examList" class="exam-list"></div>`);

  try {
    state.exams = await fetchExams();
    renderExams(state.exams);

    const form = $("examForm");
    if (form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
          await addDoc(collection(db, 'exams'), { user: auth.currentUser.uid, 
              subject: f.get("subject"),
              name: f.get("name"),
              at: `${f.get("date")}T${f.get("time")}`
             });
          e.target.reset();
          state.exams = await fetchExams();
          renderExams(state.exams);
        } catch (err) {
          showError(err);
        }
      };
    }

    setInterval(updateExamTimers, 1000);
  } catch (e) {
    showError(e);
  }
}

function channelsForm() {
  return `
    <form id="channelForm" class="form-grid six">
      <input name="name" placeholder="ط§ط³ظ… ط§ظ„ظ‚ظ†ط§ط©" required>
      <input name="subject" placeholder="ط§ظ„ظ…ظ‚ط±ط±" required>
      <input name="channelUrl" type="url" placeholder="ط±ط§ط¨ط· ط§ظ„ظ‚ظ†ط§ط©">
      <input name="playlistName" placeholder="ط§ط³ظ… ظ‚ط§ط¦ظ…ط© ط§ظ„طھط´ط؛ظٹظ„">
      <input name="playlistUrl" type="url" placeholder="ط±ط§ط¨ط· ظ‚ط§ط¦ظ…ط© ط§ظ„طھط´ط؛ظٹظ„">
      <input name="notes" placeholder="ظ…ظ„ط§ط­ط¸ط§طھ">
      <button class="button" type="submit">ï¼‹ ط¥ط¶ط§ظپط© ط§ظ„ظ…طµط¯ط±</button>
    </form>`;
}

async function channelsPage() {
  shell({
    title: "ط§ظ„ظ‚ظ†ظˆط§طھ ظˆظ‚ظˆط§ط¦ظ… ط§ظ„طھط´ط؛ظٹظ„",
    subtitle: "ط§ط¬ظ…ط¹ ظ…طµط§ط¯ط± ط§ظ„ط´ط±ط­ ظپظٹ ظ…ظƒط§ظ† ظˆط§ط­ط¯طŒ ظˆظٹظ…ظƒظ†ظƒ ط£ظٹط¶ظ‹ط§ ظپطھط­ظ‡ط§ ظ…ظ† طµظپط­ط© ظƒظ„ ظ…ط§ط¯ط©.",
    active: "channels"
  }, `
    <section class="card">${channelsForm()}</section>
    <div id="channelList" class="channels large"></div>`);

  try {
    const render = async () => {
      const rows = await fetchChannels();
      const listEl = $("channelList");
      if (listEl) {
        listEl.innerHTML = rows.length
          ? rows.map(channelCard).join("")
          : `<div class="empty">ظ„ط§ طھظˆط¬ط¯ ظ…طµط§ط¯ط± ط¨ط¹ط¯.</div>`;
        document.querySelectorAll("[data-del-channel]").forEach(btn => {
          btn.onclick = async () => {
            if(confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…طµط¯ط±طں')) {
               try { await deleteDoc(doc(db, 'channels', btn.dataset.delChannel)); await render(); } catch(e) { showError(e); }
            }
          };
        });
      }
    };

    await render();

    const form = $("channelForm");
    if (form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
          await addDoc(collection(db, 'channels'), { user: auth.currentUser.uid, ...Object.fromEntries(f.entries()) });
          e.target.reset();
          await render();
        } catch (err) {
          showError(err);
        }
      };
    }
  } catch (e) {
    showError(e);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const init = async () => {
  hideError();
  try {
    if (page === "dashboard") return await dashboardPage();
    if (page === "subjects") return await subjectsPage();
    if (page === "subject") return await subjectPage();
    if (page === "weekly") return await weeklyPage();
    if (page === "exams") return await examsPage();
    if (page === "channels") return await channelsPage();
  } catch (err) {
    showError(err);
  }
};
init();
});


