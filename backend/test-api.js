// test-api.js
const testAPI = async () => {
  const response = await fetch('http://localhost:3000/api/detect-amounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'Total: INR 1200 | Paid: 1000 | Due: 200'
    })
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
};

testAPI();