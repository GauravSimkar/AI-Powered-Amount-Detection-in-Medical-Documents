// classificationService.js - COMPLETELY REVISED VERSION
import { getModel } from '../config/gemini.js';

// classificationService.js - FINAL FIXED VERSION
// classificationService.js - FIXED VERSION WITH EXACT MATCHING
const classifyWithRules = async (normalizedAmounts, rawText) => {
  try {
    console.log('=== CLASSIFICATION DEBUG ===');
    console.log('Input text:', rawText);
    console.log('Amounts to classify:', normalizedAmounts);

    const segments = rawText.toLowerCase().split(/[,.\n]/).map(s => s.trim()).filter(s => s.length > 0);
    console.log('Segments found:', segments);

    const classified = [];
    
    for (const amount of normalizedAmounts) {
      const amountValue = typeof amount === 'number' ? amount : parseFloat(amount);
      let type = 'other';
      let confidence = 0.5;
      
      // Try multiple string representations to find the amount
      const amountPatterns = [
        amountValue.toString(),
        amountValue.toFixed(2),
        ` ${amountValue} `, // Add spaces for exact matching
        `:${amountValue}`,
        `${amountValue},`,
        `${amountValue}.`
      ];
      
      let foundSegment = null;
      
      // Try each pattern to find the segment containing this amount
      for (const pattern of amountPatterns) {
        foundSegment = segments.find(seg => {
          // Use exact matching to avoid substring issues
          return seg.includes(` ${pattern} `) || 
                 seg.includes(`:${pattern}`) ||
                 seg.includes(` ${pattern},`) ||
                 seg.includes(` ${pattern}.`) ||
                 seg.endsWith(` ${pattern}`) ||
                 seg === pattern;
        });
        if (foundSegment) {
          console.log(`🔍 Found ${amountValue} (as "${pattern}") in segment: "${foundSegment}"`);
          break;
        }
      }
      
      // FALLBACK: If not found with exact patterns, try simple includes but verify it's not a substring
      if (!foundSegment) {
        for (const segment of segments) {
          // Use regex to match whole words or numbers with boundaries
          const regex = new RegExp(`\\b${amountValue}\\b`);
          if (regex.test(segment)) {
            foundSegment = segment;
            console.log(`🔍 Found ${amountValue} (using regex) in segment: "${foundSegment}"`);
            break;
          }
        }
      }
      
      console.log(`\n--- Processing ${amountValue} ---`);
      console.log('Found in segment:', foundSegment);
      
      if (foundSegment) {
        if (foundSegment.includes('consultation') || foundSegment.includes('consult')) {
          type = 'consultation_fee';
          console.log(`✅ ${amountValue} → consultation_fee (found "consultation" in segment)`);
        } else if (foundSegment.includes('medicine') || foundSegment.includes('drug')) {
          type = 'medicine';
          console.log(`✅ ${amountValue} → medicine (found "medicine" in segment)`);
        } else if (foundSegment.includes('test') || foundSegment.includes('lab')) {
          type = 'test';
          console.log(`✅ ${amountValue} → test (found "test" in segment)`);
        } else if (foundSegment.includes('total') || foundSegment.includes('bill')) {
          type = 'total_bill';
          console.log(`✅ ${amountValue} → total_bill (found "total" in segment)`);
        } else if (foundSegment.includes('paid') || foundSegment.includes('payment')) {
          type = 'paid';
          console.log(`✅ ${amountValue} → paid (found "paid" in segment)`);
        } else if (foundSegment.includes('balance') || foundSegment.includes('due') || foundSegment.includes('payable')) {
          type = 'due';
          console.log(`✅ ${amountValue} → due (found "balance/due" in segment)`);
        } else if (foundSegment.includes('discount') || foundSegment.includes('off')) {
          type = 'discount';
          console.log(`✅ ${amountValue} → discount (found "discount" in segment)`);
        } else {
          console.log(`❓ ${amountValue} → other (no matching keyword in segment)`);
        }
        
        confidence = 0.9;
      } else {
        console.log(`❌ Amount ${amountValue} not found in any segment, using fallback`);
        
        // Enhanced fallback logic
        const sorted = [...normalizedAmounts].sort((a, b) => b - a);
        const isLargest = amountValue === sorted[0];
        const isSmallest = amountValue === sorted[sorted.length - 1];
        const isSecondLargest = normalizedAmounts.length > 1 && amountValue === sorted[1];
        
        if (isLargest) {
          type = 'total_bill';
          console.log(`🤔 ${amountValue} → total_bill (largest amount fallback)`);
        } else if (isSecondLargest) {
          type = 'paid';
          console.log(`🤔 ${amountValue} → paid (second largest fallback)`);
        } else if (isSmallest) {
          type = 'due';
          console.log(`🤔 ${amountValue} → due (smallest amount fallback)`);
        } else {
          type = 'other';
          console.log(`🤔 ${amountValue} → other (middle amount fallback)`);
        }
        confidence = 0.5;
      }
      
      classified.push({ type, value: amountValue, confidence });
    }
    
    console.log('\n=== FINAL RESULT ===', classified);
    return { 
      amounts: classified, 
      confidence: 0.8, 
      method: 'rules', 
      note: 'Classification with exact matching' 
    };
    
  } catch (error) {
    console.error('Classification error:', error);
    throw error;
  }
};

