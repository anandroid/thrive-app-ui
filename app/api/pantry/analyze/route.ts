import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.THRIVE_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export async function POST(request: NextRequest) {
  try {
    const { image, text, mode } = await request.json();
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }
    
    let prompt: string;
    let requestBody: {
      contents: Array<{
        parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>
      }>;
      generationConfig: {
        temperature: number;
        topK: number;
        topP: number;
        maxOutputTokens: number;
      };
    };
    
    if (mode === 'image' && image) {
      // Image analysis mode
      prompt = `You are analyzing a health/wellness product image. Identify the product and provide detailed information.

Analyze the image and identify:
- Product name and brand
- Type of product (supplement, medicine, herb, food, remedy)
- Key ingredients if visible
- Dosage information
- Any warnings or precautions

Respond in JSON format:
{
  "name": "exact product name",
  "confidence": 0.0-1.0,
  "category": "supplement|medicine|food|herb|remedy|other",
  "suggestedTags": ["relevant", "tags"],
  "description": "what this product is",
  "dosageInfo": "dosage information if visible",
  "warnings": ["any warnings or precautions"]
}`;

      // Remove data URL prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      
      requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      };
    } else if (mode === 'text' && text) {
      // Text analysis mode
      prompt = `Analyze this health/wellness item and provide structured information:
Item: "${text}"

Respond in JSON format:
{
  "name": "proper product name",
  "confidence": 0.0-1.0,
  "category": "supplement|medicine|food|herb|remedy|other",
  "suggestedTags": ["tag1", "tag2"],
  "description": "brief description",
  "dosageInfo": "typical dosage if applicable",
  "warnings": ["warning1", "warning2"]
}`;
      
      requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 512,
        }
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid request: must provide either image or text' },
        { status: 400 }
      );
    }
    
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the JSON response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback parsing
      analysis = {
        name: 'Unknown Item',
        confidence: 0.3,
        category: 'other',
        suggestedTags: [],
        description: 'Unable to analyze item'
      };
    }
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Pantry analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze item' },
      { status: 500 }
    );
  }
}