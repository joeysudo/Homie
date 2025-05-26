// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPropertyData') {
    try {
      const propertyData = extractPropertyDetails();
      
      // Enhance with additional data
      propertyData.historicalPrices = extractHistoricalPrices();
      propertyData.demographics = extractDemographics();
      propertyData.schoolData = extractSchoolData();
      propertyData.marketTrends = extractMarketTrends();
      
      sendResponse({ propertyData });
    } catch (error) {
      console.error('Error extracting property data:', error);
      sendResponse({ error: 'Failed to extract property data' });
    }
  }
  return true; // Keep the message channel open for asynchronous response
});

// Function to extract property details from the page
function extractPropertyDetails() {
  // Check if we're on a property details page
  const isPropertyPage = window.location.href.includes('/property-') || 
                         window.location.href.includes('/properties/') ||
                         document.querySelector('.property-info');
  
  if (!isPropertyPage) {
    throw new Error('Not a property details page');
  }
  
  // Extract basic property information
  const address = extractAddress();
  const price = extractPrice();
  const bedrooms = extractBedrooms();
  const bathrooms = extractBathrooms();
  const parkingSpaces = extractParkingSpaces();
  const propertyType = extractPropertyType();
  const landSize = extractLandSize();
  
  // Log what we're extracting for debugging purposes
  console.log("Extracted address:", address);
  console.log("Extracted price:", price);
  console.log("Extracted bedrooms:", bedrooms);
  console.log("Extracted bathrooms:", bathrooms);
  console.log("Extracted parking spaces:", parkingSpaces);
  console.log("Extracted property type:", propertyType);
  console.log("Extracted land size:", landSize);
  
  const propertyData = {
    url: window.location.href,
    title: extractText('h1'),
    price: price,
    address: address,
    propertyType: propertyType,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    parkingSpaces: parkingSpaces,
    landSize: landSize,
    description: extractDescription(),
    features: extractFeatures(),
    nearbyAmenities: extractNearbyAmenities(),
    inspectionTimes: extractInspectionTimes(),
    agentDetails: extractAgentDetails(),
    images: extractImages(),
    suburb: extractSuburb(),
    postcode: extractPostcode(),
    lastSoldPrice: extractLastSoldPrice(),
    councilRates: extractCouncilRates(),
    walkScore: extractWalkScore(),
    historicalPrices: extractHistoricalPrices(),
    demographics: extractDemographics(),
    schoolData: extractSchoolData(),
    marketTrends: extractMarketTrends()
  };
  
  return propertyData;
}

