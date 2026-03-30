const cloudinary = require('cloudinary').v2;

// Hardcoding for quick diagnostic check
cloudinary.config({
  cloud_name: "dqo6bkp4c",
  api_key:    "194953676928295",
  api_secret: "sTFbNYFcCn8ScJwPmWpGljLfcYs",
});

console.log('Testing Cloudinary with hardcoded credentials:');
console.log('Cloud Name: dqo6bkp4c');

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
    console.log('Public ID:', upload.public_id);
  } catch (error) {
    console.error('Cloudinary Test FAILED:');
    console.error(error);
  }
}

test();
