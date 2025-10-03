/*

Base URL: https://ai-powered-amount-detection-in-medical.onrender.com/api

My Api looks like: for OCR/Text Extraction
using Fast mode- https://ai-powered-amount-detection-in-medical.onrender.com/api/ocr?mode=fast
using Ai Enhanced mode- https://ai-powered-amount-detection-in-medical.onrender.com/api/ocr?mode=aiEnhanced

The above structure will follow in all the below mentioned endpoints 




🧪 Test Case 1: OCR Endpoint

Method	POST
Endpoint	/ocr?mode=fast   /ocr?mode=aiEnhanced
Content-Type	application/json

Request Body (JSON)
{
    "name": "Complex Bill",
    "text": "Consultation: 500, Medicine: 300, Tests: 400, Total: 1200, Paid: 1000, Balance: 200"
}
Expected Response (200 OK)
{
  "raw_tokens": ["500", "300", "400", "1200", "1000", "200"],
  "currency_hint": "USD",
  "confidence": 0.95,
  "method": "regex",
  "note": "Extracted 6 monetary amounts",
  "mode_used": "fast",
  "text": "Consultation: 500, Medicine: 300, Tests: 400, Total: 1200, Paid: 1000, Balance: 200"
}





🧪 Test Case 2: Normalize Endpoint 

Method	POST
Endpoint	/normalize?mode=fast   /normalize?mode=aiEnhanced
Content-Type	application/json

Request Body (JSON)
{
    "name": "Normalization Test",
    "tokens": ["500", "300", "400", "1200", "1000", "200"]
}
Expected Response (200 OK)
{
  "normalized_amounts": [1200, 1000, 500, 400, 300, 200],
  "normalization_confidence": 0.95,
  "method": "regex",
  "note": "Normalized 6 medical amounts from 6 tokens",
  "mode_used": "fast",
  "input_tokens_count": 6
}





🧪 Test Case 3: Classify Endpoint

Method	POST
Endpoint	/classify?mode=fast   /classify?mode=aiEnhanced
Content-Type	application/json

Request Body (JSON)
{
    "name": "Classification Test",
    "normalizedAmounts": [1200, 1000, 500, 400, 300, 200],
    "text": "Consultation: 500, Medicine: 300, Tests: 400, Total: 1200, Paid: 1000, Balance: 200"
}
Expected Response (200 OK)
{
  "amounts": [
    {"type": "total_bill", "value": 1200, "confidence": 0.9},
    {"type": "paid", "value": 1000, "confidence": 0.9},
    {"type": "consultation_fee", "value": 500, "confidence": 0.9},
    {"type": "test", "value": 400, "confidence": 0.9},
    {"type": "medicine", "value": 300, "confidence": 0.9},
    {"type": "due", "value": 200, "confidence": 0.9}
  ],
  "confidence": 0.8,
  "method": "rules",
  "note": "Classification with exact matching",
  "mode_used": "fast",
  "input_amounts_count": 6
}






🧪 Test Case 4: Final Endpoint

Method	POST
Endpoint	/final
Content-Type	application/json

Request Body (JSON)
{
    "name": "Final Output Test",
    "amounts": [
        {"type": "total_bill", "value": 1200, "confidence": 0.9},
        {"type": "paid", "value": 1000, "confidence": 0.9},
        {"type": "consultation_fee", "value": 500, "confidence": 0.9},
        {"type": "test", "value": 400, "confidence": 0.9},
        {"type": "medicine", "value": 300, "confidence": 0.9},
        {"type": "due", "value": 200, "confidence": 0.9}
    ],
    "currency": "USD"
}
Expected Response (200 OK)
{
  "currency": "USD",
  "amounts": [
    {
      "type": "total_bill",
      "value": 1200,
      "source": "text: 'Total: $ 1200'"
    },
    {
      "type": "paid",
      "value": 1000,
      "source": "text: 'Paid: $ 1000'"
    },
    {
      "type": "consultation_fee",
      "value": 500,
      "source": "text: 'Consultation: $ 500'"
    },
    {
      "type": "test",
      "value": 400,
      "source": "text: 'Test: $ 400'"
    },
    {
      "type": "medicine",
      "value": 300,
      "source": "text: 'Medicine: $ 300'"
    },
    {
      "type": "due",
      "value": 200,
      "source": "text: 'Due: $ 200'"
    }
  ],
  "status": "ok",
  "mode_used": "final"
}




🧪 Test Case 5: Detect Amounts Endpoint

Method	POST  
Endpoint	/detect-amounts?mode=fast   /detect-amounts?mode=aiEnhanced
Content-Type	application/json

Request Body (JSON)
{
    "name": "Full Pipeline Test",
    "text": "Consultation: 500, Medicine: 300, Tests: 400, Total: 1200, Paid: 1000, Balance: 200"
}
Expected Response (200 OK)
{
  "currency": "USD",
  "amounts": [
    {"type": "total_bill", "value": 1200, "source": "text: 'Total: $ 1200'"},
    {"type": "paid", "value": 1000, "source": "text: 'Paid: $ 1000'"},
    {"type": "consultation_fee", "value": 500, "source": "text: 'Consultation: $ 500'"},
    {"type": "test", "value": 400, "source": "text: 'Test: $ 400'"},
    {"type": "medicine", "value": 300, "source": "text: 'Medicine: $ 300'"},
    {"type": "due", "value": 200, "source": "text: 'Due: $ 200'"}
  ],
  "status": "ok",
  "pipeline_confidence": 0.85,
  "mode_used": "fast",
  "pipeline_steps": {
    "ocr": {"tokens_found": 6, "confidence": 0.95},
    "normalization": {"amounts_normalized": 6, "confidence": 0.95},
    "classification": {"amounts_classified": 6, "confidence": 0.8},
    "validation": {"valid": true, "confidence": 0.85}
  }
}



🧪 Test Case 6: All the Endpoints (for image)

Method	POST
Content-Type	multipart/form-data

Request Body (Form Data)

Key	              Value	                          Type          
image	      [Select medical bill image]	      File


*/
