import Tesseract from 'tesseract.js';
import { getModel } from '../config/gemini.js';

// Extract text from image buffer using Tesseract
const extractText = async (imageBuffer) => {
  try {
    console.log(' Processing image from buffer (memory storage)');
    
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      throw new Error('Invalid image buffer provided');
    }

    // Convert buffer to base64 for Tesseract
    const base64 = imageBuffer.toString('base64');
    const imageData = `data:image/png;base64,${base64}`;

    const result = await Tesseract.recognize(
      imageData,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('OCR completed with confidence:', result.data.confidence);

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence / 100
    };
  } catch (error) {
    throw new Error(`OCR failed: ${error.message}`);
  }
};

const extractAmountsWithRegex = async (text) => {
  try {
    console.log('Extracting amounts using improved regex');
    console.log('OCR Text:', text);
    
    const numericRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b\d+\.\d{2}\b|\b\d+\b/g;
    const allMatches = text.match(numericRegex) || [];
    
    console.log('All numeric matches:', allMatches);

    // Filter out dates and other non-monetary numbers
    const filteredMatches = allMatches.filter(token => {
      const num = parseFloat(token.replace(/,/g, ''));
      
      if (num >= 1900 && num <= 2100) {
        console.log('Filtered out date:', token);
        return false;
      }
      
      // Filter out quantities (usually small numbers at the beginning of lines)
      if (num <= 10) {
        const tokenIndex = text.indexOf(token);
        const lineStart = text.lastIndexOf('\n', tokenIndex) + 1;
        const lineEnd = text.indexOf('\n', tokenIndex);
        const line = text.substring(lineStart, lineEnd).toLowerCase();
        
        if (line.includes('qty') || line.includes('quantity') || line.match(/^\s*\d+\s*$/)) {
          console.log('Filtered out quantity:', token);
          return false;
        }
      }
      
      // Filter out page numbers, etc.
      if (num <= 5 && token.length === 1) {
        return false;
      }
      
      return true;
    });

    console.log('Filtered monetary amounts:', filteredMatches);

    let currency_hint = 'INR';
    if (text.match(/INR|Rs\.?|₹|Rupees?/i)) currency_hint = 'INR';
    else if (text.match(/USD|\$|Dollars?/i)) currency_hint = 'USD';
    else if (text.match(/EUR|€|Euros?/i)) currency_hint = 'EUR';
    else if (text.match(/GBP|£|Pounds?/i)) currency_hint = 'GBP';

    const confidence = filteredMatches.length
      ? Math.min(0.95, 0.60 + filteredMatches.length * 0.10)
      : 0.0;

    return {
      raw_tokens: filteredMatches,
      currency_hint,
      confidence: parseFloat(confidence.toFixed(2)),
      method: 'regex',
      note: `Extracted ${filteredMatches.length} monetary amounts`
    };

  } catch (error) {
    throw new Error(`Regex extraction failed: ${error.message}`);
  }
};


const extractAmountsWithAI = async (text) => {
  try {
    console.log('Extracting amounts using AI');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found');
    }

    const model = getModel();
    const prompt = `
You are an OCR post-processing expert. Extract ONLY monetary amounts from this receipt text, filtering out dates, quantities, page numbers, and other non-monetary numbers.

RECEIPT TEXT:
"""
${text}
"""

Tasks:
1. Extract ONLY monetary amounts (prices, totals, subtotals, taxes)
2. Filter out: dates, years, quantities, page numbers, line numbers
3. Detect the currency
4. Return amounts in the order they appear

Return ONLY a valid JSON object:
{
  "raw_tokens": ["330", "300", "30", "250", "25"],
  "currency_hint": "USD",
  "confidence": 0.85
}

IMPORTANT: 
- Skip years like 2018, 2020, etc.
- Skip quantities like "1" in "QTY: 1"
- Skip line numbers and page numbers
- Only return actual monetary amounts

Return ONLY JSON, no markdown.
`;

    const result = await model.generateContent(prompt);
    let aiText = (await result.response.text()).trim();

    if (aiText.startsWith('```')) {
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiData = JSON.parse(jsonMatch[0]);
      aiData.method = 'ai';
      aiData.note = 'AI-filtered monetary amounts';
      console.log(' AI-enhanced extraction successful');
      return aiData;
    } else {
      throw new Error('No valid JSON found in AI response');
    }

  } catch (error) {
    console.log('❌ AI extraction failed:', error.message);
    throw new Error(`AI extraction failed: ${error.message}`);
  }
};

// Main extraction function with mode support
const extractAmounts = async (text, mode = 'fast') => {
  try {
    console.log(`Extracting amounts from text in mode: ${mode}`);
    
    if (mode === 'aiEnhanced' && process.env.GEMINI_API_KEY) {
      try {
        return await extractAmountsWithAI(text);
      } catch (aiError) {
        console.log(' AI extraction failed, falling back to regex');
        return await extractAmountsWithRegex(text);
      }
    } else {
      return await extractAmountsWithRegex(text);
    }

  } catch (error) {
    throw new Error(`Amount extraction failed: ${error.message}`);
  }
};

const ocrService = { 
  extractText, 
  extractAmounts,
  extractAmountsWithRegex,
  extractAmountsWithAI
};
export default ocrService;