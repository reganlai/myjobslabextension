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
  const getMeta = (name) => {
    const el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute("content") : null;
  };

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

  // ── Google Jobs ───────────────────────────────────────────────────────────
  const googleTitle = document.querySelector(".hN7mZd") || document.querySelector(".KL4Mdc");
  const googleCompany = document.querySelector(".vNEEBe");
  const googleLocation = document.querySelector(".Qk80nd");

  if (googleTitle) {
    return {
      title: googleTitle.innerText.trim(),
      company: googleCompany ? googleCompany.innerText.trim() : "",
      location: googleLocation ? googleLocation.innerText.trim() : "",
    };
  }

  // ── ZipRecruiter ──────────────────────────────────────────────────────────
  const zipTitle = document.querySelector(".job_title");
  const zipCompany = document.querySelector(".hiring_company_text");
  const zipLocation = document.querySelector(".location");

  if (zipTitle) {
    return {
      title: zipTitle.innerText.trim(),
      company: zipCompany ? zipCompany.innerText.trim() : "",
      location: zipLocation ? zipLocation.innerText.trim() : "",
    };
  }

  // ── Monster ───────────────────────────────────────────────────────────────
  const monsterTitle = document.querySelector(".title") || document.querySelector("[class*='JobViewHeader--title']");
  const monsterCompany = document.querySelector(".company") || document.querySelector("[class*='JobViewHeader--company']");

  if (monsterTitle) {
    return {
      title: monsterTitle.innerText.trim(),
      company: monsterCompany ? monsterCompany.innerText.trim() : "",
      location: "",
    };
  }

  // ── Generic fallback: Use OpenGraph or Page Title ─────────────────────────
  const ogTitle = getMeta("og:title");
  const ogCompany = getMeta("og:site_name");

  return {
    title: ogTitle || document.querySelector("h1")?.innerText.trim() || document.title,
    company: ogCompany || "",
    location: "",
  };
}
