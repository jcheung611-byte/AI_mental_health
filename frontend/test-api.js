// Quick test script to verify Portkey API is working
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai').default;

console.log('\n🔍 Testing Portkey API Configuration...\n');

// Check if env vars are loaded
console.log('Environment variables loaded:');
console.log('- PORTKEY_API_KEY:', process.env.PORTKEY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- PORTKEY_VIRTUAL_KEY:', process.env.PORTKEY_VIRTUAL_KEY ? '✅ Set' : '❌ Missing');
console.log('- PORTKEY_BASE_URL:', process.env.PORTKEY_BASE_URL || '❌ Missing');
console.log('');

if (!process.env.PORTKEY_API_KEY || !process.env.PORTKEY_VIRTUAL_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('Make sure you edited .env.local with your real keys.');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.PORTKEY_API_KEY,
  baseURL: process.env.PORTKEY_BASE_URL,
  defaultHeaders: {
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY,
  },
});

async function testAPI() {
  try {
    console.log('📡 Sending test request to Portkey → OpenAI...\n');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello! API is working perfectly." in a friendly way.',
        },
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content || 'No response';
    
    console.log('✅ SUCCESS! API is working!\n');
    console.log('📝 Response from GPT-4:');
    console.log('━'.repeat(50));
    console.log(response);
    console.log('━'.repeat(50));
    console.log('\n🎉 Your Portkey setup is configured correctly!');
    console.log('You can now run: npm run dev\n');
    
  } catch (error) {
    console.error('❌ ERROR: API call failed\n');
    console.error('Error details:', error.message);
    
    if (error.status === 401) {
      console.error('\n💡 This looks like an authentication error.');
      console.error('   Check that your PORTKEY_API_KEY and PORTKEY_VIRTUAL_KEY are correct.');
    } else if (error.status === 404) {
      console.error('\n💡 This might be a base URL issue.');
      console.error('   Make sure PORTKEY_BASE_URL is: https://api.portkey.ai/v1');
    }
    
    process.exit(1);
  }
}

testAPI();




