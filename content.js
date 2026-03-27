// content.js — Job Scraper
// Runs on every page. Listens for a message from popup.js requesting job info,
// then scrapes the DOM and returns title, company, and location.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_INFO") {
    const info = scrapeJobInfo();
    sendResponse(info);
  }
  // Return true to keep the message channel open for async sendResponse
  return true;
});

function scrapeJobInfo() {
  // ── LinkedIn ──────────────────────────────────────────────────────────────
  const linkedinTitle =
    document.querySelector(".job-details-jobs-unified-top-card__job-title h1") ||
    document.querySelector(".jobs-unified-top-card__job-title h1") ||
    document.querySelector("h1.t-24");

  const linkedinCompany =
    document.querySelector(".job-details-jobs-unified-top-card__company-name a") ||
    document.querySelector(".jobs-unified-top-card__company-name a");

  const linkedinLocation =
    document.querySelector(".job-details-jobs-unified-top-card__bullet") ||
    document.querySelector(".jobs-unified-top-card__bullet");

  if (linkedinTitle) {
    return {
      title: linkedinTitle.innerText.trim(),
      company: linkedinCompany ? linkedinCompany.innerText.trim() : "",
      location: linkedinLocation ? linkedinLocation.innerText.trim() : "",
    };
  }

  // ── Indeed ────────────────────────────────────────────────────────────────
  const indeedTitle =
    document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
    document.querySelector(".jobsearch-JobInfoHeader-title");

  const indeedCompany =
    document.querySelector('[data-testid="inlineHeader-companyName"]') ||
    document.querySelector(".jobsearch-InlineCompanyRating-companyHeader");

  const indeedLocation =
    document.querySelector('[data-testid="job-location"]') ||
    document.querySelector(".jobsearch-JobInfoHeader-subtitle div:last-child");

  if (indeedTitle) {
    return {
      title: indeedTitle.innerText.trim(),
      company: indeedCompany ? indeedCompany.innerText.trim() : "",
      location: indeedLocation ? indeedLocation.innerText.trim() : "",
    };
  }

  // ── Glassdoor ─────────────────────────────────────────────────────────────
  const glassdoorTitle = document.querySelector('[data-test="job-title"]');
  const glassdoorCompany = document.querySelector('[data-test="employer-name"]');
  const glassdoorLocation = document.querySelector('[data-test="location"]');

  if (glassdoorTitle) {
    return {
      title: glassdoorTitle.innerText.trim(),
      company: glassdoorCompany ? glassdoorCompany.innerText.trim() : "",
      location: glassdoorLocation ? glassdoorLocation.innerText.trim() : "",
    };
  }

  // ── Handshake ─────────────────────────────────────────────────────────────
  // app.joinhandshake.com/jobs/:id  and  app.joinhandshake.com/postings/:id
  const handshakeTitle =
    document.querySelector('[data-hook="posting-name"]') ||
    document.querySelector("h1.posting-detail-header--title") ||
    document.querySelector("h1.style__title");

  const handshakeCompany =
    document.querySelector('[data-hook="employer-profile-link"]') ||
    document.querySelector("a.posting-detail-header--employer-name") ||
    document.querySelector("a.style__employer-name");

  const handshakeLocation =
    document.querySelector('[data-hook="posting-location"]') ||
    document.querySelector(".posting-detail-header--location") ||
    document.querySelector(".style__location");

  if (handshakeTitle) {
    return {
      title:    handshakeTitle.innerText.trim(),
      company:  handshakeCompany  ? handshakeCompany.innerText.trim()  : "",
      location: handshakeLocation ? handshakeLocation.innerText.trim() : "",
    };
  }

  // ── Generic fallback: grab the page <h1> ─────────────────────────────────
  const h1 = document.querySelector("h1");
  return {
    title: h1 ? h1.innerText.trim() : document.title,
    company: "",
    location: "",
  };
}
