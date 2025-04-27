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
          // Open the popup
          chrome.action.openPopup();
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