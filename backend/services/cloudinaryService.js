const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the temporary uploaded file
 * @param {string} folder - Cloudinary folder to organize uploads
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, folder = 'form-builder') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
        { format: 'auto' }
      ]
    });

    console.log('📤 Image uploaded to Cloudinary:', {
      public_id: result.public_id,
      url: result.secure_url,
      size: `${result.width}x${result.height}`,
      format: result.format,
      bytes: result.bytes
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Upload image from data URL (base64) to Cloudinary
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} folder - Cloudinary folder to upload to (optional)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadFromDataUrlToCloudinary = async (dataUrl, folder = 'form-builder') => {
  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
        { format: 'auto' }
      ]
    });
    
    console.log('📤 Image uploaded from data URL to Cloudinary:', {
      public_id: result.public_id,
      url: result.secure_url,
      size: `${result.width}x${result.height}`,
      format: result.format,
      bytes: result.bytes
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('❌ Cloudinary upload from data URL error:', error);
    throw new Error('Failed to upload image from data URL to Cloudinary');
  }
};

/**
 * Upload image from URL to Cloudinary
 * @param {string} imageUrl - URL of the image to upload
 * @param {string} folder - Cloudinary folder to upload to (optional)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadFromUrlToCloudinary = async (imageUrl, folder = 'form-builder') => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
        { format: 'auto' }
      ]
    });
    
    console.log('📤 Image uploaded from URL to Cloudinary:', {
      public_id: result.public_id,
      url: result.secure_url,
      original_url: imageUrl,
      size: `${result.width}x${result.height}`,
      format: result.format,
      bytes: result.bytes
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('❌ Cloudinary upload from URL error:', error);
    throw new Error('Failed to upload image from URL to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<object>} - Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
const extractPublicId = (url) => {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }
    
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      return null;
    }
    
    // Get the path after version (if present) or after upload
    let pathAfterUpload = urlParts.slice(uploadIndex + 1);
    
    // Remove version if present (starts with 'v' followed by numbers)
    if (pathAfterUpload[0] && pathAfterUpload[0].match(/^v\d+$/)) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }
    
    // Join the remaining parts and remove file extension
    const publicIdWithExtension = pathAfterUpload.join('/');
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('❌ Error extracting public ID:', error);
    return null;
  }
};

/**
 * Process images in form data and upload to Cloudinary if needed
 * @param {Object} formData - Form data containing potential image URLs
 * @returns {Promise<Object>} Updated form data with Cloudinary URLs
 */
