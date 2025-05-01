// Background script for Homie extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Homie extension installed!');
});

// Set up context menu if needed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-property',
    title: 'Analyze this property with Homie',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.realestate.com.au/*']
  });
});

// Flag to track if we should prevent popup closing
let keepPopupOpen = false;

// Helper function to open the extension in side panel
function openInSidePanel(tabId) {
  // Check if side panel is available (Chrome 114+)
  if (chrome.sidePanel) {
    // Open the side panel
    chrome.sidePanel.open({ tabId }).catch(error => {
      console.error('Error opening side panel:', error);
      // Fallback to popup if side panel fails
      chrome.action.openPopup();
    });
    return true;
  }
  return false;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'keepPopupOpen') {
    keepPopupOpen = true;
    // If this was triggered from a popup, try to reopen in side panel
    if (sender.url.includes('popup.html') && sender.tab === undefined) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          // Try to open in side panel instead
          const opened = openInSidePanel(tabs[0].id);
          sendResponse({ success: opened });
          
          // If we opened in side panel, close the popup
          if (opened) {
            // We'll close indirectly by not keeping it open
            keepPopupOpen = false;
          }
        }
      });
      return true; // Keep channel open for async response
    }
    sendResponse({ success: true });
  } else if (message.action === 'closePopup') {
    keepPopupOpen = false;
    sendResponse({ success: true });
  } else if (message.action === 'openSidePanel') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        const opened = openInSidePanel(tabs[0].id);
        sendResponse({ success: opened });
      } else {
        sendResponse({ success: false });
      }
    });
    return true; // Keep channel open for async response
  }
  return true; // Keep the message channel open for async response
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-property') {
    chrome.tabs.sendMessage(tab.id, { action: 'extractPropertyData' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      
      if (response && response.propertyData) {
        // Store the data temporarily
        chrome.storage.session.set({ 'currentPropertyData': response.propertyData }, () => {
          // Try to open in side panel first for persistence
          const sidePanelOpened = openInSidePanel(tab.id);
          
          // Fall back to popup if side panel not available
          if (!sidePanelOpened) {
            chrome.action.openPopup();
          }
        });
      }
    });
  }
});

// Comment out the icon changing functionality to fix the loading issue
/*
// Listen for URL changes to show icon in color when on realestate.com.au
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('realestate.com.au')) {
    // Indicate that the extension is active on this site
    chrome.action.setIcon({
      path: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      },
      tabId: tabId
    });
  } else if (changeInfo.status === 'complete') {
    // Use greyscale icon for other sites
    chrome.action.setIcon({
      path: {
        "16": "icons/icon16_grey.png",
        "48": "icons/icon48_grey.png",
        "128": "icons/icon128_grey.png"
      },
      tabId: tabId
    });
  }
});
*/ 