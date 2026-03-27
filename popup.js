// popup.js — Popup Brain

const titleEl   = document.getElementById("job-title");
const companyEl = document.getElementById("company");
const locationEl = document.getElementById("location");
const urlEl     = document.getElementById("url");
const addBtn    = document.getElementById("action-button");
const clearBtn  = document.getElementById("clear-button");
const listEl    = document.getElementById("jobs-list");

let currentJob = null; // job data scraped from the active tab

// ── On load ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Ask content.js for the job info on the current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentJob = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_INFO" });
    currentJob.url = tab.url; // attach the tab URL

    titleEl.textContent   = "Job Title: "  + (currentJob.title    || "—");
    companyEl.textContent = "Company: "    + (currentJob.company  || "—");
    locationEl.textContent= "Location: "  + (currentJob.location || "—");
    urlEl.textContent     = "URL: "        + currentJob.url;
    urlEl.title           = currentJob.url; // tooltip for long URLs
  } catch {
    // Content script not injected on this page (e.g., chrome:// pages)
    titleEl.textContent   = "Job Title: —";
    companyEl.textContent = "Company: —";
    locationEl.textContent= "Location: —";
    urlEl.textContent     = "URL: —";
    addBtn.disabled = true;
    addBtn.textContent = "Not a job page";
  }

  // 2. Load and render saved jobs
  renderJobs();
});

// ── Add to Applied ────────────────────────────────────────────────────────────
addBtn.addEventListener("click", async () => {
  if (!currentJob) return;

  const newJob = {
    title:    currentJob.title    || "Unknown Title",
    company:  currentJob.company  || "Unknown Company",
    location: currentJob.location || "",
    url:      currentJob.url      || "",
    date:     new Date().toLocaleDateString(),
  };

  const { jobs = [] } = await chrome.storage.local.get("jobs");

  // Prevent duplicates by URL
  if (jobs.some(j => j.url === newJob.url)) {
    addBtn.textContent = "✓ Already saved";
    addBtn.disabled = true;
    return;
  }

  jobs.push(newJob);
  await chrome.storage.local.set({ jobs });

  renderJobs(jobs);

  addBtn.textContent = "✓ Applied";
  addBtn.disabled = true;
});

// ── Clear All ─────────────────────────────────────────────────────────────────
clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.clear();
  renderJobs([]);
  // Re-enable the add button for current page if we have job data
  if (currentJob) {
    addBtn.textContent = "Add to Applied";
    addBtn.disabled = false;
  }
});

// ── Render helpers ────────────────────────────────────────────────────────────
async function renderJobs(jobs) {
  if (!jobs) {
    const data = await chrome.storage.local.get("jobs");
    jobs = data.jobs || [];
  }

  listEl.innerHTML = "";

  if (jobs.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No applications saved yet.</li>';
    return;
  }

  jobs.slice().reverse().forEach(job => {
    const li = document.createElement("li");
    li.className = "job-item";
    li.innerHTML = `
      <div class="job-header">
        <span class="job-title">${escapeHtml(job.title)}</span>
        <span class="job-date">${escapeHtml(job.date)}</span>
      </div>
      <div class="job-company">${escapeHtml(job.company)}${job.location ? " · " + escapeHtml(job.location) : ""}</div>
      ${job.url ? `<a class="job-url" href="${escapeHtml(job.url)}" target="_blank">${truncate(job.url, 45)}</a>` : ""}
    `;
    listEl.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