const processFormImages = async (formData) => {
  try {
    const processedForm = { ...formData };
    let uploadCount = 0;
    
    console.log('🔄 Processing form images for Cloudinary upload...');
    
    // Process header image
    if (processedForm.headerImage && !processedForm.headerImage.includes('cloudinary.com')) {
      try {
        if (processedForm.headerImage.startsWith('data:image/')) {
          // It's a base64 data URL - upload directly
          const cloudinaryResult = await uploadFromDataUrlToCloudinary(processedForm.headerImage);
          processedForm.headerImage = cloudinaryResult.url;
          uploadCount++;
          console.log('✅ Header image uploaded to Cloudinary from data URL');
        } else if (processedForm.headerImage.startsWith('http')) {
          // It's a URL - upload from URL
          const cloudinaryResult = await uploadFromUrlToCloudinary(processedForm.headerImage);
          processedForm.headerImage = cloudinaryResult.url;
          uploadCount++;
          console.log('✅ Header image uploaded to Cloudinary from URL');
        } else if (processedForm.headerImage.startsWith('/uploads/')) {
          // It's a local file - convert to full path and upload
          const localPath = `./uploads/${processedForm.headerImage.split('/uploads/')[1]}`;
          if (fs.existsSync(localPath)) {
            const cloudinaryResult = await uploadToCloudinary(localPath);
            processedForm.headerImage = cloudinaryResult.url;
            uploadCount++;
            console.log('✅ Header image uploaded to Cloudinary from local file');
          }
        }
      } catch (error) {
        console.error('❌ Failed to upload header image:', error);
      }
    }
    
    // Process question images
    if (processedForm.questions && Array.isArray(processedForm.questions)) {
      for (let i = 0; i < processedForm.questions.length; i++) {
        const question = processedForm.questions[i];
        
        // Process question image
        if (question.image && !question.image.includes('cloudinary.com')) {
          try {
            if (question.image.startsWith('data:image/')) {
              // It's a base64 data URL - upload directly
              const cloudinaryResult = await uploadFromDataUrlToCloudinary(question.image);
              processedForm.questions[i].image = cloudinaryResult.url;
              uploadCount++;
              console.log(`✅ Question ${i + 1} image uploaded to Cloudinary from data URL`);
            } else if (question.image.startsWith('http')) {
              const cloudinaryResult = await uploadFromUrlToCloudinary(question.image);
              processedForm.questions[i].image = cloudinaryResult.url;
              uploadCount++;
              console.log(`✅ Question ${i + 1} image uploaded to Cloudinary from URL`);
            } else if (question.image.startsWith('/uploads/')) {
              const localPath = `./uploads/${question.image.split('/uploads/')[1]}`;
              if (fs.existsSync(localPath)) {
                const cloudinaryResult = await uploadToCloudinary(localPath);
                processedForm.questions[i].image = cloudinaryResult.url;
                uploadCount++;
                console.log(`✅ Question ${i + 1} image uploaded to Cloudinary from local file`);
              }
            }
          } catch (error) {
            console.error(`❌ Failed to upload question ${i + 1} image:`, error);
          }
        }
        
        // Process comprehension passage image
        if (question.type === 'comprehension' && 
            question.data?.passage?.image && 
            !question.data.passage.image.includes('cloudinary.com')) {
          try {
            if (question.data.passage.image.startsWith('data:image/')) {
              // It's a base64 data URL - upload directly
              const cloudinaryResult = await uploadFromDataUrlToCloudinary(question.data.passage.image);
              processedForm.questions[i].data.passage.image = cloudinaryResult.url;
              uploadCount++;
              console.log(`✅ Question ${i + 1} passage image uploaded to Cloudinary from data URL`);
            } else if (question.data.passage.image.startsWith('http')) {
              const cloudinaryResult = await uploadFromUrlToCloudinary(question.data.passage.image);
              processedForm.questions[i].data.passage.image = cloudinaryResult.url;
              uploadCount++;
              console.log(`✅ Question ${i + 1} passage image uploaded to Cloudinary from URL`);
            } else if (question.data.passage.image.startsWith('/uploads/')) {
              const localPath = `./uploads/${question.data.passage.image.split('/uploads/')[1]}`;
              if (fs.existsSync(localPath)) {
                const cloudinaryResult = await uploadToCloudinary(localPath);
                processedForm.questions[i].data.passage.image = cloudinaryResult.url;
                uploadCount++;
                console.log(`✅ Question ${i + 1} passage image uploaded to Cloudinary from local file`);
              }
            }
          } catch (error) {
            console.error(`❌ Failed to upload question ${i + 1} passage image:`, error);
          }
        }
        
        // Process categorize item images
        if (question.type === 'categorize' && question.data?.items) {
          for (let j = 0; j < question.data.items.length; j++) {
            const item = question.data.items[j];
            if (item.image && !item.image.includes('cloudinary.com')) {
              try {
                if (item.image.startsWith('data:image/')) {
                  // It's a base64 data URL - upload directly
                  const cloudinaryResult = await uploadFromDataUrlToCloudinary(item.image);
                  processedForm.questions[i].data.items[j].image = cloudinaryResult.url;
                  uploadCount++;
                  console.log(`✅ Question ${i + 1} item ${j + 1} image uploaded to Cloudinary from data URL`);
                } else if (item.image.startsWith('http')) {
                  const cloudinaryResult = await uploadFromUrlToCloudinary(item.image);
                  processedForm.questions[i].data.items[j].image = cloudinaryResult.url;
                  uploadCount++;
                  console.log(`✅ Question ${i + 1} item ${j + 1} image uploaded to Cloudinary from URL`);
                } else if (item.image.startsWith('/uploads/')) {
                  const localPath = `./uploads/${item.image.split('/uploads/')[1]}`;
                  if (fs.existsSync(localPath)) {
                    const cloudinaryResult = await uploadToCloudinary(localPath);
                    processedForm.questions[i].data.items[j].image = cloudinaryResult.url;
                    uploadCount++;
                    console.log(`✅ Question ${i + 1} item ${j + 1} image uploaded to Cloudinary from local file`);
                  }
                }
              } catch (error) {
                console.error(`❌ Failed to upload question ${i + 1} item ${j + 1} image:`, error);
              }
            }
          }
        }
      }
    }
    
    if (uploadCount > 0) {
      console.log(`🎉 Successfully uploaded ${uploadCount} images to Cloudinary`);
    } else {
      console.log('ℹ️  No new images to upload to Cloudinary');
    }
    
    return processedForm;
  } catch (error) {
    console.error('❌ Error processing form images:', error);
    return formData; // Return original data if processing fails
  }
};

module.exports = {
  uploadToCloudinary,
  uploadFromUrlToCloudinary,
  uploadFromDataUrlToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  processFormImages
};
