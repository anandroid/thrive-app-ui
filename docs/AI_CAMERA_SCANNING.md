# AI Camera Scanning for Pantry

## Overview

The Thrive app includes AI-powered camera scanning for adding items to your pantry. This feature uses Google's Gemini API to:

- Automatically identify supplements, medicines, and health products
- Extract product names and dosage information
- Suggest appropriate tags and categories
- Provide warnings and usage information

## Features

### 1. **AI-Powered Scanning**
- Take a photo or upload an image of any health product
- Gemini AI analyzes the image using advanced vision capabilities
- Automatic extraction of product information
- Smart categorization (supplement, medicine, herb, food, remedy)

### 2. **Quick Text Analysis**
- Type a product name for instant AI suggestions
- Get category and tag recommendations
- Dosage information extraction from product names

### 3. **Privacy-Conscious Design**
- Images are sent to Google's Gemini API for processing
- No images are stored permanently
- Falls back to keyword analysis when API unavailable
- Works offline with basic functionality

### 4. **Smart Fallbacks**
- Works without API key using keyword analysis
- Graceful degradation for API failures
- Manual entry always available

## Setup Instructions

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API key"
4. Create a new API key
5. Copy the API key

### 2. Configure Environment Variable

Add the API key to your `.env.local` file:

```bash
THRIVE_GEMINI_API_KEY=your-api-key-here
```

For production deployment, the API key is stored in Google Cloud secrets:
```bash
gcloud secrets versions access latest --secret="THRIVE_GEMINI_API_KEY"
```

### 3. Restart Development Server

```bash
npm run dev
```

## Usage Guide

### Adding Items with Camera

1. Click the "+" button in the Pantry page
2. Choose "Scan Item" to open camera
3. Point camera at product label
4. Take photo when item is in frame
5. AI analyzes and auto-fills information
6. Review and adjust as needed
7. Click "Add to Pantry"

### Quick Analysis

1. Start typing a product name
2. Click the sparkle (✨) button
3. AI suggests tags and category
4. Modify suggestions as needed

## Fallback Behavior

When Gemini API is not available (no API key, network issues, etc.):

1. **Keyword Analysis** - Basic pattern matching for common products
2. **Category Detection** - Identifies supplements, medicines, herbs, etc.
3. **Tag Suggestions** - Common tags based on product type
4. **Manual Entry** - Full manual control always available

## Performance Considerations

- **API Response Time**: 1-2 seconds for image analysis
- **Quick Analysis**: <500ms for text analysis
- **Fallback Speed**: Instant (runs locally)
- **API Limits**: Check your Google AI Studio quota

## Privacy & Security

- **API Communication**: Images sent to Google's servers via HTTPS
- **No Storage**: Images are processed and discarded
- **Data Privacy**: Only image data is sent, no personal information
- **Secure Storage**: All pantry data encrypted in IndexedDB

## API Pricing

- **Free Tier**: Gemini 1.5 Flash offers generous free quota
- **Pay-as-you-go**: Available for higher usage
- Check [Google AI pricing](https://ai.google.dev/pricing) for details

## Troubleshooting

### "API key not configured"
- Ensure `THRIVE_GEMINI_API_KEY` is set in `.env.local`
- Restart the development server after adding the key
- For production, verify the secret exists: `gcloud secrets list | grep GEMINI`

### "API error"
- Check your API key is valid
- Verify you haven't exceeded quota limits
- Check network connectivity

### "Slow performance"
- Normal for image analysis (1-2 seconds)
- Consider using quick text analysis instead
- Fallback to manual entry for faster input

## Future Enhancements

1. **Batch Scanning** - Scan multiple items at once
2. **Barcode Support** - Read UPC/EAN codes
3. **Nutrition Facts** - Extract detailed nutritional information
4. **Multi-language** - Support for international products
5. **Offline Model** - Investigate smaller models for edge deployment

The AI camera scanning feature provides a seamless way to track your health products while maintaining privacy and offering reliable fallbacks for any scenario.