function scrapeJob() {
  const host = window.location.hostname

  let title = ''
  let company = ''
  const url = window.location.href

  if (host.includes('linkedin.com')) {
    title = document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.innerText?.trim()
      || document.querySelector('h1.t-24')?.innerText?.trim()
      || ''
    company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText?.trim()
      || document.querySelector('.ember-view.t-black.t-normal')?.innerText?.trim()
      || ''
  }

  else if (host.includes('indeed.com')) {
    title = document.querySelector('h1.jobsearch-JobInfoHeader-title')?.innerText?.trim()
      || document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.innerText?.trim()
      || ''
    company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.innerText?.trim()
      || document.querySelector('.jobsearch-CompanyInfoContainer')?.innerText?.trim()
      || ''
  }

  else if (host.includes('glassdoor.com')) {
    title = document.querySelector('[data-test="job-title"]')?.innerText?.trim()
      || document.querySelector('h1.heading_Heading__BqX5J')?.innerText?.trim()
      || ''
    company = document.querySelector('[data-test="employer-name"]')?.innerText?.trim()
      || document.querySelector('.EmployerProfile_employerName__Xemli')?.innerText?.trim()
      || ''
  }

  else if (host.includes('joinhandshake.com')) {
    title = document.querySelector('h1[class*="style__title"]')?.innerText?.trim()
      || document.querySelector('h1')?.innerText?.trim()
      || ''
    company = document.querySelector('[class*="style__employer"]')?.innerText?.trim()
      || document.querySelector('[data-hook="employer-name"]')?.innerText?.trim()
      || ''
  }

  return { title, company, url }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_JOB_INFO') {
    sendResponse(scrapeJob())
  }
  return true
})