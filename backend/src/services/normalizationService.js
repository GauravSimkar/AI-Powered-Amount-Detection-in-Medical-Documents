import { getModel } from '../config/gemini.js';

// Enhanced regex normalization for medical amounts
const normalizeWithRegex = async (rawTokens) => {
  try {
    console.log('Normalizing medical tokens using enhanced regex', rawTokens);

    // Medical-specific normalization
    const normalizedAmounts = [];
    let processedCount = 0;

    for (const token of rawTokens) {
      // Skip percentages and non-numeric tokens
      if (token.includes('%') || token.trim() === '') {
        continue;
      }
      
      // Enhanced cleaning for medical amounts
      const cleaned = token.replace(/,/g, '').replace(/[^\d.]/g, '');
      
      // Handle empty results after cleaning
      if (!cleaned || cleaned === '.') {
        continue;
      }
      
      const number = parseFloat(cleaned);
      
      // Medical amount validation with reasonable ranges
      if (!isNaN(number) && number > 0) {
        // Medical bills typically range from small medicine costs to large procedures
        if (number >= 0.01 && number < 1000000) { // Reasonable medical range
          normalizedAmounts.push(parseFloat(number.toFixed(2))); // Standardize decimals
          processedCount++;
        } else {
          console.log('Filtered out unreasonable medical amount:', number);
        }
      }
    }

    // Remove duplicates but preserve order for medical context
    const uniqueAmounts = [...new Set(normalizedAmounts)].sort((a, b) => b - a);

    // Enhanced confidence calculation for medical context
    const successRate = rawTokens.length > 0 ? processedCount / rawTokens.length : 0;
    const confidence = Math.min(0.95, 0.60 + successRate * 0.35);

    console.log('Enhanced medical normalization result:', uniqueAmounts);

    return {
      normalized_amounts: uniqueAmounts,
      normalization_confidence: parseFloat(confidence.toFixed(2)),
      method: 'regex',
      note: `Normalized ${uniqueAmounts.length} medical amounts from ${rawTokens.length} tokens`
    };

  } catch (error) {
    throw new Error(`Medical regex normalization failed: ${error.message}`);
  }
};

// Enhanced AI normalization with medical validation
const normalizeWithAI = async (rawTokens) => {
  try {
    console.log('Normalizing medical amounts using enhanced AI validation', rawTokens);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found');
    }

    if (!rawTokens || rawTokens.length === 0) {
      return {
        normalized_amounts: [],
        normalization_confidence: 0.0,
        validation_notes: "No medical amounts to normalize",
        method: 'ai'
      };
    }

    // First, do basic medical normalization
    const normalizedAmounts = [];
    for (const token of rawTokens) {
      if (token.includes('%')) continue;
      const cleaned = token.replace(/,/g, '').replace(/[^\d.]/g, '');
      const number = parseFloat(cleaned);
      if (!isNaN(number) && number > 0 && number < 1000000) {
        normalizedAmounts.push(parseFloat(number.toFixed(2)));
      }
    }

    const uniqueAmounts = [...new Set(normalizedAmounts)].sort((a, b) => b - a);

    const model = getModel();
    
    // Enhanced medical validation prompt
    const prompt = `You are a medical billing validation expert. Analyze these amounts from a healthcare document:

RAW MEDICAL TOKENS: ${JSON.stringify(rawTokens)}
NORMALIZED AMOUNTS: ${JSON.stringify(uniqueAmounts)}

MEDICAL VALIDATION CHECKS:
1. Decimal accuracy - medical bills often have .00, .50 endings
2. Logical medical ranges:
   - Consultation: 300-3000
   - Tests: 150-2500  
   - Medicines: 50-1000
   - Procedures: 1000-50000
3. Remove obvious OCR errors (12000 vs 1200)
4. Check for missing decimal points
5. Validate against common medical billing patterns

MEDICAL CORRECTION EXAMPLES:
- 12000 → 1200 (if context suggests consultation)
- 2500 → 250.00 (if likely missing decimal)
- Remove amounts outside medical ranges

Return ONLY valid JSON:
{
  "normalized_amounts": [corrected amounts or same if valid],
  "normalization_confidence": 0.85,
  "validation_notes": "Medical validation: [brief note]"
}

If amounts look valid for medical context, return as-is.
Return ONLY JSON.`;

    const result = await model.generateContent(prompt);
    let aiText = (await result.response.text()).trim();

    if (aiText.startsWith('```')) {
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsed.method = 'ai';
      console.log('✅ Enhanced medical AI validation successful:', parsed.validation_notes);
      return parsed;
    } else {
      throw new Error('No valid JSON found in AI response');
    }

  } catch (error) {
    console.log('❌ Medical AI normalization failed:', error.message);
    throw new Error(`Medical AI normalization failed: ${error.message}`);
  }
};

// Main normalization function
const normalize = async (rawTokens, mode = 'fast') => {
  try {
    console.log(`Normalizing ${rawTokens?.length} medical amounts in mode: ${mode}`);

    if (mode === 'aiEnhanced' && process.env.GEMINI_API_KEY) {
      try {
        return await normalizeWithAI(rawTokens);
      } catch (aiError) {
        console.log('⚠️ Medical AI normalization failed, using regex fallback');
        return await normalizeWithRegex(rawTokens);
      }
    } else {
      return await normalizeWithRegex(rawTokens);
    }

  } catch (error) {
    throw new Error(`Medical normalization failed: ${error.message}`);
  }
};

const normalizationService = { 
  normalize,
  normalizeWithRegex,
  normalizeWithAI
};
export default normalizationService;