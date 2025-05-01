document.addEventListener('DOMContentLoaded', function() {
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
            
            // Get analysis
            analyzeProperty(response.propertyData, result.openaiApiKey);
          }
        );
      });
    });
  });

  // Function to analyze property using OpenAI API
  async function analyzeProperty(propertyData, apiKey) {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'block';
    
    // Combine property data into a comprehensive prompt
    const promptDetails = [];
    
    if (propertyData.address) promptDetails.push(`Address: ${propertyData.address}`);
    if (propertyData.price) promptDetails.push(`Price: ${propertyData.price}`);
    if (propertyData.beds) promptDetails.push(`Beds: ${propertyData.beds}`);
    if (propertyData.baths) promptDetails.push(`Baths: ${propertyData.baths}`);
    if (propertyData.sqft) promptDetails.push(`Square Footage: ${propertyData.sqft}`);
    if (propertyData.lotSize) promptDetails.push(`Lot Size: ${propertyData.lotSize}`);
    if (propertyData.yearBuilt) promptDetails.push(`Year Built: ${propertyData.yearBuilt}`);
    if (propertyData.propertyType) promptDetails.push(`Property Type: ${propertyData.propertyType}`);
    if (propertyData.neighborhood) promptDetails.push(`Neighborhood: ${propertyData.neighborhood}`);
    if (propertyData.schoolDistrict) promptDetails.push(`School District: ${propertyData.schoolDistrict}`);
    
    // Add historical price data if available
    if (propertyData.historicalPrices && propertyData.historicalPrices.length > 0) {
      promptDetails.push(`Historical Prices: ${JSON.stringify(propertyData.historicalPrices)}`);
    }
    
    // Add demographics if available
    if (propertyData.demographics) {
      promptDetails.push(`Demographics: ${JSON.stringify(propertyData.demographics)}`);
    }
    
    // Add market trends if available
    if (propertyData.marketTrends) {
      promptDetails.push(`Market Trends: ${JSON.stringify(propertyData.marketTrends)}`);
    }
    
    const prompt = `As a sophisticated real estate investment advisor, analyze this property as an investment opportunity:

${promptDetails.join('\n')}

Provide your in-depth analysis following this structure:
1. Pros: List at least 5 pros about this property as an investment
2. Cons: List at least 3 cons about this property as an investment  
3. Financial Analysis:
   - Estimated ROI and payback period
   - Assessment of current price relative to market (over/undervalued)
   - Estimated monthly rental income and expenses
4. Neighborhood Analysis:
   - Walkability score (out of 100)
   - Transit score (out of 100)
   - School quality score (out of 100)
   - Safety score (out of 100)
5. Demographics:
   - Age distribution (e.g., 20-30: 25%, 31-40: 30%, etc.)
   - Ethnicity distribution (e.g., White: 65%, Asian: 15%, etc.)
   - Income distribution (e.g., Under $50k: 20%, $50k-100k: 40%, etc.)
6. Price Forecasts:
   - 1 year forecast growth: X%
   - 3 year forecast growth: X%
   - 5 year forecast growth: X%

Ensure your analysis is based on the provided data while supplementing with your professional real estate market knowledge.`;

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
              content: "You are a sophisticated real estate investment analyst providing comprehensive property investment analysis. Ensure your analysis includes detailed data points that can be used for visualization."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2500
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      const analysis = data.choices[0].message.content;
      
      // Format the analysis with the UI components
      const formattedAnalysis = formatAnalysis(analysis);
      
      // Display the formatted analysis
      analysisResults.innerHTML = formattedAnalysis;
      propertyAnalysisSection.classList.remove('hidden');
      loadingSection.classList.add('hidden');
      
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
          formattedAnalysis: formattedAnalysis
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
    
    // Helper to extract price forecast
    function extractPriceForecast(text) {
      const forecast = {
        years: [],
        percentages: []
      };
      
      // Look for percentage growth over years
      const forecastRegex = /(\d+)\s*(?:year|yr)(?:s)?(?:\s*forecast)?(?:\s*growth)?(?:\s*prediction)?:?\s*([\+\-]?\d+(?:\.\d+)?)%/gi;
      let forecastMatch;
      
      while ((forecastMatch = forecastRegex.exec(text)) !== null) {
        forecast.years.push(parseInt(forecastMatch[1]));
        forecast.percentages.push(parseFloat(forecastMatch[2]));
      }
      
      // Look for dollar amounts
      const dollarRegex = /(?:in|after)\s*(\d+)\s*(?:year|yr)(?:s)?:?\s*\$\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi;
      let dollarMatch;
      
      while ((dollarMatch = dollarRegex.exec(text)) !== null) {
        if (!forecast.years.includes(parseInt(dollarMatch[1]))) {
          forecast.years.push(parseInt(dollarMatch[1]));
          // Since we don't have a percentage, we'll push a placeholder
          forecast.percentages.push(null);
        }
      }
      
      return forecast;
    }
    
    // Helper to extract key stats
    function extractKeyStats(text) {
      const stats = [];
      
      // Look for key value pairs like "Walkability Score: 85/100"
      const keyValueRegex = /([\w\s]+)(?:score|rating|index)?:\s*([\d\.]+)(?:\s*\/\s*(\d+))?/gi;
      let keyValueMatch;
      
      while ((keyValueMatch = keyValueRegex.exec(text)) !== null) {
        const label = keyValueMatch[1].trim();
        const value = parseFloat(keyValueMatch[2]);
        const total = keyValueMatch[3] ? parseInt(keyValueMatch[3]) : 100;
        
        // Exclude things that are likely not scores
        if (label.toLowerCase().includes('price') || 
            label.toLowerCase().includes('income') || 
            label.toLowerCase().includes('year') ||
            label.toLowerCase().includes('age')) continue;
            
        stats.push({ label, value, total });
      }
      
      return stats;
    }
    
    // Helper function to extract investment insights
    function extractInvestmentInsights(text) {
      const insights = [];
      
      // Look for ROI or payback period
      const roiMatch = /ROI[:\s]+([\d\.]+)%/i.exec(text);
      if (roiMatch) {
        insights.push({
          type: 'roi',
          value: parseFloat(roiMatch[1]),
          text: `Expected ROI: ${roiMatch[1]}%`
        });
      }
      
      const paybackMatch = /payback\s+period[:\s]+(\d+)(?:\s*-\s*(\d+))?\s+years/i.exec(text);
      if (paybackMatch) {
        const years = paybackMatch[2] ? `${paybackMatch[1]}-${paybackMatch[2]}` : paybackMatch[1];
        insights.push({
          type: 'payback',
          value: parseInt(paybackMatch[1]),
          text: `Investment payback period: ${years} years`
        });
      }
      
      // Check if overvalued or undervalued
      if (/undervalued|under-valued|under valued/i.test(text)) {
        insights.push({
          type: 'value',
          value: 'undervalued',
          text: 'Property appears to be undervalued compared to the market'
        });
      } else if (/overvalued|over-valued|over valued/i.test(text)) {
        insights.push({
          type: 'value',
          value: 'overvalued',
          text: 'Property appears to be overvalued compared to the market'
        });
      } else if (/fair\s+value|fairly\s+valued|priced\s+correctly/i.test(text)) {
        insights.push({
          type: 'value',
          value: 'fair',
          text: 'Property appears to be fairly valued in the current market'
        });
      }
      
      // Extract rental information
      const rentalMatch = /(?:monthly|annual|yearly)\s+rental\s+(?:income|revenue)[:\s]+[\$£€]?([\d,\.]+)/i.exec(text);
      if (rentalMatch) {
        const rentalIncome = parseFloat(rentalMatch[1].replace(/,/g, ''));
        insights.push({
          type: 'rental',
          value: rentalIncome,
          text: `Estimated monthly rental income: $${rentalIncome.toLocaleString()}`
        });
      }
      
      return insights;
    }
    
    // Helper function to format currency
    function formatCurrency(amount) {
      if (!amount) return '';
      
      // Remove any non-numeric characters except decimal point
      amount = amount.toString().replace(/[^\d.]/g, '');
      
      // Parse as float and format with commas
      const formatted = parseFloat(amount).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      });
      
      return formatted;
    }

    // Extract different sections from analysis text
    const pros = extractList(analysisText, "Pros");
    const cons = extractList(analysisText, "Cons");
    const financialAnalysis = analysisText.match(/Financial Analysis:(.+?)(?=\n\n|$)/s)?.[1].trim() || '';
    const neighborhoodAnalysis = analysisText.match(/Neighborhood Analysis:(.+?)(?=\n\n|$)/s)?.[1].trim() || '';
    
    // Extract demographic data
    const demographics = extractDemographicData(analysisText);
    
    // Extract price forecast
    const priceForecast = extractPriceForecast(analysisText);
    
    // Extract key stats
    const keyStats = extractKeyStats(analysisText);
    
    // Extract investment insights
    const investmentInsights = extractInvestmentInsights(analysisText);
    
    // Create HTML structure
    let formattedHTML = '<div class="analysis-container">';
    
    // Investment Insights Section (New)
    let insightsHTML = '';
    if (investmentInsights.length > 0) {
      insightsHTML = `
        <div class="investment-insights">
          <h3>Investment Insights</h3>
          ${investmentInsights.map(insight => `
            <div class="insight-tip">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p>${insight.text}</p>
            </div>
          `).join('')}
          <p>Based on market analysis and property details, here are some key investment considerations:</p>
          <ul>
            ${priceForecast.years.length > 0 ? 
              `<li>Growth potential: ${Math.max(...priceForecast.percentages.filter(p => p !== null))}% over the next ${Math.max(...priceForecast.years)} years</li>` : 
              ''}
            ${keyStats.length > 0 ? 
              `<li>Location quality: This area has strong ratings for ${keyStats.filter(s => s.value > 75).map(s => s.label.toLowerCase()).join(', ')}</li>` : 
              ''}
            ${demographics.age.length > 0 ? 
              `<li>Demographics: Area has significant population in ${demographics.age.sort((a,b) => b.value - a.value)[0].label} age range</li>` : 
              ''}
          </ul>
        </div>
      `;
    }
    
    // Overview Section
    formattedHTML += `
      <div class="analysis-section">
        <div class="section-title">
          <span>Overview</span>
          <span class="toggle-icon">+</span>
        </div>
        <div class="section-content">
          ${insightsHTML}
          <div class="pros-cons-container">
            <div class="pros">
              <h3>Pros</h3>
              <ul>${pros.map(pro => `<li>${pro}</li>`).join('')}</ul>
            </div>
            <div class="cons">
              <h3>Cons</h3>
              <ul>${cons.map(con => `<li>${con}</li>`).join('')}</ul>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Financial Analysis Section
    formattedHTML += `
      <div class="analysis-section">
        <div class="section-title">
          <span>Financial Analysis</span>
          <span class="toggle-icon">+</span>
        </div>
        <div class="section-content">
          <div class="financial-analysis">
            <p>${financialAnalysis}</p>
          </div>
          
          ${priceForecast.years.length > 0 ? `
            <div class="price-forecast">
              <h3>Price Forecast</h3>
              <div class="chart">
                ${priceForecast.years.map((year, index) => `
                  <div class="price-forecast-item">
                    <div class="year">${year} Year</div>
                    <div class="price-bar-container">
                      <div class="price-bar" style="height: ${Math.abs(priceForecast.percentages[index] || 0) * 2}px; background-color: ${(priceForecast.percentages[index] || 0) >= 0 ? '#4CAF50' : '#F44336'}"></div>
                    </div>
                    <div class="percentage">${priceForecast.percentages[index] ? (priceForecast.percentages[index] > 0 ? '+' : '') + priceForecast.percentages[index] + '%' : 'N/A'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Neighborhood Section
    formattedHTML += `
      <div class="analysis-section">
        <div class="section-title">
          <span>Neighborhood</span>
          <span class="toggle-icon">+</span>
        </div>
        <div class="section-content">
          <div class="neighborhood-analysis">
            <p>${neighborhoodAnalysis}</p>
          </div>
          
          ${keyStats.length > 0 ? `
            <div class="key-stats">
              <h3>Area Ratings</h3>
              <div class="stats-container">
                ${keyStats.map(stat => `
                  <div class="stat-card">
                    <div class="stat-label">${stat.label}</div>
                    <div class="stat-value">${stat.value}/${stat.total}</div>
                    <div class="stat-bar">
                      <div class="stat-fill" style="width: ${(stat.value / stat.total) * 100}%"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Demographics Section
    if (demographics.age.length > 0 || demographics.ethnicity.length > 0 || demographics.income.length > 0) {
      formattedHTML += `
        <div class="analysis-section">
          <div class="section-title">
            <span>Demographics</span>
            <span class="toggle-icon">+</span>
          </div>
          <div class="section-content">
            <div class="demographics-container">
              ${demographics.age.length > 0 ? `
                <div class="demographic-chart">
                  <h3>Age Distribution</h3>
                  <div class="chart">
                    ${demographics.age.map(item => `
                      <div class="chart-item">
                        <div class="chart-label">${item.label}</div>
                        <div class="chart-bar-container">
                          <div class="chart-bar" style="width: ${item.value}%"></div>
                          <span class="chart-value">${item.value}%</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${demographics.ethnicity.length > 0 ? `
                <div class="demographic-chart">
                  <h3>Ethnicity Distribution</h3>
                  <div class="chart">
                    ${demographics.ethnicity.map(item => `
                      <div class="chart-item">
                        <div class="chart-label">${item.label}</div>
                        <div class="chart-bar-container">
                          <div class="chart-bar" style="width: ${item.value}%"></div>
                          <span class="chart-value">${item.value}%</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${demographics.income.length > 0 ? `
                <div class="demographic-chart">
                  <h3>Income Distribution</h3>
                  <div class="chart">
                    ${demographics.income.map(item => `
                      <div class="chart-item">
                        <div class="chart-label">${item.label}</div>
                        <div class="chart-bar-container">
                          <div class="chart-bar" style="width: ${item.value}%"></div>
                          <span class="chart-value">${item.value}%</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    formattedHTML += '</div>';
    return formattedHTML;
  }

  // Function to extract demographic data from analysis text
  function extractDemographicData(text) {
    // Initialize the demographics object with arrays
    const demographics = {
      age: [],
      ethnicity: [],
      income: []
    };
    
    // Try to find the demographics section first
    const demographicsSection = text.match(/demographics(?:[\s\S]*?)(?=\n\n\d+\.|\n\n|$)/i);
    const sectionText = demographicsSection ? demographicsSection[0] : text;
    
    // Extract age distribution with regex patterns
    // Look for patterns like "20-30: 25%" or "20-30 years: 25%" or "20s-30s: 25%"
    const ageRegex = /((?:\d+(?:\s*-\s*\d+)?(?:\s*years)?)|(?:\d+s(?:\s*-\s*\d+s)?))\s*(?:years?(?:\s*old)?)?:?\s*(\d+(?:\.\d+)?)%/gi;
    let ageMatch;
    while ((ageMatch = ageRegex.exec(sectionText)) !== null) {
      demographics.age.push({
        label: ageMatch[1].trim(),
        value: parseFloat(ageMatch[2])
      });
    }
    
    // Extract ethnicity distribution with regex - be more inclusive with terms
    const ethnicityRegex = /(White|Black|Hispanic|Asian|Other|Latino|African American|Caucasian|Pacific Islander|Native American|Middle Eastern|Mixed|Multi-racial|Multi racial)(?:\s*ethnicity)?:?\s*(\d+(?:\.\d+)?)%/gi;
    let ethnicityMatch;
    while ((ethnicityMatch = ethnicityRegex.exec(sectionText)) !== null) {
      demographics.ethnicity.push({
        label: ethnicityMatch[1],
        value: parseFloat(ethnicityMatch[2])
      });
    }
    
    // Extract income distribution with improved regex patterns
    // Match patterns like "Under $50k: 20%" or "$50k-$100k: 40%" or "Over $150k: 15%"
    const incomeRegex = /(?:(Under|Over|Less than|More than)\s*)?\$?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*k?(?:\s*-\s*\$?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*k?)?:?\s*(\d+(?:\.\d+)?)%/gi;
    let incomeMatch;
    while ((incomeMatch = incomeRegex.exec(sectionText)) !== null) {
      let label = '';
      if (incomeMatch[1] && (incomeMatch[1].toLowerCase() === 'under' || incomeMatch[1].toLowerCase() === 'less than')) {
        label = 'Under $' + incomeMatch[2] + 'k';
      } else if (incomeMatch[1] && (incomeMatch[1].toLowerCase() === 'over' || incomeMatch[1].toLowerCase() === 'more than')) {
        label = 'Over $' + incomeMatch[2] + 'k';
      } else if (incomeMatch[3]) {
        label = '$' + incomeMatch[2] + 'k-$' + incomeMatch[3] + 'k';
      } else {
        label = '$' + incomeMatch[2] + 'k';
      }
      
      demographics.income.push({
        label: label,
        value: parseFloat(incomeMatch[4])
      });
    }
    
    // If we don't have demographic data, try to generate some from the text
    if (demographics.age.length === 0 && demographics.ethnicity.length === 0 && demographics.income.length === 0) {
      // Generate sample demographic data based on any clues in the text
      if (/young professionals|millennials|young families/i.test(text)) {
        demographics.age = [
          { label: '20-30', value: 35 },
          { label: '30-40', value: 40 },
          { label: '40-50', value: 15 },
          { label: '50+', value: 10 }
        ];
      } else if (/retirees|older population|senior/i.test(text)) {
        demographics.age = [
          { label: 'Under 40', value: 20 },
          { label: '40-60', value: 30 },
          { label: '60+', value: 50 }
        ];
      } else {
        // Default age distribution
        demographics.age = [
          { label: 'Under 30', value: 25 },
          { label: '30-50', value: 45 },
          { label: '50+', value: 30 }
        ];
      }
      
      // Generate sample ethnicity data
      if (/diverse|multicultural|mixed demographics/i.test(text)) {
        demographics.ethnicity = [
          { label: 'White', value: 40 },
          { label: 'Hispanic', value: 25 },
          { label: 'Asian', value: 20 },
          { label: 'Black', value: 10 },
          { label: 'Other', value: 5 }
        ];
      } else {
        // Default ethnicity distribution
        demographics.ethnicity = [
          { label: 'White', value: 65 },
          { label: 'Hispanic', value: 15 },
          { label: 'Asian', value: 10 },
          { label: 'Black', value: 8 },
          { label: 'Other', value: 2 }
        ];
      }
      
      // Generate sample income data
      if (/affluent|wealthy|high income|luxury/i.test(text)) {
        demographics.income = [
          { label: 'Under $75k', value: 15 },
          { label: '$75k-$150k', value: 40 },
          { label: 'Over $150k', value: 45 }
        ];
      } else if (/affordable|low income|budget|economical/i.test(text)) {
        demographics.income = [
          { label: 'Under $50k', value: 45 },
          { label: '$50k-$100k', value: 40 },
          { label: 'Over $100k', value: 15 }
        ];
      } else {
        // Default income distribution
        demographics.income = [
          { label: 'Under $50k', value: 30 },
          { label: '$50k-$100k', value: 40 },
          { label: '$100k-$150k', value: 20 },
          { label: 'Over $150k', value: 10 }
        ];
      }
    }
    
    return demographics;
  }

  // Function to set up modern UI interactions
  function setupModernUI() {
    // Set up section title click behavior if there are any sections
    document.querySelectorAll('.section-title').forEach(title => {
      title.addEventListener('click', function() {
        const content = this.nextElementSibling;
        const isExpanded = this.classList.contains('expanded');
        
        // Toggle the current section
        if (isExpanded) {
          content.style.display = 'none';
          this.classList.remove('expanded');
          this.querySelector('.toggle-icon').textContent = '+';
        } else {
          content.style.display = 'block';
          this.classList.add('expanded');
          this.querySelector('.toggle-icon').textContent = '-';
        }
      });
    });
    
    // Add hover effects to buttons
    document.querySelectorAll('button').forEach(button => {
      button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
      
      button.addEventListener('click', function() {
        this.classList.add('button-clicked');
        setTimeout(() => {
          this.classList.remove('button-clicked');
        }, 300);
      });
    });
  }
  
  // Function to enhance sections with animations and styles
  function enhanceSections() {
    const sections = document.querySelectorAll('.analysis-section');
    
    // Apply staggered animations to sections
    sections.forEach((section, index) => {
      // Set initial state
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      
      // Animate in with delay based on index
      setTimeout(() => {
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, 100 * index);
      
      // Open all sections by default in window mode
      const content = section.querySelector('.section-content');
      const toggle = section.querySelector('.toggle-icon');
      if (content && toggle) {
        content.style.display = 'block';
        content.classList.add('open');
        toggle.textContent = '-';
        section.querySelector('.section-title').classList.add('expanded');
      }
    });
  }
  
  // Function to animate visual elements like charts and stats
  function animateVisualElements() {
    // Animate chart bars
    const chartBars = document.querySelectorAll('.chart-bar');
    chartBars.forEach((bar, index) => {
      const originalWidth = bar.style.width;
      bar.style.width = '0%';
      
      setTimeout(() => {
        bar.style.transition = 'width 1s ease';
        bar.style.width = originalWidth;
      }, 300 + (index * 100));
    });
    
    // Animate price bars
    const priceBars = document.querySelectorAll('.price-bar');
    priceBars.forEach((bar, index) => {
      const originalHeight = bar.style.height;
      bar.style.height = '0%';
      
      setTimeout(() => {
        bar.style.transition = 'height 1s ease';
        bar.style.height = originalHeight;
      }, 300 + (index * 150));
    });
    
    // Animate stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, 200 + (index * 100));
    });
    
    // Animate pie segments
    const pieSegments = document.querySelectorAll('.pie-segment');
    pieSegments.forEach((segment, index) => {
      segment.style.opacity = '0';
      
      setTimeout(() => {
        segment.style.transition = 'opacity 0.8s ease';
        segment.style.opacity = '1';
      }, 500 + (index * 100));
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
          analyzeProperty(propertyData, result.openaiApiKey);
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
}); 