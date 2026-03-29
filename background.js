chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_SESSION') {
        chrome.storage.local.set({ supabaseSession: message.session }, () => {
            sendResponse({ success: true })
        })
        return true
    }

    if (message.type === 'GET_SESSION') {
        chrome.storage.local.get(['supabaseSession'], (result) => {
            sendResponse({ session: result.supabaseSession || null })
        })
        return true
    }

    if (message.type === 'CLEAR_SESSION') {
        chrome.storage.local.remove('supabaseSession', () => {
            sendResponse({ success: true })
        })
        return true
    }
})