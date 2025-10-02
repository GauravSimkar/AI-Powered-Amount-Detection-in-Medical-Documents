const BASE_URL = 'http://localhost:3000/api';

const testCases = [
  {
    name: 'Simple Bill',
    endpoint: '/detect-amounts',
    body: {
      text: 'Total: Rs 1200, Paid: 1000, Due: 200'
    }
  },
  {
    name: 'Complex Bill',
    endpoint: '/detect-amounts',
    body: {
      text: 'Consultation: 500, Medicine: 300, Tests: 400, Total: 1200, Paid: 1000, Balance: 200'
    }
  },
  {
    name: 'Noisy OCR Text',
    endpoint: '/detect-amounts',
    body: {
      text: 'T0tal: Rs l200 | Pald: 1000'
    }
  },
  {
    name: 'USD Currency',
    endpoint: '/detect-amounts',
    body: {
      text: 'Total: $150, Paid: $100, Due: $50'
    }
  },
  {
    name: 'Step 1 - OCR Only',
    endpoint: '/ocr',
    body: {
      text: 'Total: INR 1200'
    }
  },
  {
    name: 'Step 2 - Normalization',
    endpoint: '/normalize',
    body: {
      raw_tokens: ['1,200', '1000', '200', '10%'] 
    }
  },
  {
    name: 'Step 3 - Classification',
    endpoint: '/classify',
    body: {
      normalized_amounts: [1200, 1000, 200],  
      raw_text: 'Total: 1200, Paid: 1000, Due: 200'
    }
  },
  {
    name: 'Step 4 - Final Output',
    endpoint: '/final',
    body: {
      amounts: [
        { type: "total_bill", value: 1200 },
        { type: "paid", value: 1000 },
        { type: "due", value: 200 }
      ],
      currency_hint: "INR"
    }
  },
  {
    name: 'Guardrail - No Amounts Found',
    endpoint: '/detect-amounts',
    body: {
      text: 'This is just random text with no numbers'
    }
  },
  {
    name: 'Guardrail - Empty Text',
    endpoint: '/detect-amounts',
    body: {
      text: ''
    }
  },
  {
    name: 'Multiple Currencies Mixed',
    endpoint: '/detect-amounts',
    body: {
      text: 'Doctor fee: Rs 500, Lab tests: Rs 300, Total: Rs 800'
    }
  }
];

const runTests = async () => {
  console.log('🚀 Starting API Tests\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    console.log(`\n🧪 Test: ${test.name}`);
    console.log('─'.repeat(60));
    
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      
      if (response.ok || response.status === 400) {  // 400 is expected for some guardrail tests
        console.log('✅ Status:', response.status);
        console.log('📦 Response:', JSON.stringify(data, null, 2));
        passed++;
      } else {
        console.log('❌ Status:', response.status);
        console.log('📦 Error:', JSON.stringify(data, null, 2));
        failed++;
      }
    } catch (error) {
      console.error('❌ Network Error:', error.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed}/${testCases.length} passed`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('\n✅ All tests completed!');
};

runTests();