// New function to extract historical prices
function extractHistoricalPrices() {
  let history = [];
  
  // Look for price history section or elements
  const priceHistoryElements = document.querySelectorAll(
    '[data-testid="price-history"], [class*="PriceHistory"], [class*="price-history"], [class*="LastSold"]'
  );
  
  priceHistoryElements.forEach(element => {
    // Try to find date and price pairs
    const dateElements = element.querySelectorAll('[data-testid="date"], [class*="date"], .date, time');
    const priceElements = element.querySelectorAll('[data-testid="price"], [class*="price"], .price');
    
    // If we found both date and price elements and they match in count
    if (dateElements.length > 0 && priceElements.length > 0 && dateElements.length === priceElements.length) {
      for (let i = 0; i < dateElements.length; i++) {
        const date = dateElements[i].textContent.trim();
        const price = priceElements[i].textContent.trim();
        if (date && price) {
          history.push({ date, price });
        }
      }
    }
  });
  
  // Look for sale history in property timeline
  const timelineItems = document.querySelectorAll('[class*="Timeline"] li, [class*="timeline"] li, [class*="history-item"]');
  timelineItems.forEach(item => {
    const itemText = item.textContent.trim();
    // Look for date patterns (DD/MM/YYYY or MMM YYYY)
    const dateMatch = itemText.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|[A-Za-z]{3,9}\s+\d{4})/);
    // Look for price patterns ($X,XXX,XXX or $XXX,XXX)
    const priceMatch = itemText.match(/\$\s*[\d,]+(\.\d+)?/);
    
    if (dateMatch && priceMatch) {
      history.push({
        date: dateMatch[0],
        price: priceMatch[0]
      });
    }
  });
  
  // Look for sale price in property description
  const description = document.querySelector('[data-testid="description"], [class*="Description"]');
  if (description) {
    const descText = description.textContent;
    const soldMatches = descText.match(/sold\s+(?:for|at)\s+(\$\s*[\d,]+(\.\d+)?)\s+(?:in|on)\s+([A-Za-z]+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/gi);
    
    if (soldMatches) {
      soldMatches.forEach(match => {
        const priceMatch = match.match(/\$\s*[\d,]+(\.\d+)?/);
        const dateMatch = match.match(/([A-Za-z]+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/);
        
        if (priceMatch && dateMatch) {
          history.push({
            date: dateMatch[0],
            price: priceMatch[0]
          });
        }
      });
    }
  }
  
  // Check for "Last sold" information
  const lastSoldElements = document.querySelectorAll(
    '[data-testid="last-sold"], [class*="LastSold"], [class*="last-sold"]'
  );
  
  lastSoldElements.forEach(element => {
    const elementText = element.textContent;
    const priceMatch = elementText.match(/\$\s*[\d,]+(\.\d+)?/);
    const dateMatch = elementText.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|[A-Za-z]{3,9}\s+\d{4})/);
    
    if (priceMatch && dateMatch) {
      history.push({
        date: dateMatch[0],
        price: priceMatch[0]
      });
    }
  });
  
  // Remove duplicates based on date and price
  const uniqueHistory = [];
  const seen = new Set();
  
  history.forEach(item => {
    const key = `${item.date}-${item.price}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueHistory.push(item);
    }
  });
  
  // Sort by date (most recent first)
  uniqueHistory.sort((a, b) => {
    // Try to parse dates - this handles various formats
    const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, "$2/$1/$3"));
    const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, "$2/$1/$3"));
    
    return dateB - dateA;
  });
  
  return uniqueHistory.length > 0 ? uniqueHistory : [];
}

// New function to extract demographics
function extractDemographics() {
  let demographics = {
    ageDistribution: [],
    ethnicDistribution: [],
    incomeBrackets: []
  };
  
  // Look for age distribution data
  const ageElements = document.querySelectorAll(
    '[data-testid="demographics-age"], [class*="demographic"] [class*="age"], [class*="population-age"]'
  );
  
  if (ageElements.length > 0) {
    ageElements.forEach(element => {
      const ageText = element.textContent.trim();
      
      // Extract age groups and percentages
      const ageMatches = ageText.matchAll(/(\d+-\d+|\d+\+)\s*(?:years?)?:?\s*(\d+(?:\.\d+)?%?)/g);
      for (const match of ageMatches) {
        demographics.ageDistribution.push({
          range: match[1],
          percentage: parseFloat(match[2].replace('%', ''))
        });
      }
    });
  }
  
  // Look for ethnic background data
  const ethnicElements = document.querySelectorAll(
    '[data-testid="demographics-country-of-birth"], [class*="demographic"] [class*="country"], [class*="ethnicity"], [class*="ancestry"]'
  );
  
  if (ethnicElements.length > 0) {
    ethnicElements.forEach(element => {
      const ethnicText = element.textContent.trim();
      
      // Extract ethnicity and percentages
      const ethnicMatches = ethnicText.matchAll(/(Australia|England|China|India|New Zealand|Philippines|[\w\s]+):\s*(\d+(?:\.\d+)?%?)/gi);
      for (const match of ethnicMatches) {
        if (!match[1].includes('%') && !match[1].match(/^\d+$/)) {
          demographics.ethnicDistribution.push({
            ethnicity: match[1].trim(),
            percentage: parseFloat(match[2].replace('%', ''))
          });
        }
      }
    });
  }
  
  // Look for income data
  const incomeElements = document.querySelectorAll(
    '[data-testid="demographics-income"], [class*="demographic"] [class*="income"], [class*="median-income"]'
  );
  
  if (incomeElements.length > 0) {
    incomeElements.forEach(element => {
      const incomeText = element.textContent.trim();
      
      // Extract income brackets and percentages
      const incomeMatches = incomeText.matchAll(/((?:Under |Over |)\$?[\d\.]+k?(?:\s*-\s*\$?[\d\.]+k?)?):?\s*([\d\.]+)%/gi);
      for (const match of incomeMatches) {
        demographics.incomeBrackets.push({
          bracket: match[1].trim(),
          percentage: parseFloat(match[2])
        });
      }
    });
  }
  
  return demographics;
}

// New function to extract school data
function extractSchoolData() {
  try {
    // In a real extension, this would be fetched from an education API or database
    return {
      simulated: true,
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
  } catch (error) {
    console.error("Error extracting school data:", error);
    return { 
      error: "Could not extract school data",
      simulated: true
    };
  }
}

// New function to extract market trends
function extractMarketTrends() {
  try {
    const suburb = extractSuburb();
    
    // In a real extension, this would be fetched from a real estate data API
    return {
      simulated: true,
      medianPrice: "$1,120,000",
      annualGrowth: "7.1%",
      predictedGrowth: {
        oneYear: "4.5%",
        threeYear: "13.8%",
        fiveYear: "22.4%"
      },
      rentalYield: "3.2%",
      averageDaysOnMarket: 28,
      auctionClearanceRate: "68%",
      supplyDemandRatio: "High demand, limited supply",
      propertyMarketCycle: "Growth phase",
      futureDevelopments: "New shopping precinct and transport hub planned within 3km"
    };
  } catch (error) {
    console.error("Error extracting market trends:", error);
    return { 
      error: "Could not extract market trend data",
      simulated: true
    };
  }
}

// New helper function to extract postcode
function extractPostcode() {
  // Try to extract from address
  const address = extractAddress();
  if (address !== 'Address not found') {
    const postcodeMatch = address.match(/\b(\d{4})\b/);
    if (postcodeMatch) {
      return postcodeMatch[1];
    }
  }
  
  // Try to find it elsewhere on the page
  const pageText = document.body.textContent;
  const postcodeMatch = pageText.match(/\bpostcode\s*:?\s*(\d{4})\b/i);
  if (postcodeMatch) {
    return postcodeMatch[1];
  }
  
  return 'Unknown';
}

// New helper function to extract last sold price
function extractLastSoldPrice() {
  // Look for last sold price on the page
  const soldElements = document.querySelectorAll('[data-testid="last-sold"], .last-sold');
  
  for (const element of soldElements) {
    if (element) {
      const text = element.textContent.trim();
      const priceMatch = text.match(/\$([\d,]+)/);
      if (priceMatch) {
        return priceMatch[0];
      }
    }
  }
  
  // Try to find it in the description
  const description = document.querySelector('.property-description__content');
  if (description) {
    const text = description.textContent;
    const lastSoldMatch = text.match(/last\s+sold\s+for\s+\$([\d,]+)/i);
    if (lastSoldMatch) {
      return `$${lastSoldMatch[1]}`;
    }
  }
  
  return 'Not available';
}

// New helper function to extract council rates
function extractCouncilRates() {
  // Try to find council rates in the description or page
  const pageText = document.body.textContent;
  const ratesMatch = pageText.match(/council\s+rates\s*:?\s*\$([\d,\.]+)/i);
  if (ratesMatch) {
    return `$${ratesMatch[1]}`;
  }
  
  return 'Not available';
}

// New helper function to extract walk score
function extractWalkScore() {
  // Look for walk score on page
  const walkScoreElements = document.querySelectorAll('[data-testid="walk-score"], .walk-score');
  
  for (const element of walkScoreElements) {
    if (element) {
      const text = element.textContent.trim();
      const scoreMatch = text.match(/(\d+)\s*\/\s*100/);
      if (scoreMatch) {
        return scoreMatch[1];
      }
    }
  }
  
  return 'Not available';
}

// Helper functions to extract specific data
function extractText(selector, defaultValue = '') {
  const element = document.querySelector(selector);
  return element ? element.textContent.trim() : defaultValue;
}

function extractPrice() {
  // Look for price in several possible locations
  const priceElements = [
    '.property-price',
    '[data-testid="listing-details__summary-title"]',
    '.price',
    '.property-price.property-info__price', // New class structure
    '.property-info__price', // Another possible class
    'span.property-price' // Direct span with class
  ];
  
  for (const selector of priceElements) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Try the new structure observed in the HTML snippet
  const newPriceEl = document.querySelector('span[class*="property-price"]');
  if (newPriceEl && newPriceEl.textContent.trim()) {
    return newPriceEl.textContent.trim();
  }
  
  return 'Price not specified';
}

function extractAddress() {
  // Look for the property-info-address element in the new HTML structure
  const addressElement = document.querySelector('.property-info-address');
  if (addressElement && addressElement.textContent.trim()) {
    return addressElement.textContent.trim();
  }
  
  // Try with the h1 element with class property-info-address
  const h1AddressElement = document.querySelector('h1.property-info-address');
  if (h1AddressElement && h1AddressElement.textContent.trim()) {
    return h1AddressElement.textContent.trim();
  }
  
  // Try with newer structure from the provided HTML
  const modernAddressEl = document.querySelector('.property-info__header h1, .property-info-address');
  if (modernAddressEl && modernAddressEl.textContent.trim()) {
    return modernAddressEl.textContent.trim();
  }

  // Try the new structure observed in the HTML snippet
  const newAddressEl = document.querySelector('[class*="property-info-address"]');
  if (newAddressEl && newAddressEl.textContent.trim()) {
    return newAddressEl.textContent.trim();
  }
  
  return 'Address not found';
}

function extractNumber(selector) {
  const element = document.querySelector(selector);
  if (!element) return 'N/A';
  
  const text = element.textContent.trim();
  const match = text.match(/\d+/);
  return match ? match[0] : 'N/A';
}

function extractLandSize() {
  // UPDATED 2024: Improved land size extraction to handle new realestate.com.au structures
  // This function tries multiple methods to extract land size:
  // 1. Direct DOM selectors
  // 2. Feature list pattern matching
  // 3. ArgonautExchange data extraction (JSON)
  // 4. Description text mining
  // See LAND_SIZE_EXTRACTION.md for detailed documentation
  
  // Try different selectors for land size
  const landSizeSelectors = [
    '[data-testid="property-features-feature-land-size"] .property-features__feature-text',
    '.property-features__feature--land-size .property-features__feature-text',
    '.property-features__land-size .property-features__feature-text',
    '[data-testid="property-features__land-size"]',
    '[class*="landSizeFeature"]',
    '[class*="property-features"] [class*="land"]',
    '[class*="property-features"] [class*="size"]',
    // New selectors based on modern structure
    '[class*="Text_Typography"][aria-label*="land size"]',
    '[class*="Text_Typography"][aria-label*="Land size"]',
    'li[data-testid*="land-size"]',
    'li[data-testid*="Land size"]'
  ];
  
  // Try standard selectors first
  for (const selector of landSizeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Check in property feature elements
  // Look for the modern structure with "Land size" feature
  const featureItems = document.querySelectorAll('li[class*="feature"], li[class*="Feature"], [class*="FeatureListItem"]');
  for (const item of featureItems) {
    const text = item.textContent.toLowerCase();
    if (text.includes('land size') || text.includes('land area') || text.includes('block size')) {
      return item.textContent.replace(/land size|land area|block size/i, '').trim();
    }
  }
  
  // Try to find in the structured data JSON
  try {
    const scriptElements = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scriptElements) {
      const jsonData = JSON.parse(script.textContent);
      if (jsonData && jsonData.floorSize && jsonData.floorSize.value) {
        return `${jsonData.floorSize.value} ${jsonData.floorSize.unitText || ''}`;
      }
    }
  } catch (e) {
    console.log("Error parsing JSON-LD:", e);
  }
  
  // Try to find in ArgonautExchange data (modern realestate.com.au)
  try {
    const scriptElements = document.querySelectorAll('script');
    for (const script of scriptElements) {
      if (script.textContent.includes('window.ArgonautExchange')) {
        const argonautMatch = script.textContent.match(/window\.ArgonautExchange\s*=\s*(\{.+\});/);
        if (argonautMatch) {
          const argonautData = JSON.parse(argonautMatch[1]);
          
          // Navigate through the complex structure to find property features
          if (argonautData && 
              argonautData['resi-property_listing-experience-web'] && 
              argonautData['resi-property_listing-experience-web'].urqlClientCache) {
            
            const urqlData = JSON.parse(argonautData['resi-property_listing-experience-web'].urqlClientCache);
            
            // Find the first key that contains property data
            for (const key in urqlData) {
              if (urqlData[key].data) {
                try {
                  const listingData = JSON.parse(urqlData[key].data);
                  
                  // Check for land size in propertyFeatures
                  if (listingData.details && 
                      listingData.details.listing && 
                      listingData.details.listing.propertyFeatures) {
                    
                    const features = listingData.details.listing.propertyFeatures;
                    for (const feature of features) {
                      if (feature.featureName === "Land size" && feature.value) {
                        // Format: displayValue + sizeUnit (e.g. "336 m²")
                        if (feature.value.displayValue && feature.value.sizeUnit) {
                          return `${feature.value.displayValue} ${feature.value.sizeUnit.displayValue}`;
                        }
                        return feature.value.toString();
                      }
                    }
                  }
                  
                  // Check for land size in propertySizes
                  if (listingData.details && 
                      listingData.details.listing && 
                      listingData.details.listing.propertySizes && 
                      listingData.details.listing.propertySizes.land) {
                    
                    const land = listingData.details.listing.propertySizes.land;
                    if (land.displayValue && land.sizeUnit) {
                      return `${land.displayValue} ${land.sizeUnit.displayValue}`;
                    }
                  }
                } catch (e) {
                  console.log("Error parsing listing data:", e);
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("Error parsing Argonaut data:", e);
  }
  
  // If standard selectors fail, search for elements containing "land", "size", "sqm", "m²" or "acre"
  const featureElements = document.querySelectorAll('[class*="features"], [class*="feature"]');
  for (const element of featureElements) {
    const text = element.textContent.toLowerCase();
    if (text.includes('land') || text.includes('size') || text.includes('sqm') || 
        text.includes('m²') || text.includes('acre')) {
      // Try to extract a number followed by size units
      const match = element.textContent.match(/(\d+[\d,\.]*\s*(?:sqm|m²|acres?|ha))/i);
      if (match) return match[1];
    }
  }
  
  // Look in the description text for land size
  const descriptionText = extractDescription();
  const sizeMatch = descriptionText.match(/(\d+[\d,\.]*\s*(?:sqm|m²|square\s*meters?|acres?|hectares?|ha))/i);
  if (sizeMatch) return sizeMatch[1];
  
  return 'Not specified';
}

function extractPropertyType() {
  // Try looking for the property type in a p.Text_Typography element
  const typographyElement = document.querySelector('p.Text__Typography, p[class*="Text_Typography"]');
  if (typographyElement && typographyElement.textContent.trim()) {
    const text = typographyElement.textContent.trim();
    // Check if it matches a valid property type
    const validPropertyTypes = ['House', 'Townhouse', 'Apartment', 'Unit', 'Villa', 'Land', 'Rural'];
    if (validPropertyTypes.some(type => text.includes(type))) {
      return text;
    }
  }
  
  // Look for a ul with aria-label containing property type info
  const featureUl = document.querySelector('ul[aria-label*="Townhouse"], ul[aria-label*="House"], ul[aria-label*="Apartment"]');
  if (featureUl) {
    const label = featureUl.getAttribute('aria-label');
    const typeMatch = label.match(/(Townhouse|House|Apartment|Unit|Villa|Land|Rural)/i);
    if (typeMatch) {
      return typeMatch[1];
    }
  }
  
  // Try different selectors for property type
  const propertyTypeSelectors = [
    '[data-testid="listing-summary-property-type"]',
    '.property-info__property-type',
    '[class*="propertyType"]',
    '.property-features__property-type'
  ];
  
  for (const selector of propertyTypeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // If we can't find a specific element, try to infer from the page content
  const pageText = document.body.textContent;
  
  // Common property types to look for
  const propertyTypes = [
    'House', 'Apartment', 'Unit', 'Townhouse', 'Villa', 'Land',
    'Rural', 'Acreage', 'Retirement', 'Development', 'Commercial'
  ];
  
  for (const type of propertyTypes) {
    const regex = new RegExp(`\\b${type}\\b`, 'i');
    if (regex.test(pageText)) {
      return type;
    }
  }
  
  // Look for property type in the URL
  if (window.location.href.includes('/house-')) return 'House';
  if (window.location.href.includes('/apartment-')) return 'Apartment';
  if (window.location.href.includes('/unit-')) return 'Unit';
  if (window.location.href.includes('/townhouse-')) return 'Townhouse';
  if (window.location.href.includes('/villa-')) return 'Villa';
  if (window.location.href.includes('/land-')) return 'Land';
  
  return 'Not specified';
}

function extractDescription() {
  // Look for property description
  const descriptionSelectors = [
    '.property-description__content',
    '[data-testid="listing-details__description"]',
    '.description'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return 'No description available';
}

function extractFeatures() {
  // Look for property features
  const features = [];
  const featureSelectors = [
    '.general-features__feature',
    '.property-features__feature',
    '[data-testid="property-features__list-item"]'
  ];
  
  for (const selector of featureSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements && elements.length > 0) {
      elements.forEach(el => {
        const feature = el.textContent.trim();
        if (feature) features.push(feature);
      });
      return features;
    }
  }
  
  return features;
}

function extractNearbyAmenities() {
  // Extract nearby amenities if available
  const amenities = {};
  
  const amenityTypes = ['schools', 'transport', 'shops'];
  
  amenityTypes.forEach(type => {
    const selector = `[data-testid="${type}"]`;
    const section = document.querySelector(selector);
    
    if (section) {
      const items = section.querySelectorAll('li');
      if (items.length > 0) {
        amenities[type] = [];
        items.forEach(item => {
          amenities[type].push(item.textContent.trim());
        });
      }
    }
  });
  
  return Object.keys(amenities).length > 0 ? amenities : 'No nearby amenities information';
}

function extractInspectionTimes() {
  // Extract inspection times if available
  const inspectionSelectors = [
    '.inspection-times',
    '[data-testid="listing-details__inspection"]'
  ];
  
  for (const selector of inspectionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const times = [];
      const timeElements = element.querySelectorAll('li');
      
      if (timeElements.length > 0) {
        timeElements.forEach(el => {
          times.push(el.textContent.trim());
        });
        return times;
      } else {
        return [element.textContent.trim()];
      }
    }
  }
  
  return ['No inspection times listed'];
}

function extractAgentDetails() {
  // Extract agent information
  const agentDetails = {};
  
  // Agent name
  const agentNameSelector = [
    '.agent-info__name',
    '[data-testid="agent-name"]'
  ];
  
  for (const selector of agentNameSelector) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      agentDetails.name = element.textContent.trim();
      break;
    }
  }
  
  // Agency
  const agencySelector = [
    '.agent-info__agency',
    '[data-testid="agent-agency"]'
  ];
  
  for (const selector of agencySelector) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      agentDetails.agency = element.textContent.trim();
      break;
    }
  }
  
  // Phone
  const phoneSelector = 'a[href^="tel:"]';
  const phoneElement = document.querySelector(phoneSelector);
  if (phoneElement) {
    agentDetails.phone = phoneElement.textContent.trim();
  }
  
  return Object.keys(agentDetails).length > 0 ? agentDetails : 'Agent details not available';
}

function extractImages() {
  const images = [];
  
  // Check for image galleries
  const galleryImages = document.querySelectorAll('.gallery-image, img[data-testid="gallery-image"], [class*="GalleryContainer"] img');
  
  if (galleryImages && galleryImages.length > 0) {
    galleryImages.forEach(img => {
      const src = img.src || img.getAttribute('data-src');
      if (src && !images.includes(src)) {
        images.push(src);
      }
    });
  }
  
  // Look for any hero/banner images
  const heroImages = document.querySelectorAll('.hero-image, img[data-testid="hero-image"], [class*="HeroImage"] img');
  heroImages.forEach(img => {
    const src = img.src || img.getAttribute('data-src');
    if (src && !images.includes(src)) {
      images.push(src);
    }
  });
  
  // Try to find carousel images
  const carouselImages = document.querySelectorAll('[class*="Carousel"] img, [class*="carousel"] img');
  carouselImages.forEach(img => {
    const src = img.src || img.getAttribute('data-src');
    if (src && !images.includes(src)) {
      images.push(src);
    }
  });
  
  // Check for background images in divs
  const bgImageDivs = document.querySelectorAll('[style*="background-image"]');
  bgImageDivs.forEach(div => {
    const style = div.getAttribute('style');
    if (style) {
      const match = style.match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/i);
      if (match && match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }
  });
  
  // Check for image URLs in data attributes
  const elementsWithDataImg = document.querySelectorAll('[data-src], [data-image-src], [data-image-url]');
  elementsWithDataImg.forEach(el => {
    const dataSrc = el.getAttribute('data-src') || el.getAttribute('data-image-src') || el.getAttribute('data-image-url');
    if (dataSrc && !images.includes(dataSrc)) {
      images.push(dataSrc);
    }
  });
  
  // Filter out any small icons or thumbnails (typically under 200px)
  return images.filter(url => {
    // Exclude small images like icons, but include images that don't have dimensions in the URL
    return !url.match(/(\d+)x(\d+)/) || 
           (url.match(/(\d+)x(\d+)/) && 
            (parseInt(url.match(/(\d+)x(\d+)/)[1]) > 200 || 
             parseInt(url.match(/(\d+)x(\d+)/)[2]) > 200));
  });
}

function extractSuburb() {
  // Extract suburb from address or URL
  const address = extractAddress();
  
  if (address !== 'Address not found') {
    const addressParts = address.split(',');
    if (addressParts.length > 1) {
      return addressParts[1].trim();
    }
  }
  
  // Try to get from URL
  const urlMatch = window.location.href.match(/\/([^\/]+),\-[^\/]+\/property/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].replace(/-/g, ' ');
  }
  
  return 'Suburb not found';
}

// Extract specific feature: bedrooms
function extractBedrooms() {
  // Try to extract from aria-label attributes first (highest priority)
  const bedroomAria = document.querySelector('li[aria-label*="bedroom"], li[aria-label*="Bedroom"]');
  if (bedroomAria) {
    const match = bedroomAria.getAttribute('aria-label').match(/(\d+)\s*bedroom/i);
    if (match) {
      return match[1];
    }
    return bedroomAria.textContent.trim();
  }
  
  // Try specific element structure from HTML snippet
  const bedroomLi = document.querySelector('li[aria-label="2 bedrooms"]');
  if (bedroomLi) {
    const match = bedroomLi.getAttribute('aria-label').match(/(\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Try to find any li element with bedroom text
  const bedroomElements = document.querySelectorAll('li[aria-label*="bedroom"]');
  for (const element of bedroomElements) {
    const label = element.getAttribute('aria-label');
    const match = label.match(/(\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Try different selectors for bedrooms (fallback approach)
  const bedroomSelectors = [
    '[data-testid="property-features-feature-beds"] .property-features__feature-text',
    '.property-features__feature--beds .property-features__feature-text',
    '.property-features__beds .property-features__feature-text',
    '[data-testid="property-features__beds"]',
    '.general-features [data-testid*="beds" i]',
    '[class*="bedroomFeature"]',
    '[class*="property-features"] [class*="bed"]'
  ];
  
  for (const selector of bedroomSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      // Extract just the number
      const match = element.textContent.trim().match(/(\d+)/);
      if (match) return match[1];
      return element.textContent.trim();
    }
  }
  
  // Try the parent ul element with property-info__primary-features
  const featuresUl = document.querySelector('ul.property-info__primary-features, ul[class*="primary-features"]');
  if (featuresUl) {
    const text = featuresUl.textContent;
    const match = text.match(/(\d+)\s*bedroom/i);
    if (match) {
      return match[1];
    }
  }
  
  // Check in any element with "bedrooms" text
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    if (element.textContent.match(/\d+\s*bedroom/i)) {
      const match = element.textContent.match(/(\d+)\s*bedroom/i);
      if (match) {
        return match[1];
      }
    }
  }
  
  return 'N/A';
}

// Extract specific feature: bathrooms
function extractBathrooms() {
  // Try to extract from aria-label attributes first (highest priority)
  const bathroomAria = document.querySelector('li[aria-label*="bathroom"], li[aria-label*="Bathroom"]');
  if (bathroomAria) {
    const match = bathroomAria.getAttribute('aria-label').match(/(\d+)\s*bathroom/i);
    if (match) {
      return match[1];
    }
    return bathroomAria.textContent.trim();
  }
  
  // Try specific element structure from HTML snippet
  const bathroomLi = document.querySelector('li[aria-label="2 bathrooms"]');
  if (bathroomLi) {
    const match = bathroomLi.getAttribute('aria-label').match(/(\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Try to find any li element with bathroom text
  const bathroomElements = document.querySelectorAll('li[aria-label*="bathroom"]');
  for (const element of bathroomElements) {
    const label = element.getAttribute('aria-label');
    const match = label.match(/(\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Try different selectors for bathrooms (fallback approach)
  const bathroomSelectors = [
    '[data-testid="property-features-feature-baths"] .property-features__feature-text',
    '.property-features__feature--baths .property-features__feature-text',
    '.property-features__baths .property-features__feature-text',
    '[data-testid="property-features__baths"]',
    '.general-features [data-testid*="bath" i]',
    '[class*="bathroomFeature"]',
    '[class*="property-features"] [class*="bath"]'
  ];
  
  for (const selector of bathroomSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      // Extract just the number
      const match = element.textContent.trim().match(/(\d+)/);
      if (match) return match[1];
      return element.textContent.trim();
    }
  }
  
  // Try the parent ul element with property-info__primary-features
  const featuresUl = document.querySelector('ul.property-info__primary-features, ul[class*="primary-features"]');
  if (featuresUl) {
    const text = featuresUl.textContent;
    const match = text.match(/(\d+)\s*bathroom/i);
    if (match) {
      return match[1];
    }
  }
  
  return 'N/A';
}

// Extract specific feature: parking spaces
function extractParkingSpaces() {
  // Try to extract from aria-label attributes first (highest priority)
  const parkingAria = document.querySelector('li[aria-label*="car space"], li[aria-label*="Car space"]');
  if (parkingAria) {
    const match = parkingAria.getAttribute('aria-label').match(/(\d+)\s*car\s*space/i);
    if (match) {
      return match[1];
    }
    return parkingAria.textContent.trim();
  }
  
  // Try specific element structure from HTML snippet
  const parkingLi = document.querySelector('li[aria-label="1 car space"]');
  if (parkingLi) {
    const match = parkingLi.getAttribute('aria-label').match(/(\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Try to find any li element with car space or parking text
  const parkingElements = document.querySelectorAll('li[aria-label*="car space"], li[aria-label*="parking"]');
  for (const element of parkingElements) {
    const label = element.getAttribute('aria-label');
    const match = label.match(/(\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Try different selectors for parking (fallback approach)
  const parkingSelectors = [
    '[data-testid="property-features-feature-parking"] .property-features__feature-text',
    '.property-features__feature--parking .property-features__feature-text',
    '.property-features__parking .property-features__feature-text',
    '[data-testid="property-features__parking"]',
    '.general-features [data-testid*="parking" i]',
    '[class*="parkingFeature"]',
    '[class*="property-features"] [class*="parking"]',
    '[class*="property-features"] [class*="car"]'
  ];
  
  for (const selector of parkingSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      // Extract just the number
      const match = element.textContent.trim().match(/(\d+)/);
      if (match) return match[1];
      return element.textContent.trim();
    }
  }
  
  // Try the parent ul element with property-info__primary-features
  const featuresUl = document.querySelector('ul.property-info__primary-features, ul[class*="primary-features"]');
  if (featuresUl) {
    const text = featuresUl.textContent;
    const match = text.match(/(\d+)\s*car\s*space/i);
    if (match) {
      return match[1];
    }
  }
  
  return 'N/A';
} 