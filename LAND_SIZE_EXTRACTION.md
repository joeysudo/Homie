# Land Size Extraction in Homie

This document explains how the Homie extension extracts land size information from realestate.com.au property pages.

## Overview

Land size is a critical property metric that users need for property analysis. The realestate.com.au website displays this information in various ways depending on the property type and page structure. The extension uses multiple strategies to reliably extract this information.

## Extraction Methods

The extension uses the following methods in order of preference:

1. **DOM Selectors** - Directly targets HTML elements containing land size information using CSS selectors
2. **Feature List Pattern Matching** - Looks for text patterns in feature lists that mention land size
3. **ArgonautExchange Data** - Extracts structured data from the site's JavaScript objects
4. **JSON-LD Structured Data** - Extracts from structured data in the page
5. **Description Text Mining** - As a fallback, attempts to find land size mentioned in the property description

## HTML Structure on realestate.com.au

Realestate.com.au typically presents land size information in one of these ways:

### 1. In Feature Lists

```html
<li class="FeatureListItem" data-testid="property-features-land-size">
  <span>Land size</span>
  <span class="property-features__feature-text">336 m²</span>
</li>
```

### 2. In Structured Data (ArgonautExchange)

The site includes a JavaScript object with structured property data:

```javascript
window.ArgonautExchange = {
  "resi-property_listing-experience-web": {
    "urqlClientCache": "..."
  }
}
```

Within this structure, land size can be found in two locations:

- In `propertyFeatures` array with `featureName: "Land size"`
- In `propertySizes.land` object

Example structure:

```javascript
{
  "propertyFeatures": [
    {
      "featureName": "Land size",
      "value": {
        "__typename": "MeasurementFeatureValue",
        "displayValue": "336",
        "sizeUnit": {
          "id": "SQUARE_METRES",
          "displayValue": "m²"
        }
      }
    }
  ],
  "propertySizes": {
    "land": {
      "displayValue": "336",
      "sizeUnit": {
        "displayValue": "m²"
      }
    }
  }
}
```

## Implementation Details

The extraction logic follows these steps:

1. Try a series of CSS selectors that target land size elements
2. Look for elements with class names or text content containing "land size"
3. Parse the ArgonautExchange JavaScript object if found
4. Check for structured data in JSON-LD format
5. As a last resort, attempt to extract land size from the property description

## Testing

You can test the land size extraction functionality using:

```
test-extraction.html
```

This page simulates different HTML structures from realestate.com.au and verifies that our extraction logic works correctly.

## Troubleshooting

If land size is not being extracted correctly:

1. Check if the site HTML structure has changed
2. Verify if the ArgonautExchange data format has been modified
3. Add new selectors or patterns to the extraction function

## Recent Updates

The most recent update added support for:
- Handling the new ArgonautExchange data structure
- Adding more robust CSS selectors for various page layouts
- Better text pattern matching for feature lists 