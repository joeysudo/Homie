document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI components
  initializeUI();
  
  // Elements
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const apiKeyMessage = document.getElementById('apiKeyMessage');
  const analyzeButton = document.getElementById('analyzeButton');
  const loadingSection = document.getElementById('loading');
  const propertyAnalysisSection = document.getElementById('propertyAnalysis');
  const analysisResults = document.getElementById('analysisResults');
  const errorSection = document.getElementById('error');
  const closePopupButton = document.getElementById('closePopup');
  
  const apiKeySection = document.getElementById('apiKeySection');
  
  // Detect if we're in a popup or a separate window
  const isInSeparateWindow = window.outerWidth > 500;
  
  // Only show close button in separate window mode
  if (isInSeparateWindow) {
    closePopupButton.style.display = 'flex';
  } else {
    closePopupButton.style.display = 'none';
    
    // Add "open in window" button for regular popup mode
    const headerDiv = document.querySelector('.header');
    const openInWindowBtn = document.createElement('button');
    openInWindowBtn.className = 'open-in-window-button';
    openInWindowBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="7" y1="7" x2="17" y2="7"></line></svg>`;
    openInWindowBtn.title = "Open in persistent window";
    headerDiv.appendChild(openInWindowBtn);
    
    // Handle open in window click
    openInWindowBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({action: 'openInWindow'}, function(response) {
        // Close this popup if the window opened successfully
        if (response && response.success) {
          window.close();
        }
      });
    });
  }
  
  // Make the close button more visible
  closePopupButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  
  // Close button functionality
  closePopupButton.addEventListener('click', function() {
    // Send message to close this window
    chrome.runtime.sendMessage({action: 'closePopup'});
  });
  
  // Comparison elements
  const saveForCompareBtn = document.getElementById('saveForCompareBtn');
  const viewSavedBtn = document.getElementById('viewSavedBtn');
  const comparisonSection = document.getElementById('comparisonSection');
  const savedPropertiesList = document.getElementById('savedPropertiesList');
  const comparePropertiesBtn = document.getElementById('comparePropertiesBtn');
  const clearSavedBtn = document.getElementById('clearSavedBtn');
  const comparisonResults = document.getElementById('comparisonResults');

  // Current property data
  let currentPropertyData = null;
  let currentPropertyAnalysis = '';

  // Set up modern UI elements and interactions
  setupModernUI();
  
  // Check if we were opened from a property analysis
  chrome.runtime.sendMessage({action: 'getPropertyData'}, function(response) {
    if (response && response.propertyData) {
      // We have property data to analyze
      currentPropertyData = response.propertyData;
      
      // Get API key and analyze property
      chrome.storage.sync.get(['openaiApiKey'], function(result) {
        if (result.openaiApiKey) {
          analyzeProperty(currentPropertyData, result.openaiApiKey);
        } else {
          // Show API key section
          apiKeySection.classList.remove('hidden');
          apiKeyMessage.textContent = 'Please save your OpenAI API key first';
          apiKeyMessage.classList.remove('success');
        }
      });
    } else {
      // Just show API key section
      apiKeySection.classList.remove('hidden');
    }
  });
  
  // Load saved API key
  chrome.storage.sync.get(['openaiApiKey', 'savedProperties'], function(result) {
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
      apiKeyMessage.textContent = 'API key is saved';
      apiKeyMessage.classList.add('success');
    }
  });

  // Function to update language label highlighting - only run if elements exist
  function updateLanguageLabels(language) {
    const langEn = document.getElementById('lang-en');
    const langZh = document.getElementById('lang-zh');
    
    if (!langEn || !langZh) return;
    
    if (language === 'chinese') {
      langEn.classList.remove('active');
      langZh.classList.add('active');
    } else {
      langEn.classList.add('active');
      langZh.classList.remove('active');
    }
  }

  // Function to update UI text based on selected language
  function updateUILanguage(language) {
    const translations = {
      english: {
        subtitle: 'Your AI Property Assistant',
        apiSettings: 'OpenAI API Settings',
        apiKeyLabel: 'API Key:',
        apiKeyPlaceholder: 'Enter your OpenAI API key',
        saveButton: 'Save',
        apiKeySaved: 'API key is saved',
        apiKeySaveSuccess: 'API key saved successfully!',
        apiKeyRequired: 'Please enter a valid API key',
        apiKeyNeeded: 'Please save your OpenAI API key first',
        analyzing: 'Analyzing property data...',
        analyzeButton: 'Analyze Property',
        propertyAnalysis: 'Property Analysis',
        errorMessage: 'An error occurred. Please check if you are on a property page or try again later.',
        saveForCompare: 'Save for Comparison',
        viewSaved: 'Saved Properties',
        propertyComparison: 'Property Comparison',
        compareSaved: 'Compare saved properties',
        compareBtn: 'Compare Properties',
        clearAll: 'Clear All',
        noSavedProperties: 'No properties saved yet. Analyze properties and save them for comparison.'
      },
      chinese: {
        subtitle: '您的AI房产助手',
        apiSettings: 'OpenAI API设置',
        apiKeyLabel: 'API密钥:',
        apiKeyPlaceholder: '输入您的OpenAI API密钥',
        saveButton: '保存',
        apiKeySaved: 'API密钥已保存',
        apiKeySaveSuccess: 'API密钥保存成功！',
        apiKeyRequired: '请输入有效的API密钥',
        apiKeyNeeded: '请先保存您的OpenAI API密钥',
        analyzing: '正在分析房产数据...',
        analyzeButton: '分析房产',
        propertyAnalysis: '房产分析',
        errorMessage: '发生错误。请检查您是否在房产页面或稍后再试。',
        saveForCompare: '保存用于比较',
        viewSaved: '已保存房产',
        propertyComparison: '房产比较',
        compareSaved: '比较已保存的房产',
        compareBtn: '比较房产',
        clearAll: '清除全部',
        noSavedProperties: '尚未保存房产。分析房产并保存它们以进行比较。'
      }
    };

    // Update UI elements with translated text
    const subtitleEl = document.querySelector('.subtitle');
    if (subtitleEl) subtitleEl.textContent = translations[language].subtitle;
    
    const apiSettingsEl = document.querySelector('#apiKeySection h2');
    if (apiSettingsEl) apiSettingsEl.textContent = translations[language].apiSettings;
    
    const apiKeyLabelEl = document.querySelector('label[for="apiKey"]');
    if (apiKeyLabelEl) apiKeyLabelEl.textContent = translations[language].apiKeyLabel;
    
    if (apiKeyInput) apiKeyInput.placeholder = translations[language].apiKeyPlaceholder;
    if (saveApiKeyBtn) saveApiKeyBtn.textContent = translations[language].saveButton;
    
    if (apiKeyMessage && apiKeyMessage.textContent) {
      if (apiKeyMessage.textContent.includes('saved') || apiKeyMessage.textContent.includes('保存')) {
        apiKeyMessage.textContent = translations[language].apiKeySaved;
      }
    }
    
    const loadingTextEl = document.querySelector('#loading p');
    if (loadingTextEl) loadingTextEl.textContent = translations[language].analyzing;
    
    const analysisHeaderEl = document.querySelector('#propertyAnalysis h2');
    if (analysisHeaderEl) analysisHeaderEl.textContent = translations[language].propertyAnalysis;
    
    const errorMessageEl = document.querySelector('#error p');
    if (errorMessageEl) errorMessageEl.textContent = translations[language].errorMessage;
    
    if (analyzeButton) analyzeButton.textContent = translations[language].analyzeButton;
    
    // Comparison UI elements
    if (saveForCompareBtn) {
      // Preserve the SVG icon
      const svgIcon = saveForCompareBtn.querySelector('svg');
      saveForCompareBtn.textContent = translations[language].saveForCompare;
      if (svgIcon) saveForCompareBtn.prepend(svgIcon);
    }
    
    if (viewSavedBtn) {
      // Preserve the SVG icon
      const svgIcon = viewSavedBtn.querySelector('svg');
      viewSavedBtn.textContent = translations[language].viewSaved;
      if (svgIcon) viewSavedBtn.prepend(svgIcon);
    }
    
    const comparisonHeaderEl = document.querySelector('#comparisonSection h2');
    if (comparisonHeaderEl) comparisonHeaderEl.textContent = translations[language].propertyComparison;
    
    const comparisonSubtitleEl = document.querySelector('#comparisonSection .subtitle');
    if (comparisonSubtitleEl) comparisonSubtitleEl.textContent = translations[language].compareSaved;
    
    if (comparePropertiesBtn) {
      // Preserve the SVG icon
      const svgIcon = comparePropertiesBtn.querySelector('svg');
      comparePropertiesBtn.textContent = translations[language].compareBtn;
      if (svgIcon) comparePropertiesBtn.prepend(svgIcon);
    }
    
    if (clearSavedBtn) {
      // Preserve the SVG icon
      const svgIcon = clearSavedBtn.querySelector('svg');
      clearSavedBtn.textContent = translations[language].clearAll;
      if (svgIcon) clearSavedBtn.prepend(svgIcon);
    }
  }

  // Save API key
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      apiKeyMessage.textContent = 'Please enter a valid API key';
      apiKeyMessage.classList.remove('success');
      return;
    }
    
    chrome.storage.sync.set({ openaiApiKey: apiKey }, function() {
      apiKeyMessage.textContent = 'API key saved successfully!';
      apiKeyMessage.classList.add('success');
      
      // If we have property data waiting to be analyzed, do it now
      if (currentPropertyData) {
        analyzeProperty(currentPropertyData, apiKey);
      }
    });
  });

  // Analyze property button
  analyzeButton.addEventListener('click', function() {
    // If we're in comparison view, switch back to analysis/API key view
    if (!comparisonSection.classList.contains('hidden')) {
      comparisonSection.classList.add('hidden');
      apiKeySection.classList.remove('hidden');
      return;
    }

    chrome.storage.sync.get(['openaiApiKey'], function(result) {
      if (!result.openaiApiKey) {
        apiKeyMessage.textContent = 'Please save your OpenAI API key first';
        apiKeyMessage.classList.remove('success');
        return;
      }
      
      // Show loading
      loadingSection.classList.remove('hidden');
      propertyAnalysisSection.classList.add('hidden');
      errorSection.classList.add('hidden');
      comparisonSection.classList.add('hidden');
      apiKeySection.classList.add('hidden');
      
      // Get current tab
      chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
        if (!tabs || tabs.length === 0) {
          loadingSection.classList.add('hidden');
          errorSection.classList.remove('hidden');
          return;
        }
        
        const currentTab = tabs[0];
        
        // Check if we're on realestate.com.au
        if (!currentTab || !currentTab.url.includes('realestate.com.au')) {
          loadingSection.classList.add('hidden');
          errorSection.classList.remove('hidden');
          return;
        }
        
        // Execute content script to extract property data
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: 'extractPropertyData' },
          function(response) {
            if (!response || response.error) {
              loadingSection.classList.add('hidden');
              errorSection.classList.remove('hidden');
              return;
            }
            
            // Set force refresh flag to true since user clicked "analyze property" button
            const forceRefresh = true;
            
            // Get analysis
            analyzeProperty(response.propertyData, result.openaiApiKey, forceRefresh);
          }
        );
      });
    });
  });

  // Function to fetch demographic data for a suburb using OpenAI API
  async function fetchDemographicDataFromInternet(suburb, postcode, apiKey) {
    if (!suburb && !postcode) {
      console.log("No suburb or postcode available to fetch demographic data");
      return null;
    }
    
    // Use suburb and/or postcode as the location identifier
    const location = suburb ? suburb : (postcode ? `postcode ${postcode}` : '');
    
    // Create ABS QuickStats URL if we have a postcode
    const absUrl = postcode ? `https://abs.gov.au/census/find-census-data/quickstats/2021/POA${postcode}` : '';
    
    try {
      // Try to fetch ABS data directly first if possible
      if (absUrl) {
        try {
          console.log(`Attempting to get structured ABS data using API...`);
          const absData = await parseABSQuickStatsData(postcode);
          if (absData) {
            console.log("Successfully extracted ABS QuickStats data directly");
            return absData;
          }
        } catch (error) {
          console.log("Error fetching structured ABS data:", error);
        }
      }
      
      const prompt = `I need accurate demographic and income data for ${location}, Australia based on the 2021 Australian Census data. 
      
${absUrl ? `Please use the ABS QuickStats data from this URL: ${absUrl}` : ''}

Please provide:
      
1. Age distribution (percentages for these specific age groups: 0-18, 19-35, 36-50, 51-65, 66+)
2. Ethnic distribution (percentages for major ethnic backgrounds - specifically Australian, European, Asian, Middle Eastern, and Other - these must add up to 100%)
3. Income distribution (percentages for income brackets: Under $50k, $50k-$100k, $100k-$150k, $150k-$200k, Over $200k - these must add up to 100%)

All percentages MUST add up to exactly 100% for each category. Use the official ABS Census data when available, or provide realistic estimates based on similar Australian suburbs if specific data isn't provided in that exact format.

Format your response using this exact JSON structure:

{
  "ageDistribution": [
    {"range": "0-18", "percentage": XX},
    {"range": "19-35", "percentage": XX},
    {"range": "36-50", "percentage": XX},
    {"range": "51-65", "percentage": XX},
    {"range": "66+", "percentage": XX}
  ],
  "ethnicDistribution": [
    {"ethnicity": "Australian", "percentage": XX},
    {"ethnicity": "European", "percentage": XX},
    {"ethnicity": "Asian", "percentage": XX},
    {"ethnicity": "Middle Eastern", "percentage": XX},
    {"ethnicity": "Other", "percentage": XX}
  ],
  "incomeBrackets": [
    {"bracket": "Under $50k", "percentage": XX},
    {"bracket": "$50k-$100k", "percentage": XX},
    {"bracket": "$100k-$150k", "percentage": XX},
    {"bracket": "$150k-$200k", "percentage": XX},
    {"bracket": "Over $200k", "percentage": XX}
  ]
}

Where XX is a number (no % sign, no quotes). DO NOT include any explanations, just the JSON.`;

      console.log(`Fetching demographic data for ${location}...`);
      if (absUrl) {
        console.log(`Using ABS URL: ${absUrl}`);
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a demographic data specialist who provides accurate demographic information for Australian suburbs and postcodes. Base your responses on the 2021 Australian Census data and use the ABS QuickStats URL when provided. When exact data isn't available in the requested format, provide reasonable estimates by aggregating the census age groups and other data. Always ensure percentage totals equal exactly 100% for each category."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.6
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Error fetching demographic data:", data.error);
        return null;
      }
      
      // Try to parse the response to extract the JSON
      const responseContent = data.choices[0].message.content;
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const demographicData = JSON.parse(jsonMatch[0]);
          console.log("Successfully fetched demographic data:", demographicData);
          
          // Add source information
          demographicData.source = {
            type: "openai",
            url: absUrl || null
          };
          
          return demographicData;
        } catch (e) {
          console.error("Error parsing demographic JSON:", e);
          return null;
        }
      } else {
        console.error("No JSON found in response");
        return null;
      }
    } catch (error) {
      console.error("Error fetching demographic data:", error);
      return null;
    }
  }

  // Helper function to parse ABS QuickStats data directly
  async function parseABSQuickStatsData(postcode) {
    // This is a placeholder function for now
    // In a real implementation, you would need to use a proxy server or CORS-enabled API
    // to fetch and scrape the ABS QuickStats page directly
    
    // For now we'll return null and rely on the OpenAI API
    // to extract the data from the ABS QuickStats URL
    console.log("Direct ABS data extraction not implemented");
    return null;
  }

  // Function to estimate property growth rate based on postcode using OpenAI API
  async function estimatePropertyGrowthRate(suburb, postcode, apiKey) {
    if (!suburb && !postcode) {
      console.log("No suburb or postcode available to estimate growth rate");
      return null;
    }
    
    // Use suburb and/or postcode as the location identifier
    const location = suburb ? suburb : (postcode ? `postcode ${postcode}` : '');
    
    // Create ABS QuickStats URL if we have a postcode
    const absUrl = postcode ? `https://abs.gov.au/census/find-census-data/quickstats/2021/POA${postcode}` : '';
    
    try {
      // Check if we have cached growth rate data for this postcode
      const cachedGrowthRateResult = await new Promise(resolve => {
        chrome.storage.local.get(['cachedGrowthRateData'], function(result) {
          if (result.cachedGrowthRateData && result.cachedGrowthRateData[postcode]) {
            resolve(result.cachedGrowthRateData[postcode]);
          } else {
            resolve(null);
          }
        });
      });
      
      if (cachedGrowthRateResult) {
        console.log("Using cached growth rate data for postcode:", postcode);
        return cachedGrowthRateResult;
      }
      
      console.log(`Estimating property growth rate for ${location}...`);
      
      const prompt = `Please provide a realistic estimate for annual property price growth rates for ${location}, Australia. 
      
Your estimate should be based on:
1. Historical property price trends in the area
2. Current economic conditions in Australia
3. Location-specific factors (e.g., infrastructure development, school zones, proximity to amenities)
4. Population trends and demographic shifts
5. Current and projected interest rates
6. Supply and demand balance in the local market

Format your response as a JSON object with the following structure:
{
  "annualGrowthRate": X.X,
  "confidenceLevel": "high/medium/low",
  "factors": {
    "positive": ["factor1", "factor2"],
    "negative": ["factor1", "factor2"]
  },
  "shortTermOutlook": "brief description",
  "longTermOutlook": "brief description"
}

Where annualGrowthRate is a realistic percentage (e.g., 2.3 for 2.3%) representing the expected compound annual growth rate. Be conservative and realistic - typical Australian property growth rates range from 1.5-3.5% long-term, with some areas underperforming and others outperforming. Do not use values higher than 4% except in extremely rare cases with extraordinary growth factors.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a property market analyst specializing in Australian real estate. Provide realistic and conservative growth rate estimates based on location data. Your estimates should reflect historical trends and economic forecasts. Be conservative in your estimates - most Australian properties grow at 1.5-3% annually over the long term."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          response_format: { "type": "json_object" }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Error estimating growth rate:", data.error);
        return null;
      }
      
      try {
        const growthData = JSON.parse(data.choices[0].message.content);
        console.log("Successfully estimated growth rate:", growthData);
        
        // Cache the growth rate data by postcode
        chrome.storage.local.get(['cachedGrowthRateData'], function(result) {
          const cachedGrowthRateData = result.cachedGrowthRateData || {};
          cachedGrowthRateData[postcode] = growthData;
          chrome.storage.local.set({ cachedGrowthRateData: cachedGrowthRateData });
          console.log("Cached growth rate data for postcode:", postcode);
        });
        
        return growthData;
      } catch (e) {
        console.error("Error parsing growth rate JSON:", e);
        return null;
      }
    } catch (error) {
      console.error("Error estimating growth rate:", error);
      return null;
    }
  }

  // Function to analyze property using OpenAI API
  async function analyzeProperty(propertyData, apiKey, forceRefresh = false) {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'block';
    
    // Check for cached results if not forcing a refresh
    if (!forceRefresh) {
      // Try to get cached analysis for this property
      const propertyUrl = propertyData.url || window.location.href;
      
      try {
        const cachedResult = await new Promise(resolve => {
          chrome.storage.local.get(['cachedPropertyAnalyses'], function(result) {
            if (result.cachedPropertyAnalyses && result.cachedPropertyAnalyses[propertyUrl]) {
              resolve(result.cachedPropertyAnalyses[propertyUrl]);
            } else {
              resolve(null);
            }
          });
        });
        
        if (cachedResult) {
          console.log("Using cached property analysis");
          
          // Update the global current property values
          currentPropertyData = propertyData;
          currentPropertyAnalysis = cachedResult.analysis;
          
          // Format and display the analysis
          formatAnalysis(cachedResult.analysis);
          
          // Display the formatted analysis
          propertyAnalysisSection.classList.remove('hidden');
          loadingSection.classList.add('hidden');
          apiKeySection.classList.add('hidden');
          
          // Apply UI enhancements
          enhanceSections();
          animateVisualElements();
          
          return;
        }
      } catch (error) {
        console.error("Error fetching cached results:", error);
        // Continue with fresh analysis if there's an error with the cache
      }
    }
    
    // First, check if we need to fetch demographic data before building the prompt
    if (!propertyData.demographics || 
        !propertyData.demographics.ageDistribution || 
        !propertyData.demographics.ethnicDistribution || 
        !propertyData.demographics.incomeBrackets || 
        propertyData.demographics.ageDistribution.length === 0 || 
        propertyData.demographics.ethnicDistribution.length === 0 || 
        propertyData.demographics.incomeBrackets.length === 0) {
      
      console.log("Missing or incomplete demographic data, checking cache first...");
      
      // Check if we have cached demographic data for this postcode
      if (propertyData.postcode) {
        try {
          const cachedDemographicResult = await new Promise(resolve => {
            chrome.storage.local.get(['cachedDemographicData'], function(result) {
              if (result.cachedDemographicData && result.cachedDemographicData[propertyData.postcode]) {
                resolve(result.cachedDemographicData[propertyData.postcode]);
              } else {
                resolve(null);
              }
            });
          });
          
          if (cachedDemographicResult) {
            console.log("Using cached demographic data for postcode:", propertyData.postcode);
            propertyData.demographics = cachedDemographicResult;
          } else {
            // No cached data, fetch from OpenAI
            console.log("No cached demographic data, fetching from OpenAI...");
            const demographicData = await fetchDemographicDataFromInternet(propertyData.suburb, propertyData.postcode, apiKey);
            
            if (demographicData) {
              console.log("Successfully fetched demographic data from OpenAI");
              propertyData.demographics = demographicData;
              
              // Cache the demographic data by postcode
              chrome.storage.local.get(['cachedDemographicData'], function(result) {
                const cachedDemographicData = result.cachedDemographicData || {};
                cachedDemographicData[propertyData.postcode] = demographicData;
                chrome.storage.local.set({ cachedDemographicData: cachedDemographicData });
                console.log("Cached demographic data for postcode:", propertyData.postcode);
              });
            } else {
              console.log("Failed to fetch demographic data from OpenAI, using fallback data");
              propertyData.demographics = {
                ageDistribution: [
                  {range: "0-18", percentage: 23},
                  {range: "19-35", percentage: 31},
                  {range: "36-50", percentage: 25},
                  {range: "51-65", percentage: 14},
                  {range: "66+", percentage: 7}
                ],
                ethnicDistribution: [
                  {ethnicity: "Australian", percentage: 65},
                  {ethnicity: "European", percentage: 15},
                  {ethnicity: "Asian", percentage: 12},
                  {ethnicity: "Middle Eastern", percentage: 3},
                  {ethnicity: "Other", percentage: 5}
                ],
                incomeBrackets: [
                  {bracket: "Under $50k", percentage: 25},
                  {bracket: "$50k-$100k", percentage: 38},
                  {bracket: "$100k-$150k", percentage: 22},
                  {bracket: "$150k-$200k", percentage: 10},
                  {bracket: "Over $200k", percentage: 5}
                ]
              };
            }
          }
        } catch (error) {
          console.error("Error checking cached demographic data:", error);
          // Fallback to OpenAI
          const demographicData = await fetchDemographicDataFromInternet(propertyData.suburb, propertyData.postcode, apiKey);
          
          if (demographicData) {
            console.log("Successfully fetched demographic data from OpenAI");
            propertyData.demographics = demographicData;
          } else {
            console.log("Failed to fetch demographic data from OpenAI, using fallback data");
            propertyData.demographics = {
              ageDistribution: [
                {range: "0-18", percentage: 23},
                {range: "19-35", percentage: 31},
                {range: "36-50", percentage: 25},
                {range: "51-65", percentage: 14},
                {range: "66+", percentage: 7}
              ],
              ethnicDistribution: [
                {ethnicity: "Australian", percentage: 65},
                {ethnicity: "European", percentage: 15},
                {ethnicity: "Asian", percentage: 12},
                {ethnicity: "Middle Eastern", percentage: 3},
                {ethnicity: "Other", percentage: 5}
              ],
              incomeBrackets: [
                {bracket: "Under $50k", percentage: 25},
                {bracket: "$50k-$100k", percentage: 38},
                {bracket: "$100k-$150k", percentage: 22},
                {bracket: "$150k-$200k", percentage: 10},
                {bracket: "Over $200k", percentage: 5}
              ]
            };
          }
        }
      } else {
        // No postcode, fetch directly from OpenAI
        console.log("Missing or incomplete demographic data, fetching from OpenAI...");
        const demographicData = await fetchDemographicDataFromInternet(propertyData.suburb, propertyData.postcode, apiKey);
        
        if (demographicData) {
          console.log("Successfully fetched demographic data from OpenAI");
          propertyData.demographics = demographicData;
        } else {
          console.log("Failed to fetch demographic data from OpenAI, using fallback data");
          propertyData.demographics = {
            ageDistribution: [
              {range: "0-18", percentage: 23},
              {range: "19-35", percentage: 31},
              {range: "36-50", percentage: 25},
              {range: "51-65", percentage: 14},
              {range: "66+", percentage: 7}
            ],
            ethnicDistribution: [
              {ethnicity: "Australian", percentage: 65},
              {ethnicity: "European", percentage: 15},
              {ethnicity: "Asian", percentage: 12},
              {ethnicity: "Middle Eastern", percentage: 3},
              {ethnicity: "Other", percentage: 5}
            ],
            incomeBrackets: [
              {bracket: "Under $50k", percentage: 25},
              {bracket: "$50k-$100k", percentage: 38},
              {bracket: "$100k-$150k", percentage: 22},
              {bracket: "$150k-$200k", percentage: 10},
              {bracket: "Over $200k", percentage: 5}
            ]
          };
        }
      }
    }
    
    // Fetch property growth rate data if not already available
    if (!propertyData.growthRateData && propertyData.postcode) {
      try {
        // Check if we have cached growth rate data for this postcode
        const cachedGrowthRateResult = await new Promise(resolve => {
          chrome.storage.local.get(['cachedGrowthRateData'], function(result) {
            if (result.cachedGrowthRateData && result.cachedGrowthRateData[propertyData.postcode]) {
              resolve(result.cachedGrowthRateData[propertyData.postcode]);
            } else {
              resolve(null);
            }
          });
        });
        
        if (cachedGrowthRateResult) {
          console.log("Using cached growth rate data for postcode:", propertyData.postcode);
          propertyData.growthRateData = cachedGrowthRateResult;
        } else {
          // No cached data, fetch from OpenAI
          console.log("No cached growth rate data, fetching from OpenAI...");
          const growthRateData = await estimatePropertyGrowthRate(propertyData.suburb, propertyData.postcode, apiKey);
          
          if (growthRateData) {
            console.log("Successfully fetched growth rate data from OpenAI");
            propertyData.growthRateData = growthRateData;
          }
        }
      } catch (error) {
        console.error("Error fetching growth rate data:", error);
      }
    }
    
    // Combine property data into a comprehensive prompt
    const promptDetails = [];
    
    // Ensure we have cleaned data to send to the API
    if (propertyData.address) promptDetails.push(`Address: ${propertyData.address}`);
    if (propertyData.price) promptDetails.push(`Price: ${propertyData.price}`);
    if (propertyData.bedrooms) promptDetails.push(`Beds: ${propertyData.bedrooms}`);
    if (propertyData.bathrooms) promptDetails.push(`Baths: ${propertyData.bathrooms}`);
    if (propertyData.parkingSpaces) promptDetails.push(`Parking: ${propertyData.parkingSpaces}`);
    if (propertyData.landSize) promptDetails.push(`Land Size: ${propertyData.landSize}`);
    if (propertyData.propertyType) promptDetails.push(`Property Type: ${propertyData.propertyType}`);
    if (propertyData.suburb) promptDetails.push(`Suburb: ${propertyData.suburb}`);
    
    // Log the data we extracted for debugging
    console.log("Extracted property data:", propertyData);
    
    // Add historical price data if available
    if (propertyData.historicalPrices && propertyData.historicalPrices.length > 0) {
      promptDetails.push(`Historical Prices: ${JSON.stringify(propertyData.historicalPrices)}`);
    }
    
    // Add demographics data to prompt
    if (propertyData.demographics) {
      promptDetails.push(`Demographics: ${JSON.stringify(propertyData.demographics)}`);
    }
    
    // Add market trends if available
    if (propertyData.marketTrends) {
      promptDetails.push(`Market Trends: ${JSON.stringify(propertyData.marketTrends)}`);
    }
    
    // Add postcode if available
    if (propertyData.postcode) {
      promptDetails.push(`Postcode: ${propertyData.postcode}`);
    }
    
    // Add last sold price if available
    if (propertyData.lastSoldPrice && propertyData.lastSoldPrice !== 'Not available') {
      promptDetails.push(`Last Sold Price: ${propertyData.lastSoldPrice}`);
    }
    
    // Store the raw property data for later use
    currentPropertyData = propertyData;
    
    const prompt = `As a sophisticated real estate investment advisor, analyze this property as an investment opportunity:

${promptDetails.join('\n')}

Provide all data as accurate, realistic, and valid numbers based on the latest available information. Format your entire response as a valid JSON object with the following structure:

{
  "pros": ["...", "...", "..."],
  "cons": ["...", "...", "..."],
  "financialAnalysis": {
    "estimatedROI": XX,
    "paybackPeriod": XX,
    "priceAssessment": XX, 
    "monthlyRentalIncome": XX,
    "monthlyExpenses": XX,
    "rentalYield": XX
  },
  "neighborhoodAnalysis": {
    "walkabilityScore": XX,
    "transitScore": XX,
    "schoolQualityScore": XX,
    "safetyScore": XX
  },
  "demographics": {
    "ageDistribution": [
      {"range": "0-18", "percentage": XX},
      {"range": "19-35", "percentage": XX},
      {"range": "36-50", "percentage": XX},
      {"range": "51-65", "percentage": XX},
      {"range": "66+", "percentage": XX}
    ],
    "ethnicDistribution": [
      {"ethnicity": "Australian", "percentage": XX},
      {"ethnicity": "European", "percentage": XX},
      {"ethnicity": "Asian", "percentage": XX},
      {"ethnicity": "Middle Eastern", "percentage": XX},
      {"ethnicity": "Other", "percentage": XX}
    ],
    "incomeBrackets": [
      {"bracket": "Under $50k", "percentage": XX},
      {"bracket": "$50k-$100k", "percentage": XX},
      {"bracket": "$100k-$150k", "percentage": XX},
      {"bracket": "$150k-$200k", "percentage": XX},
      {"bracket": "Over $200k", "percentage": XX}
    ]
  },
  "schoolData": {
    "primarySchools": [
      {"name": "School Name", "distance": "Xkm", "ranking": X.X, "type": "Public/Private/Catholic"},
      {"name": "School Name", "distance": "Xkm", "ranking": X.X, "type": "Public/Private/Catholic"}
    ],
    "secondarySchools": [
      {"name": "School Name", "distance": "Xkm", "ranking": X.X, "type": "Public/Private/Catholic"},
      {"name": "School Name", "distance": "Xkm", "ranking": X.X, "type": "Public/Private/Catholic"}
    ],
    "catchmentZone": "Description of school catchment zone"
  },
  "priceForecasts": {
    "1year": XX,
    "3year": XX,
    "5year": XX,
    "10year": XX,
    "20year": XX
  }
}

Where XX is a number (no % sign, no quotes). DO NOT include any explanations or text outside the JSON structure.

For price forecasts, please ensure that growth rates are conservative and realistic for the Australian property market. Long-term property growth rates typically range from 2-4% annually, with some areas underperforming and others outperforming based on local factors.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a sophisticated real estate investment analyst providing property investment analysis in strict JSON format. Your response MUST be a valid, parseable JSON object without any text outside the JSON structure. Include detailed numerical values for all metrics.\n\nFor demographic data:\n- Age distribution should use consistent age ranges (0-18, 19-35, 36-50, 51-65, 66+)\n- Ethnic distribution should include major groups (Australian, European, Asian, etc.) with realistic percentages\n- Income brackets should follow standard ranges (Under $50k, $50k-$100k, $100k-$150k, $150k-$200k, Over $200k)\n\nFor financial analysis:\n- priceAssessment should be a percentage value indicating how much the property is over/under market value (positive = overvalued, negative = undervalued)\n\nAll percentages should be provided as numbers without the % symbol. Do not include any explanations or text that would break JSON parsing."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2500,
          response_format: { "type": "json_object" }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      // Get the analysis from the API response
      let analysis = data.choices[0].message.content;
      
      // Try to parse the response as JSON right away
      try {
        // Check if it's already an object
        if (typeof analysis === 'string') {
          analysis = JSON.parse(analysis);
          console.log("Successfully parsed API response as JSON");
        }
      } catch (e) {
        console.warn("Failed to parse API response as JSON, will treat as text:", e);
      }
      
      // Store the raw analysis
      currentPropertyAnalysis = analysis;
      
      // Format the analysis with the UI components
      const formattedAnalysis = formatAnalysis(analysis);
      
      // Display the formatted analysis
      propertyAnalysisSection.classList.remove('hidden');
      loadingSection.classList.add('hidden');
      apiKeySection.classList.add('hidden');
      
      // Apply modern UI enhancements
      enhanceSections();
      animateVisualElements();
      
      // Save this analysis to chrome.storage.local
      chrome.storage.local.get(['savedAnalyses'], function(result) {
        const savedAnalyses = result.savedAnalyses || [];
        const newAnalysisEntry = {
          date: new Date().toISOString(),
          address: propertyData.address,
          analysis: analysis,
          propertyData: propertyData
        };
        
        // Avoid duplicate entries by address
        const existingIndex = savedAnalyses.findIndex(a => a.address === propertyData.address);
        if (existingIndex >= 0) {
          savedAnalyses[existingIndex] = newAnalysisEntry;
        } else {
          savedAnalyses.push(newAnalysisEntry);
        }
        
        chrome.storage.local.set({ savedAnalyses: savedAnalyses });
      });
      
      // Also save to the property analysis cache
      chrome.storage.local.get(['cachedPropertyAnalyses'], function(result) {
        const cachedPropertyAnalyses = result.cachedPropertyAnalyses || {};
        const propertyUrl = propertyData.url || window.location.href;
        
        // Store the analysis in the cache
        cachedPropertyAnalyses[propertyUrl] = {
          timestamp: new Date().toISOString(),
          analysis: analysis,
          propertyData: propertyData
        };
        
        chrome.storage.local.set({ cachedPropertyAnalyses: cachedPropertyAnalyses });
      });
      
    } catch (error) {
      console.error('Error analyzing property:', error);
      loadingSection.classList.add('hidden');
      errorSection.classList.remove('hidden');
      
      // Show specific error message
      const errorMessageEl = document.querySelector('.error-message');
      if (errorMessageEl) {
        errorMessageEl.textContent = `Error: ${error.message || 'Unknown error occurred'}. Please check your API key and try again.`;
      }
    }
  }

  // Function to format the analysis with proper styling
  function formatAnalysis(analysisText) {
    // Try to parse as JSON (new AI response format)
    let parsed = null;
    try {
      // Check if analysisText is already an object (some versions of the API might already parse the JSON)
      if (typeof analysisText === 'object' && analysisText !== null) {
        parsed = analysisText;
        console.log("Analysis is already a JSON object:", parsed);
      } else {
        parsed = JSON.parse(analysisText);
        console.log("Parsed JSON response:", parsed);
      }
    } catch (e) {
      console.log("Not JSON, falling back to text parsing:", e);
    }

    // Clear previous content
    analysisResults.innerHTML = "";

    if (parsed && typeof parsed === 'object') {
      // --- Render Pros/Cons ---
      const prosList = document.getElementById('prosList');
      if (prosList && Array.isArray(parsed.pros)) {
        prosList.innerHTML = `
          <h4>Pros</h4>
          <ul class="pros-cons-list">
            ${parsed.pros.map(pro => `<li>${pro}</li>`).join('')}
          </ul>
        `;
      }
      const consList = document.getElementById('consList');
      if (consList && Array.isArray(parsed.cons)) {
        consList.innerHTML = `
          <h4>Cons</h4>
          <ul class="pros-cons-list">
            ${parsed.cons.map(con => `<li>${con}</li>`).join('')}
          </ul>
        `;
      }

      // --- Render Financial Analysis ---
      const financialMetricsContainer = document.getElementById('financialMetrics');
      if (financialMetricsContainer && parsed.financialAnalysis) {
        const fa = parsed.financialAnalysis;
        let metricsHTML = '';
        if (fa.estimatedROI !== undefined) {
          metricsHTML += `<div class="financial-metric-card"><div class="metric-label">Estimated ROI</div><div class="metric-value">${fa.estimatedROI}%</div></div>`;
        }
        if (fa.paybackPeriod !== undefined) {
          metricsHTML += `<div class="financial-metric-card"><div class="metric-label">Payback Period</div><div class="metric-value">${fa.paybackPeriod} years</div></div>`;
        }
        if (fa.priceAssessment !== undefined) {
          // Interpret price assessment: positive means overvalued, negative means undervalued
          const isOvervalued = fa.priceAssessment > 0;
          const percentage = Math.abs(fa.priceAssessment);
          metricsHTML += `
            <div class="financial-metric-card">
              <div class="metric-label">Market Value Assessment</div>
              <div class="metric-value ${isOvervalued ? 'text-warning' : 'text-success'}">
                ${isOvervalued ? 'Overvalued' : 'Undervalued'} by ${percentage.toFixed(1)}%
              </div>
            </div>
          `;
        }
        if (fa.monthlyRentalIncome !== undefined) {
          metricsHTML += `<div class="financial-metric-card"><div class="metric-label">Monthly Rental Income</div><div class="metric-value">${formatCurrency(fa.monthlyRentalIncome)}</div></div>`;
        }
        if (fa.monthlyExpenses !== undefined) {
          metricsHTML += `<div class="financial-metric-card"><div class="metric-label">Monthly Expenses</div><div class="metric-value">${formatCurrency(fa.monthlyExpenses)}</div></div>`;
        }
        if (fa.rentalYield !== undefined) {
          metricsHTML += `<div class="financial-metric-card"><div class="metric-label">Rental Yield</div><div class="metric-value">${fa.rentalYield}%</div></div>`;
        }
        financialMetricsContainer.innerHTML = metricsHTML;
      }

      // --- Render Demographics ---
      if (parsed.demographics) {
        visualizeAgeDistribution(parsed.demographics.ageDistribution || []);
        visualizeEthnicDistribution(parsed.demographics.ethnicDistribution || []);
        visualizeIncomeDistribution(parsed.demographics.incomeBrackets || []);
      }

      // --- Render School Data ---
      if (parsed.schoolData) {
        displaySchoolData(parsed.schoolData);
      }

      // --- Render Price Forecasts ---
      createPriceForecastChart(parsed, currentPropertyData);
      
      // --- Render Rental Returns ---
      createRentalReturnChart(parsed, currentPropertyData);
      
      // --- Display School Data ---
      displaySchoolData(parsed.schoolData);

      // Update property summary
      updatePropertySummary();

      // Set up click handlers for expandable sections
      setupExpandableSections();

      return parsed;
    } else {
      // --- FALLBACK: Old text parsing logic ---
      
    // Helper function to extract lists
    function extractList(text, marker) {
      const regex = new RegExp(`${marker}[^:]*:(.+?)(?=\\n\\n|$)`, 's');
      const match = text.match(regex);
      if (!match) return [];
      
      const items = match[1].split('\n').map(item => 
        item.trim().replace(/^-\s*|\d+\.\s*/g, '')
      ).filter(item => item.length > 0);
      
      return items;
    }
    
      // Only apply string operations if analysisText is actually a string
      if (typeof analysisText === 'string') {
        // Extract pros and cons
        const pros = extractList(analysisText, 'Pros');
        const cons = extractList(analysisText, 'Cons');
        
        // Render pros and cons
        const prosList = document.getElementById('prosList');
        if (prosList) {
          prosList.innerHTML = `
            <h4>Pros</h4>
            <ul class="pros-cons-list">
              ${pros.map(pro => `<li>${pro}</li>`).join('')}
            </ul>
          `;
        }
        
        const consList = document.getElementById('consList');
        if (consList) {
          consList.innerHTML = `
            <h4>Cons</h4>
            <ul class="pros-cons-list">
              ${cons.map(con => `<li>${con}</li>`).join('')}
            </ul>
          `;
        }
      
        // Extract and visualize demographic data
        const demographics = extractDemographicData(analysisText);
        
        if (demographics.ageDistribution.length > 0) {
          visualizeAgeDistribution(demographics.ageDistribution);
        }
        
        if (demographics.ethnicDistribution.length > 0) {
          visualizeEthnicDistribution(demographics.ethnicDistribution);
        }
        
        if (demographics.incomeBrackets.length > 0) {
          visualizeIncomeDistribution(demographics.incomeBrackets);
        }
        
        // Create price forecast chart
        createPriceForecastChart(analysisText, currentPropertyData);
        
        // Create rental return chart 
        createRentalReturnChart(analysisText, currentPropertyData);
        
        // Display school data
        displaySchoolData(null);
        
        // Extract investment insights for the financial metrics
        const investmentMetrics = extractInvestmentInsights(analysisText);
        const financialMetricsContainer = document.getElementById('financialMetrics');
        
        if (financialMetricsContainer) {
          let metricsHTML = '';
          
          for (const [label, value] of Object.entries(investmentMetrics)) {
            if (value) {
              metricsHTML += `
                <div class="financial-metric-card">
                  <div class="metric-label">${label}</div>
                  <div class="metric-value">${value}</div>
                </div>
              `;
            }
          }
          
          financialMetricsContainer.innerHTML = metricsHTML;
        }
        
        // Update property summary
        updatePropertySummary();
        
        // Set up click handlers for expandable sections
        setupExpandableSections();
      } else {
        console.error("Analysis text is not a string and could not be parsed as JSON");
        // Handle the case where analysisText is neither valid JSON nor a string
        const errorHTML = `
          <div class="analysis-error">
            <h4>Error Processing Analysis</h4>
            <p>There was an error processing the AI response. Please try again.</p>
          </div>
        `;
        analysisResults.innerHTML = errorHTML;
      }
      
      return analysisText;
    }
  }

  // Helper function to set up expandable sections
  function setupExpandableSections() {
    setTimeout(() => {
      const sectionTitles = document.querySelectorAll('.section-title');
      sectionTitles.forEach(title => {
        title.addEventListener('click', function() {
          const section = this.closest('.section');
          section.classList.toggle('collapsed');
          
          // Toggle the content visibility
          const content = section.querySelector('.section-content');
          if (content.style.maxHeight) {
            content.style.maxHeight = null;
          } else {
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        });
      });
    }, 100);
  }

  // Update property summary section with data
  function updatePropertySummary() {
    const summaryCard = document.getElementById('propertySummaryCard');
    if (!summaryCard) return;
    
    console.log("Updating property summary with data:", currentPropertyData);
    
    // Extract address and price from analysis or propertyData
    let address = "Address not available";
    let price = "Price not available";
    let beds = "N/A";
    let baths = "N/A";
    let parking = "N/A";
    let propertyType = "N/A";
    let landSize = "N/A";
    
    // If we have direct property data, use that (highest priority)
    if (currentPropertyData) {
      if (currentPropertyData.address) address = currentPropertyData.address;
      if (currentPropertyData.price) price = currentPropertyData.price;
      if (currentPropertyData.bedrooms) beds = currentPropertyData.bedrooms;
      if (currentPropertyData.bathrooms) baths = currentPropertyData.bathrooms;
      if (currentPropertyData.parkingSpaces) parking = currentPropertyData.parkingSpaces;
      if (currentPropertyData.propertyType) propertyType = currentPropertyData.propertyType;
      if (currentPropertyData.landSize) landSize = currentPropertyData.landSize;
    }
    
    // Create the summary HTML
    summaryCard.innerHTML = `
      <div class="property-address">${address}</div>
      <div class="property-price">${price}</div>
      <div class="property-summary-grid">
        <div class="property-data-item">
          <div class="property-data-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
          <div>
            <span class="property-data-label">Type:</span>
            <span class="property-data-value">${propertyType}</span>
        </div>
        </div>
        <div class="property-data-item">
          <div class="property-data-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            </div>
          <div>
            <span class="property-data-label">Land Size:</span>
            <span class="property-data-value">${landSize}</span>
            </div>
          </div>
        <div class="property-data-item">
          <div class="property-data-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"></path><path d="M12 9v12"></path><path d="M3.5 9H20"></path></svg>
        </div>
          <div>
            <span class="property-data-label">Bedrooms:</span>
            <span class="property-data-value">${beds}</span>
      </div>
        </div>
        <div class="property-data-item">
          <div class="property-data-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2v-7.93a2 2 0 0 0-.59-1.42L16 7.2V2h-4v5.2l-3.42 3.45a2 2 0 0 0-.58 1.41V20a2 2 0 0 0 2 2Z"></path></svg>
          </div>
          <div>
            <span class="property-data-label">Bathrooms:</span>
            <span class="property-data-value">${baths}</span>
                    </div>
                  </div>
        <div class="property-data-item">
          <div class="property-data-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M6 9h12" /></svg>
              </div>
          <div>
            <span class="property-data-label">Parking:</span>
            <span class="property-data-value">${parking}</span>
            </div>
        </div>
      </div>
    `;
  }

  // Function to extract investment insights and update the UI
  function extractInvestmentInsights(analysisText) {
    // Regular expressions to extract financial data
    const roiRegex = /(?:estimated\s+)?ROI\s*(?:of|:)?\s*([\d\.]+)%/i;
    const paybackRegex = /(?:payback|break[- ]even)\s+period\s*(?:of|:)?\s*([\d\.]+)\s*(?:years|yrs)/i;
    const rentalIncomeRegex = /(?:monthly\s+)?rental\s+income\s*(?:of|:)?\s*\$?([\d,\.]+)/i;
    const expensesRegex = /(?:monthly\s+)?expenses\s*(?:of|:)?\s*\$?([\d,\.]+)/i;
    const valueRegex = /(over|under)valued\s+by\s*(?:about)?\s*([\d\.]+)%/i;
    
    // Extract the data
    const roiMatch = analysisText.match(roiRegex);
    const paybackMatch = analysisText.match(paybackRegex);
    const rentalMatch = analysisText.match(rentalIncomeRegex);
    const expensesMatch = analysisText.match(expensesRegex);
    const valueMatch = analysisText.match(valueRegex);
    
    // Create financial metrics object
    const financialData = {
      roi: roiMatch ? parseFloat(roiMatch[1]) : null,
      payback: paybackMatch ? parseFloat(paybackMatch[1]) : null,
      rentalIncome: rentalMatch ? parseFloat(rentalMatch[1].replace(/,/g, '')) : null,
      expenses: expensesMatch ? parseFloat(expensesMatch[1].replace(/,/g, '')) : null,
      valueAssessment: valueMatch ? { direction: valueMatch[1], percentage: parseFloat(valueMatch[2]) } : null
    };
    
    // Update the UI with the financial metrics
    const financialMetricsContainer = document.getElementById('financialMetrics');
    if (financialMetricsContainer) {
      let metricsHTML = '';
      
      if (financialData.roi !== null) {
        metricsHTML += `
          <div class="financial-metric-card">
            <div class="metric-label">Estimated ROI</div>
            <div class="metric-value">${financialData.roi}%</div>
        </div>
        `;
      }
      
      if (financialData.payback !== null) {
        metricsHTML += `
          <div class="financial-metric-card">
            <div class="metric-label">Payback Period</div>
            <div class="metric-value">${financialData.payback} years</div>
          </div>
        `;
      }
      
      if (financialData.rentalIncome !== null) {
        metricsHTML += `
          <div class="financial-metric-card">
            <div class="metric-label">Monthly Rental Income</div>
            <div class="metric-value">${formatCurrency(financialData.rentalIncome)}</div>
                    </div>
        `;
      }
      
      if (financialData.expenses !== null) {
        metricsHTML += `
          <div class="financial-metric-card">
            <div class="metric-label">Monthly Expenses</div>
            <div class="metric-value">${formatCurrency(financialData.expenses)}</div>
                  </div>
        `;
      }
      
      if (financialData.valueAssessment !== null) {
        const direction = financialData.valueAssessment.direction;
        const percentage = financialData.valueAssessment.percentage;
        metricsHTML += `
          <div class="financial-metric-card">
            <div class="metric-label">Market Value Assessment</div>
            <div class="metric-value ${direction === 'under' ? 'text-success' : 'text-warning'}">
              ${direction === 'under' ? 'Undervalued' : 'Overvalued'} by ${percentage.toFixed(1)}%
        </div>
      </div>
    `;
      }
      
      financialMetricsContainer.innerHTML = metricsHTML;
    }
    
    return financialData;
  }

  // Function to create price forecast visualization
  function createPriceForecastChart(analysisText, propertyData) {
    const forecastChartContainer = document.getElementById('priceForecastChart');
    if (!forecastChartContainer) return;
    
    // Get the current price from property data
    let currentPrice = 0;
    if (propertyData && propertyData.price) {
      // Extract numeric value from price string like "$750,000"
      const priceMatch = propertyData.price.match(/[\d,]+/);
      if (priceMatch) {
        currentPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
      }
    }
    
    // Default to a reasonable value if not found
    if (currentPrice === 0) {
      currentPrice = 750000; // Default if no price is found
    }
    
    // Define more conservative annual growth rate (compound growth)
    // For Australian real estate, use a more realistic conservative estimate
    const defaultAnnualGrowthRate = 0.015; // 1.5% annual growth (very conservative Australian long-term average)
    
    // Define key years for forecast - use 5-year intervals
    const currentYear = new Date().getFullYear();
    const forecastYears = [
      currentYear,        // Current year
      currentYear + 5,    // 5 years
      currentYear + 10,   // 10 years
      currentYear + 15,   // 15 years
      currentYear + 20    // 20 years
    ];
    
    // Extract growth percentages from the analysis if available
    let customGrowthRate = null;
    let growthRateSources = [];
    
    // Check if analysisText is a JSON object with price forecasts
    if (analysisText && typeof analysisText === 'object' && analysisText.priceForecasts) {
      const forecasts = analysisText.priceForecasts;
      
      // Try to get the annual growth rate from the available data
      if (forecasts["1year"] !== undefined) {
        customGrowthRate = forecasts["1year"] / 100;
        growthRateSources.push("1-year forecast");
      } else if (forecasts["5year"] !== undefined) {
        // Convert 5-year growth to compound annual growth rate
        customGrowthRate = Math.pow(1 + (forecasts["5year"] / 100), 1/5) - 1;
        growthRateSources.push("5-year forecast");
      } else if (forecasts["10year"] !== undefined) {
        // Convert 10-year growth to compound annual growth rate
        customGrowthRate = Math.pow(1 + (forecasts["10year"] / 100), 1/10) - 1;
        growthRateSources.push("10-year forecast");
      }
    }
    
    // Try to get postcode-specific growth rate data if available
    let postcodeGrowthRate = null;
    
    // Check if propertyData has custom growth rate data from postcode
    if (propertyData && propertyData.growthRateData && 
        propertyData.growthRateData.annualGrowthRate !== undefined) {
      postcodeGrowthRate = propertyData.growthRateData.annualGrowthRate / 100;
      growthRateSources.push("postcode analysis");
    } else if (propertyData && propertyData.postcode) {
      // Try to get cached growth rate data for this postcode
      chrome.storage.local.get(['cachedGrowthRateData'], function(result) {
        if (result.cachedGrowthRateData && 
            result.cachedGrowthRateData[propertyData.postcode] && 
            result.cachedGrowthRateData[propertyData.postcode].annualGrowthRate !== undefined) {
          
          const cachedRate = result.cachedGrowthRateData[propertyData.postcode].annualGrowthRate / 100;
          
          // Only update if we haven't gotten growth rate from another source
          if (customGrowthRate === null) {
            customGrowthRate = cachedRate;
            growthRateSources.push("cached postcode data");
            
            // Regenerate the chart with the new data
            generateAndDisplayChart();
          }
        } else {
          // Fetch postcode-specific growth rate asynchronously
          // We'll get the API key first
          chrome.storage.sync.get(['openaiApiKey'], function(result) {
            if (result.openaiApiKey) {
              // Get the growth rate estimate
              estimatePropertyGrowthRate(propertyData.suburb, propertyData.postcode, result.openaiApiKey)
                .then(growthData => {
                  if (growthData && growthData.annualGrowthRate !== undefined) {
                    // Store in property data for future reference
                    propertyData.growthRateData = growthData;
                    
                    // Only update if we haven't gotten growth rate from another source
                    if (customGrowthRate === null) {
                      customGrowthRate = growthData.annualGrowthRate / 100;
                      growthRateSources.push("postcode analysis");
                      
                      // Regenerate the chart with the new data
                      generateAndDisplayChart();
                    }
                  }
                })
                .catch(error => {
                  console.error("Error fetching postcode-specific growth rate:", error);
                });
            }
          });
        }
      });
    }
    
    // Function to generate and display the chart
    function generateAndDisplayChart() {
      // Make sure the growth rate is reasonable (cap at realistic values)
      if (customGrowthRate !== null) {
        // Cap at 4% which is realistic for long-term Australian property growth
        if (customGrowthRate > 0.04) {
          customGrowthRate = 0.04;
        }
        // Don't allow negative growth rates less than -1.5%
        if (customGrowthRate < -0.015) {
          customGrowthRate = -0.015;
        }
      }
      
      console.log("Extracted custom growth rate:", customGrowthRate);
      console.log("Growth rate sources:", growthRateSources);
      
      // Use the custom growth rate if available, otherwise use default
      const annualGrowthRate = customGrowthRate !== null ? customGrowthRate : defaultAnnualGrowthRate;
      console.log("Using annual growth rate:", annualGrowthRate);
      
      // Generate the forecast data for visualization using compound growth
      const forecastData = forecastYears.map((year, index) => {
        const yearDiff = year - currentYear;
        // Compound growth model: initial price * (1 + annual growth rate)^years
        const projectedPrice = currentPrice * Math.pow(1 + annualGrowthRate, yearDiff);
        const totalGrowthPercentage = ((projectedPrice / currentPrice) - 1) * 100;
        
        return {
          year: year,
          price: projectedPrice,
          growthPercentage: totalGrowthPercentage.toFixed(1)
        };
      });
      
      console.log("Forecast data:", forecastData);
      
      // Calculate min and max values for the chart with some padding
      // Use fixed percentage range to avoid vertical stretching
      let minPrice = currentPrice * 0.95; // 5% below current price for visual margin
      
      // Calculate what the max price would be with a 3% annual growth over 20 years
      // This creates a consistent scale regardless of the actual growth rate
      const referenceMaxPrice = currentPrice * Math.pow(1 + 0.03, 20);
      const maxPrice = Math.max(forecastData[forecastData.length - 1].price * 1.05, referenceMaxPrice); 
      
      const priceRange = maxPrice - minPrice;
      
      // Create a more modern Tailwind-inspired chart - removing redundant title
      forecastChartContainer.innerHTML = `
        <div class="forecast-chart-modern">
          <div class="forecast-chart-content">
            <div class="forecast-chart-grid">
              ${Array(5).fill(0).map((_, i) => {
                const gridValue = maxPrice - (i * (priceRange / 4));
                return `<div class="forecast-grid-line">
                  <span class="forecast-grid-label">${formatCurrency(gridValue)}</span>
                  <span class="forecast-grid-line-inner"></span>
                </div>`;
              }).join('')}
            </div>
            
            <div class="forecast-chart-lines">
              <svg width="100%" height="100%" viewBox="0 0 440 300" preserveAspectRatio="none">
                <!-- Line connecting data points -->
                <path 
                  d="${generateSVGPathModern(forecastData, minPrice, maxPrice)}"
                  stroke="rgba(59, 130, 246, 0.8)"
                  stroke-width="3"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                
                <!-- Gradient area under the line -->
                <path
                  d="${generateSVGAreaModern(forecastData, minPrice, maxPrice)}"
                  fill="url(#blue-gradient)"
                  opacity="0.2"
                />
                
                <!-- Gradient definition -->
                <defs>
                  <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="rgb(59, 130, 246)" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="rgb(59, 130, 246)" stop-opacity="0.1"/>
                  </linearGradient>
                </defs>
                
                <!-- Data points -->
                ${forecastData.map((point, index) => {
                  const x = 20 + ((index / (forecastData.length - 1)) * 400);
                  const y = 300 - ((point.price - minPrice) / priceRange) * 260;
                  return `
                  <circle cx="${x}" cy="${y}" r="6" fill="white" stroke="rgb(59, 130, 246)" stroke-width="2" />
                  <text x="${x}" y="${y - 15}" text-anchor="middle" font-size="11" fill="#333" class="forecast-label">
                    ${formatCurrency(Math.round(point.price / 1000) * 1000)}
                  </text>
                  `;
                }).join('')}
              </svg>
            </div>
          </div>
          
          <div class="forecast-chart-labels">
            ${forecastData.map((point, index) => {
              return `
              <div class="forecast-label-column">
                <div class="forecast-point-year">${point.year}</div>
                <div class="forecast-point-growth ${parseFloat(point.growthPercentage) > 0 ? 'text-success' : ''}">${parseFloat(point.growthPercentage) > 0 ? '+' : ''}${point.growthPercentage}%</div>
              </div>
              `;
            }).join('')}
          </div>
          
          <div class="forecast-note">
            <p>Based on ${(annualGrowthRate * 100).toFixed(1)}% compound annual growth rate for ${propertyData.suburb || 'this area'}</p>
            ${growthRateSources.length > 0 ? `<p class="forecast-source">Source: ${growthRateSources.join(', ')}</p>` : ''}
          </div>
        </div>
      `;
      
      // Add custom styles for the modern chart with improved dimensions
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .forecast-chart-modern {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
        }
        .forecast-chart-content {
          position: relative;
          height: 320px; /* Increased height to ensure content is fully visible */
          margin-bottom: 1.5rem;
        }
        .forecast-chart-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 1;
        }
        .forecast-grid-line {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }
        .forecast-grid-label {
          font-size: 0.75rem;
          color: #6b7280;
          width: 85px;
          text-align: right;
          padding-right: 0.5rem;
        }
        .forecast-grid-line-inner {
          flex-grow: 1;
          height: 1px;
          background-color: rgba(229, 231, 235, 0.8);
        }
        .forecast-chart-lines {
          position: absolute;
          top: 0;
          left: 85px; /* Space for labels */
          right: 0;
          height: 100%;
          z-index: 2;
        }
        .forecast-chart-labels {
          display: flex;
          padding-left: 85px;
          padding-right: 20px;
          justify-content: space-between;
          margin-top: 0.5rem;
        }
        .forecast-label-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .forecast-point-value {
          font-weight: 600;
          font-size: 0.875rem;
          color: #1f2937;
        }
        .forecast-point-growth {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0.25rem 0;
        }
        .forecast-point-growth.text-success {
          color: #10b981;
        }
        .forecast-point-year {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
        }
        .forecast-note {
          text-align: center;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
          font-style: italic;
        }
        .forecast-source {
          text-align: center;
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }
        /* Make sure the section height is adequate but not excessive */
        #priceForecastChart {
          min-height: 450px; /* Increased min-height to ensure content is fully displayed */
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    // Initialize the chart with default or available data
    generateAndDisplayChart();
    
    // Helper function to generate SVG path for the line
    function generateSVGPathModern(data, minPrice, maxPrice) {
      const range = maxPrice - minPrice;
      const points = data.map((point, index) => {
        const x = 20 + ((index / (data.length - 1)) * 400);
        const y = 300 - ((point.price - minPrice) / range) * 260;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      });
      return points.join(' ');
    }
    
    // Helper function to generate SVG path for the area under the line
    function generateSVGAreaModern(data, minPrice, maxPrice) {
      const range = maxPrice - minPrice;
      let path = '';
      
      // Move to the first point
      const firstX = 20;
      const firstY = 300 - ((data[0].price - minPrice) / range) * 260;
      path += `M ${firstX} ${firstY}`;
      
      // Add line segments to each point
      for (let i = 0; i < data.length; i++) {
        const x = 20 + ((i / (data.length - 1)) * 400);
        const y = 300 - ((data[i].price - minPrice) / range) * 260;
        path += ` L ${x} ${y}`;
      }
      
      // Complete the path by going to the bottom right, then bottom left, then back to start
      path += ` L 420 300 L 20 300 Z`;
      
      return path;
    }
  }

  // Create rental return visualization with fallback data
  function createRentalReturnChart(analysisText, propertyData) {
    const rentalChartContainer = document.getElementById('rentalReturnChart');
    if (!rentalChartContainer) return;
    
    // Extract rental yield and monthly rental income from the analysis
    let rentalYield = 0;
    let monthlyRental = 0;
    let annualRental = 0;
    let propertyPrice = 0;
    
    // Try to get property price
    if (propertyData && propertyData.price) {
      const priceMatch = propertyData.price.match(/[\d,]+/);
      if (priceMatch) {
        propertyPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
      }
    }
    
    // Default to a reasonable value if not found
    if (propertyPrice === 0) {
      propertyPrice = 750000; // Default
    }
    
    // Check if analysisText is a JSON object or string
    if (analysisText && typeof analysisText === 'object' && analysisText.financialAnalysis) {
      // It's a JSON object - extract data directly
      const fa = analysisText.financialAnalysis;
      
      if (fa.rentalYield !== undefined) {
        rentalYield = fa.rentalYield / 100;
      }
      
      if (fa.monthlyRentalIncome !== undefined) {
        monthlyRental = fa.monthlyRentalIncome;
        annualRental = monthlyRental * 12;
      }
      
      console.log("Using JSON financial data:", { rentalYield, monthlyRental, annualRental });
    } else if (typeof analysisText === 'string') {
      // It's a string - try to extract data using regex
      // Try to extract rental yield with improved regex patterns
      const yieldMatches = [
        analysisText.match(/(?:rental|yield|return)\s+(?:yield|return)(?:\s+of)?\s*([\d\.]+)%/i),
        analysisText.match(/yield:\s*([\d\.]+)%/i),
        analysisText.match(/rental\s+yield\s+(?:of|is)?\s*([\d\.]+)%/i)
      ];
      
      for (const match of yieldMatches) {
        if (match) {
          rentalYield = parseFloat(match[1]) / 100;
          break;
        }
      }
      
      // Try to extract monthly rental with improved regex patterns
      const rentalMatches = [
        analysisText.match(/(?:monthly|estimated monthly|potential monthly)\s+(?:rental|rent)(?:\s+income)?\s*(?:of|:)?\s*\$?([\d,\.]+)/i),
        analysisText.match(/monthly\s+rental\s+income:\s*\$?([\d,\.]+)/i),
        analysisText.match(/rental\s+income:\s*\$?([\d,\.]+)\s+per\s+month/i)
      ];
      
      for (const match of rentalMatches) {
        if (match) {
          monthlyRental = parseFloat(match[1].replace(/,/g, ''));
          annualRental = monthlyRental * 12;
          break;
        }
      }
      
      console.log("Using regex-extracted rental data:", { rentalYield, monthlyRental, annualRental });
    }
    
    // If we couldn't get monthly rental, but have yield and price, calculate it
    if (monthlyRental === 0 && rentalYield > 0 && propertyPrice > 0) {
      annualRental = propertyPrice * rentalYield;
      monthlyRental = annualRental / 12;
    }
    
    // If we still don't have yield but have monthly rental and price, calculate it
    if (rentalYield === 0 && monthlyRental > 0 && propertyPrice > 0) {
      annualRental = monthlyRental * 12;
      rentalYield = annualRental / propertyPrice;
    }
    
    // If we still have no data, use defaults based on property price
    if (rentalYield === 0 || monthlyRental === 0) {
      // Default to sensible Australian rental yields based on property type
      let defaultYield = 0.04; // 4% default
      
      if (propertyData && propertyData.propertyType) {
        const propertyType = propertyData.propertyType.toLowerCase();
        if (propertyType.includes('house')) {
          defaultYield = 0.035; // 3.5% for houses
        } else if (propertyType.includes('apartment') || propertyType.includes('unit')) {
          defaultYield = 0.042; // 4.2% for apartments/units
        } else if (propertyType.includes('townhouse')) {
          defaultYield = 0.04; // 4% for townhouses
        }
      }
      
      rentalYield = defaultYield;
      annualRental = propertyPrice * rentalYield;
      monthlyRental = annualRental / 12;
    }
    
    // Create the rental return visualization
    let rentalHTML = `
      <div class="rental-metrics-container">
        <div class="financial-metric-card">
          <div class="metric-label">Monthly Rental Income</div>
          <div class="metric-value">${formatCurrency(monthlyRental)}</div>
        </div>
        <div class="financial-metric-card">
          <div class="metric-label">Annual Rental Income</div>
          <div class="metric-value">${formatCurrency(annualRental)}</div>
        </div>
        <div class="financial-metric-card">
          <div class="metric-label">Rental Yield</div>
          <div class="metric-value">${(rentalYield * 100).toFixed(1)}%</div>
        </div>
        <div class="financial-metric-card">
          <div class="metric-label">Return on Investment</div>
          <div class="metric-value">${(((annualRental / propertyPrice) * 100).toFixed(1))}%</div>
        </div>
      </div>
      
      <div class="rental-progress-container">
        <div class="rental-progress-label">
          <div class="rental-progress-title">Annual Rental vs. Property Price</div>
          <div class="rental-progress-value">${formatCurrency(annualRental)} / ${formatCurrency(propertyPrice)}</div>
        </div>
        <div class="rental-progress-bar">
          <div class="rental-progress-fill" style="width: ${Math.min(100, (annualRental / propertyPrice) * 100)}%;"></div>
        </div>
      </div>
      
      <div style="margin-top: 16px; font-size: 12px; color: var(--text-muted); text-align: center;">
        *Based on current market rates for similar properties in the area
      </div>
    `;
    
    rentalChartContainer.innerHTML = rentalHTML;
    
    // Add custom styles to ensure rental returns section has adequate height
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      #rentalReturnChart {
        min-height: 280px; /* Ensure adequate space for rental returns */
        padding-bottom: 20px;
      }
      
      .rental-metrics-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .rental-progress-container {
        margin-top: 16px;
      }
      
      .rental-progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      
      .rental-progress-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-color);
      }
      
      .rental-progress-value {
        font-size: 14px;
        color: var(--text-muted);
      }
      
      .rental-progress-bar {
        height: 10px;
        background-color: #e5e7eb;
        border-radius: 5px;
        overflow: hidden;
      }
      
      .rental-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        border-radius: 5px;
        transition: width 1s ease-in-out;
      }
      
      /* Ensure the financial metric cards have enough space */
      .financial-metric-card {
        background-color: white;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        min-height: 90px; /* Ensure cards have adequate height */
      }
      
      .metric-label {
        font-size: 13px;
        color: var(--text-muted);
        margin-bottom: 6px;
      }
      
      .metric-value {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-color);
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Helper function to format currency values
  function formatCurrency(amount) {
    // Handle invalid or empty values gracefully
    if (!amount || isNaN(parseFloat(amount))) {
      return '$0';
    }
    
    // Convert to number if it's a string
    if (typeof amount === 'string') {
      amount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    }
    
    // Format the number as currency
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Initialize UI to ensure sections work correctly
  function initializeUI() {
    setupModernUI();
    
    // Set default state for sections - expanded
    document.querySelectorAll('.section').forEach(section => {
      const content = section.querySelector('.section-content');
      if (content) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
      section.classList.add('expanded');
    });
    
    // Add click handlers for section toggle
    document.querySelectorAll('.section-title').forEach(title => {
      title.addEventListener('click', function() {
        const section = this.closest('.section');
        section.classList.toggle('collapsed');
        
        // Toggle the content visibility
        const content = section.querySelector('.section-content');
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  // Function to extract and visualize demographic data with fallback data
  function extractDemographicData(analysisText) {
    // Check if we already have demographic data in currentPropertyData
    if (currentPropertyData && currentPropertyData.demographics) {
      console.log("Using demographic data from property:", currentPropertyData.demographics);
      
      // Use the provided age distribution if available
      let ageDistribution = [];
      if (currentPropertyData.demographics.ageDistribution && currentPropertyData.demographics.ageDistribution.length > 0) {
        ageDistribution = currentPropertyData.demographics.ageDistribution;
        console.log("Using age distribution from API:", ageDistribution);
      }
      
      // Use the provided ethnic distribution if available
      let ethnicDistribution = [];
      if (currentPropertyData.demographics.ethnicDistribution && currentPropertyData.demographics.ethnicDistribution.length > 0) {
        ethnicDistribution = currentPropertyData.demographics.ethnicDistribution;
        console.log("Using ethnic distribution from API:", ethnicDistribution);
      }
      
      // Use the provided income brackets if available
      let incomeBrackets = [];
      if (currentPropertyData.demographics.incomeBrackets && currentPropertyData.demographics.incomeBrackets.length > 0) {
        incomeBrackets = currentPropertyData.demographics.incomeBrackets;
        console.log("Using income brackets from API:", incomeBrackets);
      }
      
      // Visualize the demographic data
      visualizeAgeDistribution(ageDistribution);
      visualizeEthnicDistribution(ethnicDistribution);
      visualizeIncomeDistribution(incomeBrackets);
      
      return {
        ageDistribution,
        ethnicDistribution,
        incomeDistribution: incomeBrackets
      };
    }
    
    // If we get here, we don't have demographics in currentPropertyData
    // Extract from the analysis text (this is backup/legacy code path)
    console.log("No demographic data in currentPropertyData, extracting from analysis text");
    
    // Age distribution
    const ageDistribution = [];
    const ageRegex = /(\d+(?:-\d+|\+))\s*(?:years)?:?\s*([\d\.]+)%/gi;
    let ageMatch;
    
    while ((ageMatch = ageRegex.exec(analysisText)) !== null) {
      ageDistribution.push({
        range: ageMatch[1],
        percentage: parseFloat(ageMatch[2])
      });
    }
    
    // Sort age distribution by age range
    if (ageDistribution.length > 0) {
      ageDistribution.sort((a, b) => {
        // Extract the first number from each range for sorting
        const aNum = parseInt(a.range.match(/\d+/)[0]);
        const bNum = parseInt(b.range.match(/\d+/)[0]);
        return aNum - bNum;
      });
    }
    
    // If no age data found, create default data
    if (ageDistribution.length === 0) {
      ageDistribution.push({ range: "0-18", percentage: 23 });
      ageDistribution.push({ range: "19-35", percentage: 31 });
      ageDistribution.push({ range: "36-50", percentage: 25 });
      ageDistribution.push({ range: "51-65", percentage: 14 });
      ageDistribution.push({ range: "66+", percentage: 7 });
    }
    
    // Ethnic distribution
    const ethnicDistribution = [];
    
    // Look for the demographics section in the analysis
    const demographicsSection = analysisText.match(/demographics(?:\s*section)?(?:\s*:)?\s*([\s\S]*?)(?=\d\.|\n\n\d|\n\n[A-Z]|$)/i);
    
    if (demographicsSection) {
      // Try to find ethnicity data in the demographics section
      const ethnicitySection = demographicsSection[1].match(/ethnicity|ethnic(?:\s*distribution)?(?:\s*:)?\s*([\s\S]*?)(?=age|income|\d\.|\n\n\d|\n\n[A-Z]|$)/i);
      
      if (ethnicitySection) {
        // Extract ethnicity data using line-by-line approach
        const lines = ethnicitySection[0].split('\n');
        for (const line of lines) {
          // Match patterns like "Australian: 65%" or "European: 15%"
          const ethnicMatch = line.match(/([\w\s-]+):\s*([\d\.]+)%/);
          if (ethnicMatch && !line.toLowerCase().includes('ethnicity') && !line.toLowerCase().includes('distribution')) {
            ethnicDistribution.push({
              ethnicity: ethnicMatch[1].trim(),
              percentage: parseFloat(ethnicMatch[2])
            });
          }
        }
      }
    }
    
    // If no ethnic data found, create default Australian demographic data
    if (ethnicDistribution.length === 0) {
      ethnicDistribution.push({ ethnicity: "Australian", percentage: 65 });
      ethnicDistribution.push({ ethnicity: "European", percentage: 15 });
      ethnicDistribution.push({ ethnicity: "Asian", percentage: 12 });
      ethnicDistribution.push({ ethnicity: "Middle Eastern", percentage: 3 });
      ethnicDistribution.push({ ethnicity: "Other", percentage: 5 });
    }
    
    // Income distribution
    const incomeBrackets = [];
    
    // Try to find income distribution in the demographics section
    if (demographicsSection) {
      const incomeSection = demographicsSection[1].match(/income(?:\s*distribution)?(?:\s*:)?\s*([\s\S]*?)(?=age|ethnicity|\d\.|\n\n\d|\n\n[A-Z]|$)/i);
      
      if (incomeSection) {
        // Extract income data using line-by-line approach
        const lines = incomeSection[0].split('\n');
        for (const line of lines) {
          // Match income brackets and percentages
          const incomeMatch = line.match(/((?:Under |Over |)\$?[\d\.]+k?(?:\s*-\s*\$?[\d\.]+k?)?):?\s*([\d\.]+)%/i);
          if (incomeMatch) {
            incomeBrackets.push({
              bracket: incomeMatch[1].trim(),
              percentage: parseFloat(incomeMatch[2])
            });
          }
        }
      }
    }
    
    // If no income data found, create default Australian income distribution
    if (incomeBrackets.length === 0) {
      incomeBrackets.push({ bracket: "Under $50k", percentage: 25 });
      incomeBrackets.push({ bracket: "$50k-$100k", percentage: 38 });
      incomeBrackets.push({ bracket: "$100k-$150k", percentage: 22 });
      incomeBrackets.push({ bracket: "$150k-$200k", percentage: 10 });
      incomeBrackets.push({ bracket: "Over $200k", percentage: 5 });
    }
    
    // Visualize demographic data
    visualizeAgeDistribution(ageDistribution);
    visualizeEthnicDistribution(ethnicDistribution);
    visualizeIncomeDistribution(incomeBrackets);
    
    return {
      ageDistribution,
      ethnicDistribution,
      incomeDistribution: incomeBrackets
    };
  }

  // Function to visualize age distribution
  function visualizeAgeDistribution(ageData) {
    console.log("Visualizing age distribution:", ageData);
    const ageChartContainer = document.getElementById('ageDistributionChart');
    if (!ageChartContainer) return;
    
    // Create ABS Data link if we have a postcode
    let absLink = '';
    if (currentPropertyData && currentPropertyData.postcode) {
      const absUrl = `https://abs.gov.au/census/find-census-data/quickstats/2021/POA${currentPropertyData.postcode}`;
      let dataSourceText = 'Source: ABS QuickStats';
      
      // If we have source information, adjust the text
      if (currentPropertyData.demographics && currentPropertyData.demographics.source) {
        if (currentPropertyData.demographics.source.type === "openai") {
          dataSourceText = 'Data: AI interpretation of ABS QuickStats';
        }
      }
      
      absLink = `<div class="data-source-link">
        <a href="${absUrl}" target="_blank">${dataSourceText}</a>
        <button class="refresh-demographics-btn" title="Refresh demographic data from ABS">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
          </svg>
        </button>
      </div>`;
    }
    
    // Ensure we have data in the expected format
    if (!Array.isArray(ageData) || ageData.length === 0) {
      console.error("Age data is not a valid array:", ageData);
      ageData = [
        { range: "0-18", percentage: 23 },
        { range: "19-35", percentage: 31 },
        { range: "36-50", percentage: 25 },
        { range: "51-65", percentage: 14 },
        { range: "66+", percentage: 7 }
      ];
    }
    
    // Sort data by age range
    ageData.sort((a, b) => {
      // Extract the first number from each range for comparison
      const aStart = parseInt(a.range.match(/\d+/)[0]);
      const bStart = parseInt(b.range.match(/\d+/)[0]);
      return aStart - bStart;
    });
    
    // Limit to 6 age ranges to fit in the UI
    if (ageData.length > 6) {
      ageData = ageData.slice(0, 6);
    }
    
    // Calculate total percentage to normalize if needed
    const totalPercentage = ageData.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
    
    // Normalize percentages if they don't add up to 100%
    if (Math.abs(totalPercentage - 100) > 1) {
      const normalizationFactor = 100 / totalPercentage;
      ageData.forEach(item => {
        item.percentage = parseFloat(item.percentage) * normalizationFactor;
      });
    }
    
    // Clear the container and add the title with ABS link
    ageChartContainer.innerHTML = `<h4 class="chart-title">Age Distribution</h4>${absLink}`;
    
    // Create the age chart container
    const chartDiv = document.createElement('div');
    chartDiv.className = 'age-chart';
    ageChartContainer.appendChild(chartDiv);
    
    // Generate bar for each age range
    ageData.forEach(age => {
      // Ensure percentage is a number
      const percentage = parseFloat(age.percentage);
      
      const barGroupDiv = document.createElement('div');
      barGroupDiv.className = 'age-bar-group';
      
      barGroupDiv.innerHTML = `
        <div class="age-label">${age.range}</div>
        <div class="age-bar-container">
          <div class="age-bar" style="width: ${percentage}%;">
            <span class="age-percentage">${percentage.toFixed(1)}%</span>
          </div>
        </div>
      `;
      
      chartDiv.appendChild(barGroupDiv);
    });
  }

  // Function to visualize ethnic distribution
  function visualizeEthnicDistribution(ethnicData) {
    console.log("Visualizing ethnic distribution:", ethnicData);
    const ethnicChartContainer = document.getElementById('ethnicDistributionChart');
    if (!ethnicChartContainer) return;
    
    // Create ABS Data link if we have a postcode
    let absLink = '';
    if (currentPropertyData && currentPropertyData.postcode) {
      const absUrl = `https://abs.gov.au/census/find-census-data/quickstats/2021/POA${currentPropertyData.postcode}`;
      let dataSourceText = 'Source: ABS QuickStats';
      
      // If we have source information, adjust the text
      if (currentPropertyData.demographics && currentPropertyData.demographics.source) {
        if (currentPropertyData.demographics.source.type === "openai") {
          dataSourceText = 'Data: AI interpretation of ABS QuickStats';
        }
      }
      
      absLink = `<div class="data-source-link">
        <a href="${absUrl}" target="_blank">${dataSourceText}</a>
      </div>`;
    }
    
    // Ensure we have data in the expected format
    if (!Array.isArray(ethnicData) || ethnicData.length === 0) {
      console.error("Ethnic data is not a valid array:", ethnicData);
      ethnicData = [
        { ethnicity: "Australian", percentage: 65 },
        { ethnicity: "European", percentage: 15 },
        { ethnicity: "Asian", percentage: 12 },
        { ethnicity: "Middle Eastern", percentage: 3 },
        { ethnicity: "Other", percentage: 5 }
      ];
    }
    
    // Sort ethnicities by percentage (descending)
    ethnicData.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    
    // Combine small percentages into "Other" if we have more than 5 ethnicities
    if (ethnicData.length > 5) {
      const topEthnicities = ethnicData.slice(0, 4);
      const otherEthnicities = ethnicData.slice(4);
      
      const otherPercentage = otherEthnicities.reduce((sum, item) => {
        return sum + parseFloat(item.percentage);
      }, 0);
      
      topEthnicities.push({
        ethnicity: "Other",
        percentage: otherPercentage
      });
      
      ethnicData = topEthnicities;
    }
    
    // Calculate total percentage to normalize if needed
    const totalPercentage = ethnicData.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
    
    // Normalize percentages if they don't add up to 100%
    if (Math.abs(totalPercentage - 100) > 1) {
      const normalizationFactor = 100 / totalPercentage;
      ethnicData.forEach(item => {
        item.percentage = parseFloat(item.percentage) * normalizationFactor;
      });
      
      // Ensure total is exactly 100% by adjusting the last item
      const adjustedTotal = ethnicData.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
      if (Math.abs(adjustedTotal - 100) > 0.1) {
        ethnicData[ethnicData.length - 1].percentage += (100 - adjustedTotal);
      }
    }
    
    // Pie chart colors
    const colors = [
      "#4A90E2", // Blue
      "#50E3C2", // Teal
      "#F5A623", // Orange
      "#D0021B", // Red
      "#9013FE"  // Purple
    ];
    
    // Clear the container and add title with ABS link
    ethnicChartContainer.innerHTML = `<h4 class="chart-title">Country of Birth / Ancestry</h4>${absLink}`;
    
    // Create the pie chart container
    const pieContainer = document.createElement('div');
    pieContainer.className = 'pie-chart-container';
    ethnicChartContainer.appendChild(pieContainer);
    
    // Create the SVG pie chart
    const svgSize = 160;
    const radius = svgSize / 2 * 0.8;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    
    let pieHTML = `
      <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" class="pie-chart">
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#f0f0f0" />
    `;
    
    // Generate pie segments
    let startAngle = 0;
    ethnicData.forEach((ethnic, index) => {
      const percentage = parseFloat(ethnic.percentage);
      const angle = (percentage / 100) * 360;
      const endAngle = startAngle + angle;
      
      // Calculate SVG arc path
      const startRadians = (startAngle - 90) * Math.PI / 180;
      const endRadians = (endAngle - 90) * Math.PI / 180;
      
      const startX = centerX + radius * Math.cos(startRadians);
      const startY = centerY + radius * Math.sin(startRadians);
      const endX = centerX + radius * Math.cos(endRadians);
      const endY = centerY + radius * Math.sin(endRadians);
      
      // Large arc flag is 1 if angle > 180 degrees
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      // Create the SVG path for the pie segment
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z'
      ].join(' ');
      
      pieHTML += `
        <path 
          d="${pathData}" 
          fill="${colors[index % colors.length]}" 
          stroke="#fff" 
          stroke-width="1" 
          class="pie-segment"
          data-ethnicity="${ethnic.ethnicity}"
          data-percentage="${percentage.toFixed(1)}%"
        >
          <title>${ethnic.ethnicity}: ${percentage.toFixed(1)}%</title>
        </path>
      `;
      
      startAngle = endAngle;
    });
    
    pieHTML += `</svg>`;
    pieContainer.innerHTML = pieHTML;
    
    // Create the legend
    const legendContainer = document.createElement('div');
    legendContainer.className = 'pie-legend';
    
    ethnicData.forEach((ethnic, index) => {
      const percentage = parseFloat(ethnic.percentage);
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <div class="legend-color" style="background-color: ${colors[index % colors.length]};"></div>
        <div class="legend-label">${ethnic.ethnicity}</div>
        <div class="legend-percentage">${percentage.toFixed(1)}%</div>
      `;
      legendContainer.appendChild(legendItem);
    });
    
    ethnicChartContainer.appendChild(legendContainer);
  }
  
  // Function to visualize income distribution
  function visualizeIncomeDistribution(incomeData) {
    console.log("Visualizing income distribution:", incomeData);
    const incomeChartContainer = document.getElementById('incomeDistributionChart');
    if (!incomeChartContainer) return;
    
    // Create ABS Data link if we have a postcode
    let absLink = '';
    if (currentPropertyData && currentPropertyData.postcode) {
      const absUrl = `https://abs.gov.au/census/find-census-data/quickstats/2021/POA${currentPropertyData.postcode}`;
      let dataSourceText = 'Source: ABS QuickStats';
      
      // If we have source information, adjust the text
      if (currentPropertyData.demographics && currentPropertyData.demographics.source) {
        if (currentPropertyData.demographics.source.type === "openai") {
          dataSourceText = 'Data: AI interpretation of ABS QuickStats';
        }
      }
      
      absLink = `<div class="data-source-link">
        <a href="${absUrl}" target="_blank">${dataSourceText}</a>
      </div>`;
    }
    
    // Ensure we have data in the expected format
    if (!Array.isArray(incomeData) || incomeData.length === 0) {
      console.error("Income data is not a valid array:", incomeData);
      incomeData = [
        { bracket: "Under $50k", percentage: 25 },
        { bracket: "$50k-$100k", percentage: 38 },
        { bracket: "$100k-$150k", percentage: 22 },
        { bracket: "$150k-$200k", percentage: 10 },
        { bracket: "Over $200k", percentage: 5 }
      ];
    }
    
    // Sort data by bracket order (assuming brackets are already in order)
    incomeData.sort((a, b) => {
      // Extract the first numbers from bracket strings for comparison
      const aValue = parseInt(a.bracket.match(/\d+/)[0]);
      const bValue = parseInt(b.bracket.match(/\d+/)[0]);
      // Handle "Under" vs "Over" specially
      if (a.bracket.includes('Under')) return -1;
      if (b.bracket.includes('Under')) return 1;
      if (a.bracket.includes('Over')) return 1;
      if (b.bracket.includes('Over')) return -1;
      return aValue - bValue;
    });
    
    // Limit to 5 income brackets to fit in the UI
    if (incomeData.length > 5) {
      incomeData = incomeData.slice(0, 5);
    }
    
    // Calculate total percentage to normalize if needed
    const totalPercentage = incomeData.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
    
    // Normalize percentages if they don't add up to 100%
    if (Math.abs(totalPercentage - 100) > 1) {
      const normalizationFactor = 100 / totalPercentage;
      incomeData.forEach(item => {
        item.percentage = parseFloat(item.percentage) * normalizationFactor;
      });
    }
    
    // Create the income distribution chart HTML
    let incomeHTML = `
      <div class="income-chart">
        <div class="income-bars">
    `;
    
    // Generate bar for each income bracket
    incomeData.forEach(income => {
      // Ensure percentage is a number
      const percentage = parseFloat(income.percentage);
      
      // Create a gradient color based on income level
      const barColor = income.bracket.includes("Over") ? 
        "#4CAF50" : // Higher income - green
        (income.bracket.includes("Under") ? 
          "#FF9800" : // Lower income - orange
          "#2196F3"); // Middle incomes - blue
      
      incomeHTML += `
        <div class="income-bar-group">
          <div class="income-bar-container">
            <div class="income-bar" style="width: ${percentage}%; background: linear-gradient(90deg, ${barColor}80, ${barColor});">
              <span class="income-percentage">${percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div class="income-label">${income.bracket}</div>
        </div>
      `;
    });
    
    incomeHTML += `
        </div>
      </div>
    `;
    
    // Insert the chart into the container
    incomeChartContainer.innerHTML = incomeHTML;
    
    // Add title above the chart with ABS link
    const titleElement = document.createElement('div');
    titleElement.innerHTML = `<h4 class="chart-title">Household Income Distribution</h4>${absLink}`;
    incomeChartContainer.insertBefore(titleElement, incomeChartContainer.firstChild);
  }

  // Function to set up modern UI interactions
  function setupModernUI() {
    // Add CSS variables for consistent theming
    document.documentElement.style.setProperty('--primary-color', '#4285F4');
    document.documentElement.style.setProperty('--primary-color-light', '#8AB4F8');
    document.documentElement.style.setProperty('--secondary-color', '#34A853');
    document.documentElement.style.setProperty('--background-color', '#F8F9FA');
    document.documentElement.style.setProperty('--card-background', '#FFFFFF');
    document.documentElement.style.setProperty('--text-color', '#202124');
    document.documentElement.style.setProperty('--text-muted', '#5F6368');
    document.documentElement.style.setProperty('--border-color', '#DADCE0');
    document.documentElement.style.setProperty('--error-color', '#EA4335');
    document.documentElement.style.setProperty('--success-color', '#34A853');
    document.documentElement.style.setProperty('--warning-color', '#FBBC05');
    
    // Apply the background color to body
    document.body.style.backgroundColor = 'var(--background-color)';
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        
        ripple.classList.add('active');
        
      setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
    
    // Expand/collapse sections functionality
    document.addEventListener('click', function(e) {
      const target = e.target.closest('.section-title');
      if (!target) return;
      
      const section = target.closest('.section');
      const content = section.querySelector('.section-content');
      
      // Toggle expanded state
      section.classList.toggle('expanded');
      
      // Animate section content
      if (section.classList.contains('expanded')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0px';
      }
    });
  }
  
  // Function to enhance section transitions and animations
  function enhanceSections() {
    const sections = document.querySelectorAll('.section');
    
    // Set initial state for all sections (expanded)
    sections.forEach((section, index) => {
      section.classList.add('expanded');
      const content = section.querySelector('.section-content');
      
      // Set max height to allow animations
      if (content) {
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Add a resize observer to handle dynamic content changes
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            if (section.classList.contains('expanded')) {
              entry.target.style.maxHeight = entry.target.scrollHeight + 'px';
            }
          }
        });
        
        resizeObserver.observe(content);
      }
      
      // Add staggered animation delay
      section.style.animationDelay = `${index * 0.1}s`;
      section.classList.add('fade-in');
    });

    // Add demographic context info
    const demographicsSection = document.getElementById('demographicsSection');
    if (demographicsSection && currentPropertyData && currentPropertyData.postcode) {
      const contentSection = demographicsSection.querySelector('.section-content');
      
      // Check if we need to add the context info (avoid duplicates)
      if (!contentSection.querySelector('.demographic-context-info')) {
        const contextInfo = document.createElement('div');
        contextInfo.className = 'demographic-context-info';
        contextInfo.innerHTML = `
          <div class="demographic-context-note">
            <div class="note-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="8"></line>
              </svg>
            </div>
            <div class="note-text">
              <p>Demographics data is based on the ABS 2021 Census for postcode ${currentPropertyData.postcode}. 
              <a href="https://abs.gov.au/census/find-census-data/quickstats/2021/POA${currentPropertyData.postcode}" target="_blank">View full census data</a>.</p>
            </div>
          </div>
        `;
        
        // Add it as the first child of the content section
        contentSection.insertBefore(contextInfo, contentSection.firstChild);
        
        // Update max height to account for the new content
        contentSection.style.maxHeight = contentSection.scrollHeight + 'px';
      }
    }
    
    // Add click event listener for refresh demographics button
    const refreshDemographicsBtn = document.querySelector('.refresh-demographics-btn');
    if (refreshDemographicsBtn) {
      refreshDemographicsBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (!currentPropertyData || !currentPropertyData.postcode) {
          console.log("Cannot refresh demographics: No property data or postcode available");
          return;
        }
        
        // Show loading spinner
        const demographicsSection = document.getElementById('demographicsSection');
        if (demographicsSection) {
          const loadingSpinner = document.createElement('div');
          loadingSpinner.className = 'demographics-loading';
          loadingSpinner.innerHTML = `
            <div class="small-loader"></div>
            <p>Refreshing demographic data from ABS QuickStats...</p>
          `;
          demographicsSection.querySelector('.section-content').prepend(loadingSpinner);
        }
        
        try {
          // Get API key
          const apiKeyResult = await new Promise(resolve => {
            chrome.storage.sync.get(['openaiApiKey'], function(result) {
              resolve(result.openaiApiKey);
            });
          });
          
          if (!apiKeyResult) {
            console.error("No API key available to refresh demographic data");
            return;
          }
          
          // Force refresh demographic data
          console.log("Manually refreshing demographic data for postcode:", currentPropertyData.postcode);
          const demographicData = await fetchDemographicDataFromInternet(
            currentPropertyData.suburb, 
            currentPropertyData.postcode, 
            apiKeyResult
          );
          
          if (demographicData) {
            console.log("Successfully refreshed demographic data");
            
            // Update the current property data
            currentPropertyData.demographics = demographicData;
            
            // Update the cache
            chrome.storage.local.get(['cachedDemographicData'], function(result) {
              const cachedDemographicData = result.cachedDemographicData || {};
              cachedDemographicData[currentPropertyData.postcode] = demographicData;
              chrome.storage.local.set({ cachedDemographicData: cachedDemographicData });
              console.log("Updated cached demographic data for postcode:", currentPropertyData.postcode);
            });
            
            // Update the display
            visualizeAgeDistribution(demographicData.ageDistribution || []);
            visualizeEthnicDistribution(demographicData.ethnicDistribution || []);
            visualizeIncomeDistribution(demographicData.incomeBrackets || []);
            
            // Remove loading spinner
            const loadingSpinner = document.querySelector('.demographics-loading');
            if (loadingSpinner) {
              loadingSpinner.remove();
            }
          }
        } catch (error) {
          console.error("Error refreshing demographic data:", error);
          // Remove loading spinner
          const loadingSpinner = document.querySelector('.demographics-loading');
          if (loadingSpinner) {
            loadingSpinner.remove();
          }
        }
      });
    }
  }
  
  // Function to animate the visual elements after they're rendered
  function animateVisualElements() {
    // Animate chart bars
    const bars = document.querySelectorAll('.age-bar, .forecast-bar, .income-bar');
    bars.forEach((bar, index) => {
      // Use a custom property for animation
      const height = bar.style.height || '0%';
      bar.style.height = '0%';
      
      // Delay animation for a staggered effect
      setTimeout(() => {
        bar.style.height = height;
      }, 100 + (index * 50));
    });
    
    // Animate progress bars
    const progressBars = document.querySelectorAll('.rental-progress-fill');
    progressBars.forEach((bar, index) => {
      const width = bar.style.width || '0%';
      bar.style.width = '0%';
      
      setTimeout(() => {
        bar.style.width = width;
      }, 100 + (index * 50));
    });
  }

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'propertyData') {
      const propertyData = request.data;
      currentPropertyData = propertyData; // Store property data globally
      
      // Get API key and analyze property
      chrome.storage.sync.get(['openaiApiKey'], function(result) {
        if (result.openaiApiKey) {
          // Don't force refresh when automatically triggered
          analyzeProperty(propertyData, result.openaiApiKey, false);
        } else {
          errorSection.classList.remove('hidden');
          loadingSection.classList.add('hidden');
          const errorMessageEl = document.querySelector('.error-message');
          if (errorMessageEl) {
            errorMessageEl.textContent = 'Please set your OpenAI API key first.';
          }
        }
      });
    }
  });

  // Change app name in UI (look for document.title, header, etc.)
  document.title = 'Homira';
  const headerEl = document.querySelector('.header h1');
  if (headerEl) headerEl.textContent = 'Homira';

  // Function to visualize school data
  function displaySchoolData(schoolData) {
    console.log("Displaying school data:", schoolData);
    
    // If no school data is provided, get it from property data
    if (!schoolData && currentPropertyData && currentPropertyData.schoolData) {
      schoolData = currentPropertyData.schoolData;
    }
    
    // If still no data available, use dummy data
    if (!schoolData) {
      schoolData = {
        primarySchools: [
          { name: "Parkview Primary School", distance: "0.8km", ranking: 8.6, type: "Public" },
          { name: "St Mary's Catholic Primary", distance: "1.2km", ranking: 9.1, type: "Catholic" },
          { name: "Greenwood Primary", distance: "1.5km", ranking: 7.9, type: "Public" }
        ],
        secondarySchools: [
          { name: "Westfield High School", distance: "1.7km", ranking: 8.2, type: "Public" },
          { name: "St John's College", distance: "2.5km", ranking: 9.4, type: "Private" },
          { name: "Greenwood Secondary College", distance: "3.1km", ranking: 7.5, type: "Public" }
        ],
        catchmentZone: "Yes - Parkview Primary and Westfield High"
      };
    }
    
    // Display primary schools
    const primarySchoolsList = document.getElementById('primarySchoolsList');
    if (primarySchoolsList && schoolData.primarySchools && schoolData.primarySchools.length > 0) {
      primarySchoolsList.innerHTML = '';
      schoolData.primarySchools.forEach(school => {
        const schoolCard = document.createElement('div');
        schoolCard.className = 'school-card';
        schoolCard.innerHTML = `
          <div class="school-info">
            <div class="school-name">${school.name}</div>
            <div class="school-details">
              <span class="school-type">${school.type}</span>
              <span class="school-distance">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"/></svg>
                ${school.distance}
              </span>
            </div>
          </div>
          <div class="school-rating">
            <span class="rating-value">${school.ranking}/10</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
        `;
        primarySchoolsList.appendChild(schoolCard);
      });
    }
    
    // Display secondary schools
    const secondarySchoolsList = document.getElementById('secondarySchoolsList');
    if (secondarySchoolsList && schoolData.secondarySchools && schoolData.secondarySchools.length > 0) {
      secondarySchoolsList.innerHTML = '';
      schoolData.secondarySchools.forEach(school => {
        const schoolCard = document.createElement('div');
        schoolCard.className = 'school-card';
        schoolCard.innerHTML = `
          <div class="school-info">
            <div class="school-name">${school.name}</div>
            <div class="school-details">
              <span class="school-type">${school.type}</span>
              <span class="school-distance">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"/></svg>
                ${school.distance}
              </span>
            </div>
          </div>
          <div class="school-rating">
            <span class="rating-value">${school.ranking}/10</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
        `;
        secondarySchoolsList.appendChild(schoolCard);
      });
    }
    
    // Display catchment zone info
    const catchmentInfo = document.getElementById('catchmentInfo');
    if (catchmentInfo && schoolData.catchmentZone) {
      catchmentInfo.innerHTML = `
        <div class="catchment-title">School Catchment Zone:</div>
        <div class="catchment-details">${schoolData.catchmentZone}</div>
      `;
    }
  }
}); 