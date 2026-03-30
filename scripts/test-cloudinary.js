require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing Cloudinary with credentials:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);

async function test() {
  try {
    const result = await cloudinary.api.ping();
    console.log('Ping Result:', result);
    
    // Attempt a dummy upload
    console.log('Attempting dummy upload...');
    const upload = await cloudinary.uploader.upload('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', {
      folder: 'kzora-test'
    });
    console.log('Upload Result SUCCESS:', upload.secure_url);
  } catch (error) {
    console.error('Cloudinary Test FAILED:');
    console.error(error);
  }
}

test();
