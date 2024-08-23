// This function will be called when text is selected and processed by the background script
function parseEvent(selectedText) {
    // The selected text is already passed from the background script.
    // If you need to further process the text, you can do so here.
    // For now, this function doesn't need to do anything.
}

// Listening for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "parseEvent") {
        parseEvent(request.selectedText);
        sendResponse({ status: "Text processed" });
    }
});
