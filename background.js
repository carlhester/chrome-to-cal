// Replace 'YOUR_OPENAI_API_KEY' with your actual API key
const OPENAI_API_KEY = 'REPLACEME';

// Function to generate Google Calendar link using OpenAI API
async function generateCalendarLink(eventDescription) {
    console.log("Starting API request to OpenAI with description:", eventDescription);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that generates Google Calendar event links based on event descriptions provided."
                    },
                    {
                        role: "user",
                        content: `Generate a Google Calendar event link for the following event description:\n\n"${eventDescription}"\n\n
                        Attempt to determine the event description and event times based on the input. Assume the given times are in the PST/PDT timezone and that the events will happen in the future.  If no year is specified, used the current year (2024). The link should be in the correct format and valid so that it can open in a new tab and include appropriate start and end times if specified. If times do not have a timezone, you can assume they are in PST, which is the same timezone as the calendar.  If times are not specified, default to a 1-hour event starting at 9 AM on the specified date. You should only return the link itself and not any other accompanying text so that the user can copy and paste it directly without editing. Return the url only, and not any markup or HTML.`
                    }
                ],
                max_tokens: 200,
                temperature: 0
            })
        });

        const data = await response.json();
        console.log("API response data:", data);

        if (response.ok && data.choices && data.choices.length > 0) {
            const calendarLink = data.choices[0].message.content.trim();
            console.log("Generated Calendar Link:", calendarLink);

            const urlMatch = calendarLink.match(/https:\/\/www\.google\.com\/calendar\/event\.*/);
            const urlMatch2 = calendarLink.match(/https:\/\/calendar\.google\.com\/.*/);
            if (urlMatch) {
                const finalUrl = urlMatch[0];
                console.log("Opening new tab with the generated link...");
                chrome.tabs.create({ url: finalUrl });
            } else if (urlMatch2) {
                const finalUrl = urlMatch2[0];
                console.log("Opening new tab with the generated link...");
                chrome.tabs.create({ url: finalUrl });
            } else {
                console.log("No valid URL found in the response. Attempting to extract any link present.");
                // Attempt to extract any URL
                const genericUrlMatch = calendarLink.match(/https?:\/\/\S+/);
                if (genericUrlMatch) {
                    chrome.tabs.create({ url: genericUrlMatch[0] });
                } else {
                    console.error("Failed to extract a valid URL from the response.");
                    alert("Failed to generate a valid Google Calendar link. Please try again.");
                }
            }
        } else {
            console.error('API Error:', data);
            alert("An error occurred while generating the calendar link. Please check the console for details.");
        }
    } catch (error) {
        console.error('Request failed:', error);
        alert("Failed to communicate with the OpenAI API. Please check your network connection and API key.");
    }
}

// Context menu creation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed, creating context menu...");
    chrome.contextMenus.create({
        id: "createEvent",
        title: "!!Create Calendar Event",
        contexts: ["selection"]
    });
    console.log("Context menu created.");
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "createEvent") {
        const selectedText = info.selectionText.trim();
        console.log("Context menu clicked with selected text:", selectedText);

        if (selectedText) {
            generateCalendarLink(selectedText);
        } else {
            alert("Please select some text to create a calendar event.");
        }
    }
});

// Toolbar icon click handler
chrome.action.onClicked.addListener((tab) => {
    console.log("Toolbar icon clicked.");

    // Execute script to get selected text from the active tab
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            func: () => window.getSelection().toString()
        },
        (results) => {
            const selectedText = results && results[0] && results[0].result.trim();
            console.log("Selected text from active tab:", selectedText);

            if (selectedText) {
                generateCalendarLink(selectedText);
            } else {
                // Prompt user for input if no text is selected
                const eventDescription = prompt("Enter event description for Google Calendar:");
                if (eventDescription && eventDescription.trim()) {
                    generateCalendarLink(eventDescription.trim());
                } else {
                    console.log("No event description provided by the user.");
                }
            }
        }
    );
});
