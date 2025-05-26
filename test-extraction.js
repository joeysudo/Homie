// Test script for verifying land size extraction
console.log("Testing land size extraction functions");

// Import the function from content.js
// Note: In a browser extension, you would need to modify this for direct testing

// Mock HTML structure - this simulates a property page
document.body.innerHTML = `
<div class="property-features">
  <ul>
    <li class="FeatureListItem" data-testid="property-features-land-size">
      <span>Land size</span>
      <span class="property-features__feature-text">336 m²</span>
    </li>
  </ul>
</div>

<script type="text/javascript">
window.ArgonautExchange = {
  "resi-property_listing-experience-web": {
    "urqlClientCache": "{\"ROOT_QUERY{\\\"details\\\":{\\\"id\\\":\\\"143160680\\\"}}\":{\"data\":\"{\\\"details\\\":{\\\"listing\\\":{\\\"id\\\":\\\"143160680\\\",\\\"propertyType\\\":{\\\"display\\\":\\\"House\\\",\\\"__typename\\\":\\\"PropertyType\\\"},\\\"description\\\":\\\"Test description\\\",\\\"propertyFeatures\\\":[{\\\"featureName\\\":\\\"Built-in wardrobes\\\",\\\"value\\\":null,\\\"__typename\\\":\\\"PropertyFeature\\\"},{\\\"featureName\\\":\\\"Land size\\\",\\\"value\\\":{\\\"__typename\\\":\\\"MeasurementFeatureValue\\\",\\\"displayValue\\\":\\\"336\\\",\\\"sizeUnit\\\":{\\\"id\\\":\\\"SQUARE_METRES\\\",\\\"displayValue\\\":\\\"m²\\\",\\\"__typename\\\":\\\"PropertySizeUnit\\\"}},\\\"__typename\\\":\\\"PropertyFeature\\\"}],\\\"propertySizes\\\":{\\\"building\\\":null,\\\"land\\\":{\\\"displayValue\\\":\\\"336\\\",\\\"sizeUnit\\\":{\\\"displayValue\\\":\\\"m²\\\",\\\"__typename\\\":\\\"PropertySizeUnit\\\"},\\\"__typename\\\":\\\"PropertySize\\\"},\\\"preferred\\\":{\\\"sizeType\\\":\\\"LAND\\\",\\\"size\\\":{\\\"displayValue\\\":\\\"336\\\",\\\"sizeUnit\\\":{\\\"displayValue\\\":\\\"m²\\\",\\\"__typename\\\":\\\"PropertySizeUnit\\\"},\\\"__typename\\\":\\\"PropertySize\\\"},\\\"__typename\\\":\\\"PreferredPropertySize\\\"},\\\"__typename\\\":\\\"PropertySizes\\\"}}}}\"}}",
  }
};
</script>
`;

// Simplified version of the extractDescription function for testing
function extractDescription() {
  return "This is a test property with land size of 336 sqm near the beach.";
}

// Test the extractLandSize function
function testExtractLandSize() {
  // Copy of the function from content.js (simplified for testing)
  function extractLandSize() {
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

  // Run the test
  const result = extractLandSize();
  console.log("Extracted land size:", result);
  
  // Verify the result
  if (result.includes("336")) {
    console.log("✅ TEST PASSED: Land size correctly extracted");
  } else {
    console.log("❌ TEST FAILED: Land size not correctly extracted");
  }
  
  return result;
}

// Run the test
testExtractLandSize(); 