// Test script to verify Cloudinary integration
// Run this with: node test-cloudinary.js

require('dotenv').config();
const { uploadToCloudinary } = require('./services/cloudinaryService');
const path = require('path');

async function testCloudinary() {
  console.log('Testing Cloudinary integration...');
  
  // Check if environment variables are set
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary environment variables not set');
    console.log('Required variables:');
    console.log('- CLOUDINARY_CLOUD_NAME');
    console.log('- CLOUDINARY_API_KEY'); 
    console.log('- CLOUDINARY_API_SECRET');
    return;
  }
  
  console.log('✅ Environment variables found');
  console.log(`Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  
  // Test with a sample image (you can replace this with an actual image path)
  const testImagePath = path.join(__dirname, 'uploads'); // Assuming you have some test images
  
  console.log('🚀 Cloudinary service is ready for testing');
  console.log('To test upload, use the /api/forms/upload endpoint with a real image file');
}

testCloudinary().catch(console.error);
