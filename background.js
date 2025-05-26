// Background script for Homira extension

// Listen for install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('Homira extension installed!');
  
  // Create context menu item
  chrome.contextMenus.create({
    id: 'analyzeProperty',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.realestate.com.au/property-*'],
    title: 'Analyze this property with Homira',
  });
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
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getPropertyData') {
    // Get temp property data
    chrome.storage.local.get(['tempPropertyData'], function(result) {
      // Clear temp property data after sending it
      chrome.storage.local.remove(['tempPropertyData']);
      
      // Send response with property data
      sendResponse({ propertyData: result.tempPropertyData || null });
    });
    
    // Return true to indicate async response
    return true;
  } else if (request.action === 'openInWindow') {
    // Open extension in separate window
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 500,
      height: 700
    }, function(window) {
      // Store window id for later reference
      chrome.storage.local.set({ popupWindowId: window.id });
      sendResponse({ success: true });
    });
    
    // Return true to indicate async response
    return true;
  } else if (request.action === 'closePopup') {
    // Get window id
    chrome.storage.local.get(['popupWindowId'], function(result) {
      if (result.popupWindowId) {
        // Close the window
        chrome.windows.remove(result.popupWindowId);
      }
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-property') {
    // First check if we have cached analysis for this URL
    const propertyUrl = tab.url;
    
    chrome.storage.local.get(['cachedPropertyAnalyses'], function(result) {
      const cachedPropertyAnalyses = result.cachedPropertyAnalyses || {};
      
      if (cachedPropertyAnalyses[propertyUrl]) {
        console.log("Using cached property analysis from context menu");
        
        // Use the cached data
        chrome.storage.session.set({ 
          'currentPropertyData': cachedPropertyAnalyses[propertyUrl].propertyData 
        }, () => {
          // Open in a separate window that won't close on outside clicks
          openPopupWindow();
        });
      } else {
        // No cached data, extract from page
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