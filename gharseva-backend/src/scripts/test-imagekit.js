require('dotenv').config();
const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function testUpload() {
  console.log('--- ImageKit Connection Test ---');
  console.log('Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);
  console.log('Public Key:', process.env.IMAGEKIT_PUBLIC_KEY ? 'Present' : 'MISSING');
  console.log('Private Key:', process.env.IMAGEKIT_PRIVATE_KEY ? 'Present' : 'MISSING');

  try {
    // Create a tiny dummy buffer for testing
    const dummyBuffer = Buffer.from('test image data');
    
    console.log('\nAttempting test upload...');
    const response = await imagekit.upload({
      file: dummyBuffer,
      fileName: `test_${Date.now()}.txt`,
      folder: 'test_uploads',
    });

    console.log('\n✅ UPLOAD SUCCESS!');
    console.log('File URL:', response.url);
    console.log('File Path:', response.filePath);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ UPLOAD FAILED!');
    console.error('Error Message:', err.message);
    if (err.help) console.log('Help:', err.help);
    process.exit(1);
  }
}

testUpload();
