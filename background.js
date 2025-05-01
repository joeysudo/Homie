// Background script for Homie extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Homie extension installed!');
});

// Global state to track our popup window
let popupWindow = null;

// Set up context menu if needed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-property',
    title: 'Analyze this property with Homie',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.realestate.com.au/*']
  });
});

// Helper function to open the extension in a separate window
function openPopupWindow() {
  // Check if window is already open
  if (popupWindow) {
    try {
      // Try to get the window to check if it's still open
      chrome.windows.get(popupWindow.id, function(win) {
        if (chrome.runtime.lastError) {
          // Window doesn't exist anymore, create a new one
          createNewWindow();
        } else {
          // Focus existing window
          chrome.windows.update(popupWindow.id, { focused: true });
        }
      });
    } catch (e) {
      // If there's an error, create a new window
      createNewWindow();
    }
  } else {
    // No window exists, create a new one
    createNewWindow();
  }
}

// Function to create a new window
function createNewWindow() {
  try {
    // Set dimensions for a reasonable size
    const width = 600;
    const height = 800;
    
    // Open a new popup window with our popup.html
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: width,
      height: height,
      focused: true
    }, function(win) {
      if (chrome.runtime.lastError) {
        console.error('Error creating window:', chrome.runtime.lastError);
        return;
      }
      popupWindow = win;
    });
  } catch (e) {
    console.error('Error in createNewWindow:', e);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openInWindow') {
    // Open the popup in a separate window
    openPopupWindow();
    sendResponse({ success: true });
  } else if (message.action === 'closePopup') {
    // If message is from a window we opened, close it
    if (popupWindow && popupWindow.id) {
      try {
        chrome.windows.remove(popupWindow.id, function() {
          if (chrome.runtime.lastError) {
            console.error('Error closing window:', chrome.runtime.lastError);
          }
          popupWindow = null;
        });
      } catch (e) {
        console.error('Error in closePopup:', e);
        popupWindow = null;
      }
    }
    sendResponse({ success: true });
  } else if (message.action === 'getPropertyData') {
    // Return any stored property data
    chrome.storage.session.get('currentPropertyData', (data) => {
      sendResponse({ propertyData: data.currentPropertyData || null });
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
          // Open in a separate window that won't close on outside clicks
          openPopupWindow();
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