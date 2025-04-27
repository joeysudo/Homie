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
                         window.location.href.includes('/properties/');
  
  if (!isPropertyPage) {
    throw new Error('Not a property details page');
  }
  
  // Extract basic property information
  const propertyData = {
    url: window.location.href,
    title: extractText('h1'),
    price: extractPrice(),
    address: extractAddress(),
    propertyType: extractPropertyType(),
    bedrooms: extractBedrooms(),
    bathrooms: extractBathrooms(),
    parkingSpaces: extractParkingSpaces(),
    landSize: extractLandSize(),
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
    walkScore: extractWalkScore()
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
    incomeLevel: null,
    occupation: [],
    familyComposition: [],
    education: [],
    ethnicBackground: [],
    neighborhoodType: null
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
          percentage: match[2]
        });
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
      
      // Extract income level
      const incomeMatch = incomeText.match(/\$[\d,]+/);
      if (incomeMatch) {
        demographics.incomeLevel = incomeMatch[0];
      }
    });
  }
  
  // Look for occupation data
  const occupationElements = document.querySelectorAll(
    '[data-testid="demographics-occupation"], [class*="demographic"] [class*="occupation"]'
  );
  
  if (occupationElements.length > 0) {
    occupationElements.forEach(element => {
      const occupationText = element.textContent.trim();
      
      // Extract occupation types and percentages
      const occupationMatches = occupationText.matchAll(/([\w\s-]+):\s*(\d+(?:\.\d+)?%?)/g);
      for (const match of occupationMatches) {
        if (!match[1].includes('%') && !match[1].match(/^\d+$/)) {
          demographics.occupation.push({
            type: match[1].trim(),
            percentage: match[2]
          });
        }
      }
    });
  }
  
  // Look for family composition data
  const familyElements = document.querySelectorAll(
    '[data-testid="demographics-household"], [class*="demographic"] [class*="family"], [class*="household"]'
  );
  
  if (familyElements.length > 0) {
    familyElements.forEach(element => {
      const familyText = element.textContent.trim();
      
      // Extract family types and percentages
      const familyMatches = familyText.matchAll(/(couples|single|families|children|no children|living alone)[\w\s-]*:\s*(\d+(?:\.\d+)?%?)/gi);
      for (const match of familyMatches) {
        demographics.familyComposition.push({
          type: match[1].trim(),
          percentage: match[2]
        });
      }
    });
  }
  
  // Look for education data
  const educationElements = document.querySelectorAll(
    '[data-testid="demographics-education"], [class*="demographic"] [class*="education"]'
  );
  
  if (educationElements.length > 0) {
    educationElements.forEach(element => {
      const educationText = element.textContent.trim();
      
      // Extract education levels and percentages
      const educationMatches = educationText.matchAll(/(university|bachelor|diploma|high school|certificate)[\w\s-]*:\s*(\d+(?:\.\d+)?%?)/gi);
      for (const match of educationMatches) {
        demographics.education.push({
          level: match[1].trim(),
          percentage: match[2]
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
          demographics.ethnicBackground.push({
            origin: match[1].trim(),
            percentage: match[2]
          });
        }
      }
    });
  }
  
  // Extract neighborhood type based on descriptions
  const propertyDescription = document.querySelector(
    '[data-testid="description"], [class*="Description"], [class*="description"]'
  );
  
  if (propertyDescription) {
    const descText = propertyDescription.textContent.toLowerCase();
    
    if (descText.includes('family') && (descText.includes('friendly') || descText.includes('oriented'))) {
      demographics.neighborhoodType = 'Family-friendly';
    } else if (descText.includes('professional') || descText.includes('executive') || descText.includes('urban professional')) {
      demographics.neighborhoodType = 'Professional/Urban';
    } else if (descText.includes('retiree') || descText.includes('retirement') || descText.includes('over 55')) {
      demographics.neighborhoodType = 'Retirement/Senior';
    } else if (descText.includes('student') || descText.includes('university') || descText.includes('college')) {
      demographics.neighborhoodType = 'Student/University';
    } else if (descText.includes('trendy') || descText.includes('hip') || descText.includes('vibrant')) {
      demographics.neighborhoodType = 'Trendy/Hipster';
    } else if (descText.includes('diverse') || descText.includes('multicultural')) {
      demographics.neighborhoodType = 'Multicultural/Diverse';
    } else if (descText.includes('quiet') || descText.includes('peaceful')) {
      demographics.neighborhoodType = 'Quiet/Residential';
    }
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
    '.price'
  ];
  
  for (const selector of priceElements) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return 'Price not specified';
}

