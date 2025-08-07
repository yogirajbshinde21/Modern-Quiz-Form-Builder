const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('URI (partially hidden):', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':***@'));

// Test different URI formats
const testURIs = [
  // Original format
  process.env.MONGODB_URI,
  // Try with double encoding
  process.env.MONGODB_URI.replace('@', '%40'),
  // Try with different encoding
  'mongodb+srv://yogirajbshinde21:Guru%402109@cluster0.a0qkt30.mongodb.net/formbuilder?retryWrites=true&w=majority'
];

async function testConnection(uri, label) {
  try {
    console.log(`\n🧪 Testing ${label}...`);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ ${label} - SUCCESS!`);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`❌ ${label} - FAILED:`, error.message);
    return false;
  }
}

async function runTests() {
  for (let i = 0; i < testURIs.length; i++) {
    const success = await testConnection(testURIs[i], `URI ${i + 1}`);
    if (success) {
      console.log('\n🎉 Found working URI!');
      break;
    }
  }
  process.exit(0);
}

runTests();
