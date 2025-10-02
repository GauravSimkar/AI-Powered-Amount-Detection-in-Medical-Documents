import ocrService from '../services/ocrService.js';
import normalizationService from '../services/normalizationService.js';
import classificationService from '../services/classificationService.js';
import finalService from '../services/finalService.js';
import { getModel } from '../config/gemini.js';

// AI VALIDATION
const validateWithAI = async (ocrData, normalized, classified, text) => {
  try {
    if (!process.env.GEMINI_API_KEY) return { valid: true, confidence: 0.85 };

    const model = getModel();
    const prompt = `
You are a QA expert. Validate this pipeline output:

Original text: "${text}"
Extracted tokens: ${JSON.stringify(ocrData?.raw_tokens)}
Normalized amounts: ${JSON.stringify(normalized?.normalized_amounts)}
Classification: ${JSON.stringify(classified?.amounts)}

Return JSON:
{
  "valid": true/false,
  "confidence": 0.85,
  "issues": ["list issues or empty"],
  "recommendation": "accept" or "needs_clarification"
}
`;
    const result = await model.generateContent(prompt);
    const aiText = result.response.text().trim();
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { valid: true, confidence: 0.85 };
  } catch (err) {
    console.log('⚠️ AI validation error:', err.message);
    return { valid: true, confidence: 0.80 };
  }
};

// ----------- Step 1: OCR -----------
export const handleOCR = async (req, res) => {
  try {
    const mode = req.query.mode || 'fast'; // 'fast' or 'aiEnhanced'
    let text = req.body.text;

    console.log(`🔧 OCR Mode: ${mode}`);

    if (req.file) {
      const ocrResult = await ocrService.extractText(req.file.buffer);
      text = ocrResult.text;
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'No text or image provided' });
    }

    const ocrData = await ocrService.extractAmounts(text, mode);
    return res.json({
      ...ocrData,
      mode_used: mode,
      text: text.substring(0, 500) + (text.length > 500 ? '...' : '') // Include truncated text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------- Step 2: Normalization -----------
export const handleNormalization = async (req, res) => {
  try {
    const mode = req.query.mode || 'fast';
    const { tokens } = req.body;
    
    console.log(`🔧 Normalization Mode: ${mode}`);
    
    if (!tokens || tokens.length === 0) return res.status(400).json({ error: 'No tokens provided' });

    const normalized = await normalizationService.normalize(tokens, mode);
    return res.json({
      ...normalized,
      mode_used: mode,
      input_tokens_count: tokens.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------- Step 3: Classification -----------
export const handleClassification = async (req, res) => {
  try {
    const mode = req.query.mode || 'fast';
    const { normalizedAmounts, text, rawTokens } = req.body; // Add rawTokens
    
    console.log(`🔧 Classification Mode: ${mode}`);
    console.log('📊 Input for classification:', { 
      normalizedAmounts, 
      textLength: text?.length,
      rawTokensCount: rawTokens?.length 
    });
    
    if (!normalizedAmounts || normalizedAmounts.length === 0) {
      return res.status(400).json({ 
        error: 'No normalized amounts provided',
        received: normalizedAmounts 
      });
    }

    // Add input validation
    if (!Array.isArray(normalizedAmounts)) {
      return res.status(400).json({ 
        error: 'normalizedAmounts must be an array',
        received: typeof normalizedAmounts 
      });
    }

    // Pass additional context to classification service
    const classified = await classificationService.classify(
      normalizedAmounts, 
      text, 
      mode,
      rawTokens // Pass raw tokens for better context
    );
    
    console.log('🎯 Classification result:', classified);
    
    return res.json({
      ...classified,
      mode_used: mode,
      input_amounts_count: normalizedAmounts.length,
      input_text_preview: text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : null
    });
  } catch (error) {
    console.error('❌ Classification error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ----------- Step 4: Final Output -----------
export const handleFinalOutput = async (req, res) => {
  try {
    const { amounts, currency } = req.body;
    if (!amounts || amounts.length === 0)
      return res.status(400).json({ error: 'No classified amounts provided' });

    const final = await finalService.createFinal(amounts, currency || 'INR');
    return res.json({
      ...final,
      mode_used: 'final' // Final step doesn't have different modes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------- Full Pipeline -----------
export const handleFullPipeline = async (req, res) => {
  try {
    const mode = req.query.mode || 'fast';
    let text = req.body.text;
    let ocrData;

    console.log(`🚀 Full Pipeline Mode: ${mode}`);

    // Handle file upload
    if (req.file) {
      console.log('📁 Processing uploaded file...');
      const ocrResult = await ocrService.extractTextFromBuffer(req.file.buffer); // Use buffer instead of file path
      text = ocrResult.text;
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ 
        error: 'No text or image provided',
        hasFile: !!req.file,
        hasText: !!req.body.text
      });
    }

    console.log('📝 Text for processing:', text.substring(0, 200) + '...');

    // OCR + Amount extraction
    ocrData = await ocrService.extractAmounts(text, mode);
    console.log('🔍 OCR Results:', {
      tokensFound: ocrData.raw_tokens?.length,
      tokens: ocrData.raw_tokens
    });

    if (!ocrData.raw_tokens || ocrData.raw_tokens.length === 0) {
      return res.json({ 
        status: 'no_amounts_found',
        mode_used: mode,
        text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        raw_text: text
      });
    }

    // Normalization
    const normalized = await normalizationService.normalize(ocrData.raw_tokens, mode);
    console.log('🔄 Normalization Results:', {
      inputTokens: ocrData.raw_tokens.length,
      outputAmounts: normalized.normalized_amounts?.length,
      amounts: normalized.normalized_amounts
    });

    if (!normalized.normalized_amounts || normalized.normalized_amounts.length === 0) {
      return res.json({ 
        status: 'no_amounts_found_after_normalization',
        mode_used: mode,
        raw_tokens: ocrData.raw_tokens,
        normalization_result: normalized
      });
    }

    // Classification - PASS THE RAW TEXT AND TOKENS
    const classified = await classificationService.classify(
      normalized.normalized_amounts, 
      text, // Pass original text
      mode,
      ocrData.raw_tokens // Pass raw tokens for context
    );
    
    console.log('🏷️ Classification Results:', {
      inputAmounts: normalized.normalized_amounts.length,
      outputClassifications: classified.amounts?.length,
      classifications: classified.amounts
    });

    // AI Validation (only in aiEnhanced mode)
    let validation = { valid: true, confidence: 0.85 };
    if (mode === 'aiEnhanced') {
      console.log('🤖 Running AI validation...');
      validation = await validateWithAI(ocrData, normalized, classified, text);
    }

    if (!validation.valid || validation.recommendation === 'needs_clarification') {
      return res.json({
        status: 'needs_clarification',
        reason: validation.issues?.join(', ') || 'AI validation failed',
        confidence: validation.confidence,
        mode_used: mode,
        validation_details: validation
      });
    }

    // Final Output
    const final = await finalService.createFinal(classified.amounts, ocrData.currency_hint);
    
    // Enhanced response with pipeline details
    const enhancedResponse = {
      ...final,
      pipeline_confidence: validation.confidence,
      mode_used: mode,
      pipeline_steps: {
        ocr: { tokens_found: ocrData.raw_tokens.length, confidence: ocrData.confidence },
        normalization: { amounts_normalized: normalized.normalized_amounts.length, confidence: normalized.normalization_confidence },
        classification: { amounts_classified: classified.amounts.length, confidence: classified.confidence },
        validation: validation
      }
    };

    return res.json(enhancedResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};