// Enhanced AI classification
const classifyWithAI = async (normalizedAmounts, rawText) => {
  try {
    console.log('Classifying amounts using AI');
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY not configured');
    }

    if (!normalizedAmounts || normalizedAmounts.length === 0) {
      return {
        amounts: [],
        confidence: 0.0,
        method: 'ai',
        note: 'No amounts to classify'
      };
    }

    const model = getModel();
    
    // ENHANCED PROMPT for better medical classification
    const prompt = `
You are a medical billing expert. Analyze this medical bill text and classify each amount by its type.

MEDICAL BILL TEXT:
"""
${rawText || 'No text provided'}
"""

AMOUNTS TO CLASSIFY: ${JSON.stringify(normalizedAmounts)}

CLASSIFICATION CATEGORIES:
- "total_bill": Main total amount (usually appears with words like "Total", "Bill", "Final Amount")
- "paid": Amount already paid (words like "Paid", "Payment", "Received", "Advance")
- "due": Remaining balance (words like "Due", "Balance", "Payable", "Outstanding")
- "discount": Discount amount (words like "Discount", "Concession", "Off")
- "consultation_fee": Doctor consultation charges
- "medicine": Medicine and pharmacy costs
- "test": Laboratory tests, scans, diagnostics
- "procedure": Medical procedures, surgeries, treatments
- "other": Any other medical charges

RULES:
1. Match amounts with their nearest labels in the text
2. If "Consultation" is near an amount, classify as consultation_fee
3. If "Medicine" is near an amount, classify as medicine
4. If "Test" or "Lab" is near an amount, classify as test
5. If "Total" is near an amount, classify as total_bill
6. If "Paid" is near an amount, classify as paid
7. If "Due" or "Balance" is near an amount, classify as due
8. The largest amount is often the total_bill, but verify with context

RETURN ONLY VALID JSON:
{
  "amounts": [
    {"type": "consultation_fee", "value": 500, "confidence": 0.9},
    {"type": "medicine", "value": 300, "confidence": 0.9},
    {"type": "test", "value": 400, "confidence": 0.9},
    {"type": "total_bill", "value": 1200, "confidence": 0.95},
    {"type": "paid", "value": 1000, "confidence": 0.9},
    {"type": "due", "value": 200, "confidence": 0.9}
  ],
  "confidence": 0.9
}

IMPORTANT: 
- Base classification on actual text context
- Return confidence for each amount
- Use "other" only when no clear context exists
- DO NOT default everything to "total_bill"
`;

    const result = await model.generateContent(prompt);
    let text = (await result.response.text()).trim();

    // Extract JSON from response
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/g, '');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in AI response:', text);
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and ensure each amount has required fields
    if (!parsed.amounts || !Array.isArray(parsed.amounts)) {
      throw new Error('Invalid AI response: missing amounts array');
    }

    parsed.amounts = parsed.amounts.map(amount => ({
      type: amount.type || 'other',
      value: amount.value,
      confidence: amount.confidence || 0.7
    }));

    parsed.method = 'ai';
    parsed.note = 'Classified using enhanced AI medical analysis';
    
    console.log('✅ Enhanced AI classification successful:', parsed.amounts);
    return parsed;

  } catch (error) {
    console.log('❌ Enhanced AI classification failed:', error.message);
    throw new Error(`AI classification failed: ${error.message}`);
  }
};

// Main classification function
const classify = async (normalizedAmounts, rawText, mode = 'fast') => {
  try {
    console.log(`Classifying ${normalizedAmounts?.length} amounts in mode: ${mode}`);
    console.log('Text preview:', rawText?.substring(0, 200));

    if (!normalizedAmounts || !Array.isArray(normalizedAmounts) || normalizedAmounts.length === 0) {
      return {
        amounts: [],
        confidence: 0.0,
        method: mode,
        note: 'No amounts to classify'
      };
    }

    let result;
    
    if (mode === 'aiEnhanced' && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        console.log('🤖 Attempting AI classification...');
        result = await classifyWithAI(normalizedAmounts, rawText);
      } catch (aiError) {
        console.log('⚠️ AI classification failed, falling back to rule-based:', aiError.message);
        result = await classifyWithRules(normalizedAmounts, rawText);
      }
    } else {
      console.log('⚡ Using rule-based classification');
      result = await classifyWithRules(normalizedAmounts, rawText);
    }

    // Final validation
    if (!result.amounts || !Array.isArray(result.amounts)) {
      throw new Error('Classification returned invalid amounts array');
    }

    console.log('🎯 Final classification types:', 
      result.amounts.map(a => `${a.type}: ${a.value}`)
    );

    return result;

  } catch (error) {
    console.error('❌ Classification service error:', error);
    throw new Error(`Classification failed: ${error.message}`);
  }
};

const classificationService = { 
  classify,
  classifyWithRules,
  classifyWithAI
};
export default classificationService;