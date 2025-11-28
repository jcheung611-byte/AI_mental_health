// Test with VertexAI models
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai').default;

console.log('\n🔍 Testing DoorDash VertexAI Gateway\n');

const openai = new OpenAI({
  apiKey: process.env.PORTKEY_API_KEY,
  baseURL: process.env.PORTKEY_BASE_URL,
  defaultHeaders: {
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY,
  },
});

async function testVertexAI() {
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'claude-3-5-sonnet-20241022', // Sometimes VertexAI has Anthropic models
  ];

  for (const model of modelsToTry) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Testing model: ${model}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello! The API is working." in a friendly way.',
          },
        ],
        max_tokens: 50,
      });

      const response = completion.choices[0]?.message?.content || 'No response';
      
      console.log('✅ SUCCESS!');
      console.log('Response:', response);
      console.log(`\n🎉 Working model: ${model}`);
      console.log('Update your code to use this model!\n');
      return model;
      
    } catch (error) {
      console.log('❌ Failed:', error.message.split('\n')[0]);
    }
  }
  
  console.log('\n❌ None of the common models worked.');
  console.log('Check with your team which VertexAI models are available in your DoorDash setup.');
}

testVertexAI();



