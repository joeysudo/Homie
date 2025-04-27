# Homie - AI-Powered Real Estate Analyzer

Homie is a Chrome extension that helps you analyze properties on realestate.com.au using OpenAI's GPT API. The extension extracts property details and provides valuable insights about the property, location, price analysis, and more.

## Features

- Automatically detects when you're browsing property listings on realestate.com.au
- Extracts comprehensive property data from the listing page
- Connects to OpenAI's API to analyze the property (requires your own API key)
- Bilingual support: Get property analysis in either English or Chinese
- Provides insights on:
  - Property overview and features
  - Price analysis (value for money)
  - Location analysis and nearby amenities
  - Growth potential and investment considerations
  - School rankings in the area
  - Rental yield estimation
  - Advantages and disadvantages
  - Overall recommendation

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Homie - Real Estate Analyzer"
3. Click "Add to Chrome"

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" at the top-right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The Homie extension should now be installed and visible in your browser toolbar

## Usage

1. Navigate to a property listing on realestate.com.au
2. Click on the Homie extension icon in your browser toolbar
3. Enter your OpenAI API key (required for analysis)
4. Toggle between English and Chinese language as needed
5. Click "Analyze Property" to get detailed insights about the property
6. View the AI-generated analysis including property value, location quality, growth potential, and more

## Setting Up Your OpenAI API Key

1. Visit [OpenAI API Keys](https://platform.openai.com/account/api-keys) and sign in
2. Create a new API key
3. Copy the API key
4. In the Homie extension popup, paste your API key and click "Save"

Your API key will be stored securely in your browser's local storage and will not be shared with anyone.

## Creating Icons

Before using the extension, you need to create the icon files:
1. Open the `icons/placeholder.html` file in a browser
2. Create PNG icon files as shown in the placeholder
3. Save the PNG files in the `icons` directory with the exact names shown:
   - icon16.png
   - icon48.png
   - icon128.png
   - icon16_grey.png
   - icon48_grey.png
   - icon128_grey.png

## Privacy & Data Usage

- Homie only activates on realestate.com.au
- Your OpenAI API key is stored locally in your browser
- Property data is only sent to OpenAI's API when you click "Analyze Property"
- No data is collected or stored by Homie's developers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. 