function extractAddress() {
  // Try to extract address from property-info__address element in the HTML provided
  const addressElement = document.querySelector('.property-info-address, .property-info__address, [class*="property-info-address"], h1.property-info-address');
  if (addressElement && addressElement.textContent.trim()) {
    return addressElement.textContent.trim();
  }
  
  // Try the new format with property-info__header
  const headerElement = document.querySelector('[class*="property-info__header"]');
  if (headerElement) {
    const addressHeading = headerElement.querySelector('h1');
    if (addressHeading) {
      return addressHeading.textContent.trim();
    }
  }
  
  // Look for the address in new HTML structure
  const addressWrapperElements = document.querySelectorAll('[class*="property-info_address"], [class*="property-info-address"], [class*="property-info__address"]');
  for (const element of addressWrapperElements) {
    if (element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Check for specific structure in the HTML example
  const addressStructure = document.querySelector('.property-info__header .property-info-address-actions h1');
  if (addressStructure && addressStructure.textContent.trim()) {
    return addressStructure.textContent.trim();
  }
  
  // Try to use the page title if structured element not found
  const title = document.title;
  if (title && title.includes('-')) {
    return title.split('-')[0].trim();
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
  // First try the property-info section with aria-label containing "land size"
  const landSizeElements = document.querySelectorAll('li[aria-label*="land size"]');
  if (landSizeElements.length > 0) {
    for (const element of landSizeElements) {
      const text = element.textContent.trim();
      return text;
    }
  }
  
  // Try finding it in the Text_Typography elements
  const typographyElements = document.querySelectorAll('p.Text_Typography');
  for (const element of typographyElements) {
    if (element.textContent.includes('m²') || element.textContent.includes('sqm')) {
      return element.textContent.trim();
    }
  }
  
  // Try standard selectors
  const landSizeSelectors = [
    '.property-features__feature--land-area',
    '.land-size',
    '[data-testid="property-features__land-area"]'
  ];
  
  for (const selector of landSizeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Try to find it in the description
  const description = document.querySelector('.property-description__content');
  if (description) {
    const text = description.textContent;
    const landSizeMatch = text.match(/(\d+(?:\.\d+)?)\s*(m²|sqm|sq\.m|hectares|acres)/i);
    if (landSizeMatch) {
      return `${landSizeMatch[0]}`;
    }
  }
  
  return 'Land size not specified';
}

function extractPropertyType() {
  // First check for a House type label
  const typeLabelElements = document.querySelectorAll('p.Text_Typography');
  for (const element of typeLabelElements) {
    if (element.textContent === 'House') return 'House';
    if (element.textContent === 'Apartment') return 'Apartment';
    if (element.textContent === 'Townhouse') return 'Townhouse';
    if (element.textContent === 'Land') return 'Land';
    if (element.textContent === 'Unit') return 'Unit';
  }
  
  // Look for property type indicators
  const propertyTypeSelectors = [
    '.property-info__property-type',
    '[data-testid="listing-summary-property-type"]'
  ];
  
  for (const selector of propertyTypeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Try to infer from URL or title
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  
  if (url.includes('house') || title.includes('house')) return 'House';
  if (url.includes('apartment') || title.includes('apartment')) return 'Apartment';
  if (url.includes('unit') || title.includes('unit')) return 'Unit';
  if (url.includes('townhouse') || title.includes('townhouse')) return 'Townhouse';
  if (url.includes('land') || title.includes('land')) return 'Land';
  
  return 'Property type not specified';
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
  // First, try the property-info section with aria-label containing "bedrooms"
  const bedroomElements = document.querySelectorAll('li[aria-label*="bedroom"]');
  if (bedroomElements.length > 0) {
    for (const element of bedroomElements) {
      const text = element.textContent.trim();
      const match = text.match(/(\d+)/);
      if (match) return match[0];
    }
  }
  
  // Try the new style property features with Text_Typography
  const typographyElements = document.querySelectorAll('p.Text_Typography');
  for (const element of typographyElements) {
    if (element.textContent.includes('bedroom')) {
      const match = element.textContent.match(/(\d+)/);
      if (match) return match[0];
    }
  }
  
  // Try the old extraction method using the class selector
  return extractNumber('.property-features__feature--beds');
}

// Extract specific feature: bathrooms
function extractBathrooms() {
  // First, try the property-info section with aria-label
  const bathroomElements = document.querySelectorAll('li[aria-label*="bathroom"]');
  if (bathroomElements.length > 0) {
    for (const element of bathroomElements) {
      const text = element.textContent.trim();
      const match = text.match(/(\d+)/);
      if (match) return match[0];
    }
  }
  
  // Try the new style property features with Text_Typography
  const typographyElements = document.querySelectorAll('p.Text_Typography');
  for (const element of typographyElements) {
    if (element.textContent.includes('bathroom')) {
      const match = element.textContent.match(/(\d+)/);
      if (match) return match[0];
    }
  }
  
  // Try the old extraction method
  return extractNumber('.property-features__feature--baths');
}

// Extract specific feature: parking spaces
function extractParkingSpaces() {
  // First, try the property-info section with aria-label
  const parkingElements = document.querySelectorAll('li[aria-label*="car space"], li[aria-label*="car spaces"]');
  if (parkingElements.length > 0) {
    for (const element of parkingElements) {
      const text = element.textContent.trim();
      const match = text.match(/(\d+)/);
      if (match) return match[0];
    }
  }
  
  // Try the new style property features with Text_Typography
  const typographyElements = document.querySelectorAll('p.Text_Typography');
  for (const element of typographyElements) {
    if (element.textContent.includes('car space') || element.textContent.includes('car spaces')) {
      const match = element.textContent.match(/(\d+)/);
      if (match) return match[0];
    }
  }
  
  // Try the old extraction method
  return extractNumber('.property-features__feature--parking');
} 