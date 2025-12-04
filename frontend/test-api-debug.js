// Debug test - tries different Portkey configurations
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai').default;

console.log('\n🔍 PORTKEY API DEBUG TEST\n');

// Show what we have (redacted)
const apiKey = process.env.PORTKEY_API_KEY || '';
const virtualKey = process.env.PORTKEY_VIRTUAL_KEY || '';
const baseUrl = process.env.PORTKEY_BASE_URL || '';

console.log('Configuration:');
console.log(`API Key: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)`);
console.log(`Virtual Key: ${virtualKey.substring(0, 10)}...${virtualKey.substring(virtualKey.length - 4)} (${virtualKey.length} chars)`);
console.log(`Base URL: ${baseUrl}`);
console.log('');

// Test 1: With x-portkey-virtual-key header
async function test1() {
  console.log('━'.repeat(60));
  console.log('TEST 1: Using x-portkey-virtual-key header');
  console.log('━'.repeat(60));
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.PORTKEY_API_KEY,
      baseURL: process.env.PORTKEY_BASE_URL,
      defaultHeaders: {
        'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY,
      },
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say hi' }],
      max_tokens: 10,
    });

    console.log('✅ SUCCESS with x-portkey-virtual-key!');
    console.log('Response:', completion.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.status);
      console.log('Headers sent:', error.request?.headers);
    }
    return false;
  }
}

// Test 2: With x-portkey-provider header (alternative format)
async function test2() {
  console.log('\n━'.repeat(60));
  console.log('TEST 2: Using x-portkey-provider header');
  console.log('━'.repeat(60));
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.PORTKEY_VIRTUAL_KEY, // Virtual key as main key
      baseURL: process.env.PORTKEY_BASE_URL,
      defaultHeaders: {
        'x-portkey-api-key': process.env.PORTKEY_API_KEY,
        'x-portkey-provider': 'openai',
      },
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say hi' }],
      max_tokens: 10,
    });

    console.log('✅ SUCCESS with x-portkey-provider!');
    console.log('Response:', completion.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

// Test 3: Virtual key as main API key (some setups work this way)
async function test3() {
  console.log('\n━'.repeat(60));
  console.log('TEST 3: Using virtual key as main API key');
  console.log('━'.repeat(60));
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.PORTKEY_VIRTUAL_KEY,
      baseURL: process.env.PORTKEY_BASE_URL,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say hi' }],
      max_tokens: 10,
    });

    console.log('✅ SUCCESS with virtual key as main key!');
    console.log('Response:', completion.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function runTests() {
  const result1 = await test1();
  if (result1) {
    console.log('\n🎉 Test 1 worked! Use this configuration.');
    return;
  }

  const result2 = await test2();
  if (result2) {
    console.log('\n🎉 Test 2 worked! I\'ll update the code to use this format.');
    return;
  }

  const result3 = await test3();
  if (result3) {
    console.log('\n🎉 Test 3 worked! I\'ll update the code to use this format.');
    return;
  }

  console.log('\n❌ All tests failed. Let\'s check:');
  console.log('1. Are both keys copied exactly from Portkey?');
  console.log('2. Is your Portkey account active with budget?');
  console.log('3. Does the virtual key have OpenAI access enabled?');
}

runTests();




