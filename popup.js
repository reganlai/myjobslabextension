const SUPABASE_URL = 'https://hrmsypgqtkgnkhodhqbb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybXN5cGdxdGtnbmtob2RocWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDYyNDIsImV4cCI6MjA4OTgyMjI0Mn0.gk0cYdMhNGtG_S5iJ40kMVucmbegQLGGC847ZA5RCLw'

const loginPrompt = document.getElementById('login-prompt')
const notJobPage = document.getElementById('not-job-page')
const jobInfo = document.getElementById('job-info')
const jobTitle = document.getElementById('job-title')
const jobCompany = document.getElementById('job-company')
const jobUrl = document.getElementById('job-url')
const statusSelect = document.getElementById('status-select')
const saveBtn = document.getElementById('save-btn')
const successMsg = document.getElementById('success-msg')
const errorMsg = document.getElementById('error-msg')
const userEmail = document.getElementById('user-email')
const logoutBtn = document.getElementById('logout-btn')

const SUPPORTED_SITES = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'joinhandshake.com']

let currentSession = null
let currentJob = null

async function saveJobToSupabase(job, session) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: session.user.id,
      title: job.title,
      company: job.company,
      url: job.url,
      status: job.status
    })
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Failed to save job')
  }
  return response.json()
}

async function init() {
  // Get session from background
  const { session } = await chrome.runtime.sendMessage({ type: 'GET_SESSION' })

  if (!session) {
    loginPrompt.style.display = 'block'
    return
  }

  currentSession = session
  userEmail.textContent = session.user.email

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const isSupported = SUPPORTED_SITES.some(site => tab.url?.includes(site))

  if (!isSupported) {
    jobInfo.style.display = 'block'
    notJobPage.style.display = 'block'
    jobInfo.style.display = 'none'
    notJobPage.style.display = 'block'
    return
  }

  // Scrape the page
  let jobData = null
  try {
    jobData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_INFO' })
  } catch (e) {
    notJobPage.style.display = 'block'
    return
  }

  if (!jobData?.title) {
    notJobPage.style.display = 'block'
    return
  }

  currentJob = jobData
  jobTitle.textContent = jobData.title || '—'
  jobCompany.textContent = jobData.company || '—'
  jobUrl.textContent = jobData.url || '—'
  jobInfo.style.display = 'block'
}

saveBtn.addEventListener('click', async () => {
  if (!currentJob || !currentSession) return

  saveBtn.disabled = true
  saveBtn.textContent = 'Saving…'
  errorMsg.style.display = 'none'

  try {
    await saveJobToSupabase({
      ...currentJob,
      status: statusSelect.value
    }, currentSession)

    saveBtn.style.display = 'none'
    successMsg.style.display = 'block'
  } catch (err) {
    errorMsg.textContent = err.message || 'Something went wrong. Try again.'
    errorMsg.style.display = 'block'
    saveBtn.disabled = false
    saveBtn.textContent = 'Save to Dashboard'
  }
})

logoutBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' })
  loginPrompt.style.display = 'block'
  jobInfo.style.display = 'none'
  userEmail.textContent = ''
})

init()