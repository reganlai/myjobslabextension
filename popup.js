const SUPABASE_URL = "https://hrmsypgqtkgnkhodhqbb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybXN5cGdxdGtnbmtob2RocWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDYyNDIsImV4cCI6MjA4OTgyMjI0Mn0.gk0cYdMhNGtG_S5iJ40kMVucmbegQLGGC847ZA5RCLw";

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rename global variable to avoid conflict
const supabase = supabaseClient;

// DOM Elements
const loadingView = document.getElementById("loading-view");
const authView    = document.getElementById("auth-view");
const appView     = document.getElementById("app-view");
const loginForm   = document.getElementById("login-form");
const authError   = document.getElementById("auth-error");
const userEmail   = document.getElementById("user-email");
const logoutBtn   = document.getElementById("logout-button");

const titleEl     = document.getElementById("job-title");
const companyEl   = document.getElementById("company");
const locationEl  = document.getElementById("location");
const addBtn      = document.getElementById("action-button");
const listEl      = document.getElementById("jobs-list");

let currentJob = null;
let session = null;

// ── Initialization ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check Auth State
  const { data } = await supabase.auth.getSession();
  session = data.session;
  updateUI();

  if (session) {
    initApp();
  }
});

function updateUI() {
  loadingView.classList.add("hidden");
  if (session) {
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    userEmail.textContent = session.user.email;
  } else {
    appView.classList.add("hidden");
    authView.classList.remove("hidden");
  }
}

async function initApp() {
  // 2. Scrape Current Tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Don't scrape on non-http pages
    if (!tab.url.startsWith("http")) throw new Error("Not a job page");

    currentJob = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_INFO" });
    currentJob.url = tab.url;

    titleEl.textContent   = currentJob.title    || "—";
    companyEl.textContent = currentJob.company  || "—";
    locationEl.textContent= currentJob.location || "—";
    
    // Check if already saved
    checkIfSaved(currentJob.url);
  } catch (err) {
    titleEl.textContent = "—";
    companyEl.textContent = "—";
    locationEl.textContent = "—";
    addBtn.disabled = true;
    addBtn.textContent = "Cannot scrape this page";
  }

  // 3. Load Recent Jobs
  loadRecentJobs();
}

// ── Auth Handlers ────────────────────────────────────────────────────────────
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.classList.add("hidden");
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    authError.textContent = error.message;
    authError.classList.remove("hidden");
  } else {
    session = data.session;
    updateUI();
    initApp();
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  session = null;
  updateUI();
});

// ── Data Handlers ────────────────────────────────────────────────────────────
addBtn.addEventListener("click", async () => {
  if (!currentJob || !session) return;

  addBtn.disabled = true;
  addBtn.textContent = "Saving...";

  const { error } = await supabase
    .from('jobs')
    .insert({
      user_id: session.user.id,
      title: currentJob.title || "Unknown Title",
      company: currentJob.company || "Unknown Company",
      url: currentJob.url,
      status: 'Applied'
    });

  if (error) {
    addBtn.disabled = false;
    addBtn.textContent = "Error saving";
    console.error(error);
  } else {
    addBtn.textContent = "✓ Saved to Dashboard";
    loadRecentJobs();
  }
});

async function checkIfSaved(url) {
  const { data } = await supabase
    .from('jobs')
    .select('id')
    .eq('url', url)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (data) {
    addBtn.disabled = true;
    addBtn.textContent = "✓ Already in Dashboard";
  }
}

async function loadRecentJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!error) {
    renderJobs(data);
  }
}

function renderJobs(jobs) {
  listEl.innerHTML = "";
  if (!jobs || jobs.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No jobs saved yet.</li>';
    return;
  }

  jobs.forEach(job => {
    const li = document.createElement("li");
    li.className = "job-item";
    li.innerHTML = `
      <div class="job-header">
        <span class="job-title">${escapeHtml(job.title)}</span>
        <span class="job-status">${escapeHtml(job.status)}</span>
      </div>
      <div class="job-company">${escapeHtml(job.company)}</div>
    `;
    listEl.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
