// components/GalleryImageForm.js
import React, { useState, useEffect } from 'react';
import API from '../utils/api';


const GalleryImageForm = () => {
  const [formData, setFormData] = useState({
    category: 'worship',
    caption: '',
    collection: '',
    programTitle: '',
    programDate: '',
    description: '',
    testimony: '',
    attendees: '',
    healings: '',
    messageShared: '',
    isPublic: true,
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const categories = ['worship', 'baptism', 'community', 'youth', 'missions'];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await API.get('/api/gallery');
        setGalleryImages(response.data.data);
      } catch (err) {
        setError('Failed to load gallery images');
        console.error(err);
      }
    };
    fetchImages();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError(`${file.name}: Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.`);
        continue;
      }
      if (file.size > maxSize) {
        setError(`${file.name}: File is too large. Maximum size is 5MB.`);
        continue;
      }
      validFiles.push(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({ file, preview: reader.result, caption: '' });
        if (newPreviews.length === validFiles.length) {
          setPreviewImages(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }
    
    setSelectedImages(prev => [...prev, ...validFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (selectedImages.length === 0) {
      setError('Please select at least one image');
      setLoading(false);
      return;
    }

    try {
      const uploadedImages = [];
      
      for (let i = 0; i < selectedImages.length; i++) {
        const formDataToSend = new FormData();
        formDataToSend.append('category', formData.category);
        formDataToSend.append('caption', previewImages[i]?.caption || `Image ${i + 1}`);
        formDataToSend.append('collection', formData.collection);
        formDataToSend.append('programTitle', formData.programTitle);
        formDataToSend.append('programDate', formData.programDate);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('testimony', formData.testimony);
        formDataToSend.append('attendees', formData.attendees || 0);
        formDataToSend.append('healings', formData.healings || 0);
        formDataToSend.append('messageShared', formData.messageShared);
        formDataToSend.append('isPublic', formData.isPublic);
        formDataToSend.append('image', selectedImages[i]);

        const response = await API.post('/api/gallery', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        uploadedImages.push(response.data.data);
      }

      setGalleryImages(prev => [...uploadedImages, ...prev]);
      setSuccess(`${uploadedImages.length} image(s) uploaded successfully!`);
      setFormData({ 
        category: 'worship', 
        caption: '', 
        collection: '', 
        programTitle: '',
        programDate: '',
        description: '',
        testimony: '',
        attendees: '',
        healings: '',
        messageShared: '',
        isPublic: true
      });
      setSelectedImages([]);
      setPreviewImages([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      setLoading(true);
      await API.delete(`/api/gallery/${imageId}`);
      setGalleryImages(prev => prev.filter(img => img._id !== imageId));
      setSuccess('Image deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
          <p>{success}</p>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
          {/* Program Title - REQUIRED */}
          <div className="sm:col-span-2">
            <label htmlFor="programTitle" className="block text-sm font-medium text-gray-700">
              Program Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="programTitle"
              id="programTitle"
              value={formData.programTitle}
              onChange={handleChange}
              required
              placeholder="e.g., Revival Night 2025"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">All images with the same program title will be grouped together</p>
          </div>

          {/* Program Date - REQUIRED */}
          <div>
            <label htmlFor="programDate" className="block text-sm font-medium text-gray-700">
              Program Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="programDate"
              id="programDate"
              value={formData.programDate}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Caption */}
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700">
              Caption <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="caption"
              id="caption"
              value={formData.caption}
              onChange={handleChange}
              required
              placeholder="e.g., Opening worship session"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Collection */}
          <div>
            <label htmlFor="collection" className="block text-sm font-medium text-gray-700">
              Collection <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="collection"
              id="collection"
              value={formData.collection}
              onChange={handleChange}
              required
              placeholder="e.g., January 2025"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Program Description</label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the program"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Testimony */}
          <div className="sm:col-span-2">
            <label htmlFor="testimony" className="block text-sm font-medium text-gray-700">Testimony</label>
            <textarea
              name="testimony"
              id="testimony"
              rows="3"
              value={formData.testimony}
              onChange={handleChange}
              placeholder="Testimonies from the program"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Attendees */}
          <div>
            <label htmlFor="attendees" className="block text-sm font-medium text-gray-700">Number of Attendees</label>
            <input
              type="number"
              name="attendees"
              id="attendees"
              min="0"
              value={formData.attendees}
              onChange={handleChange}
              placeholder="e.g., 250"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Healings */}
          <div>
            <label htmlFor="healings" className="block text-sm font-medium text-gray-700">Number of Healings</label>
            <input
              type="number"
              name="healings"
              id="healings"
              min="0"
              value={formData.healings}
              onChange={handleChange}
              placeholder="e.g., 12"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Message Shared */}
          <div className="sm:col-span-2">
            <label htmlFor="messageShared" className="block text-sm font-medium text-gray-700">Message Title</label>
            <input
              type="text"
              name="messageShared"
              id="messageShared"
              value={formData.messageShared}
              onChange={handleChange}
              placeholder="e.g., Faith in Action"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {/* Public Visibility */}
          <div className="sm:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPublic"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Make this image publicly visible
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div className="sm:col-span-2">
            <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">
              Images <span className="text-gray-500">(Multiple selection allowed)</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center w-full">
                {previewImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {previewImages.map((item, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={item.preview}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImages(prev => prev.filter((_, i) => i !== index));
                              setPreviewImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <input
                            type="text"
                            placeholder="Caption for this image"
                            value={item.caption}
                            onChange={(e) => {
                              const newPreviews = [...previewImages];
                              newPreviews[index].caption = e.target.value;
                              setPreviewImages(newPreviews);
                            }}
                            className="mt-2 w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">{previewImages.length} image(s) selected</p>
                  </div>
                ) : (
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="imageUpload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>{previewImages.length > 0 ? 'Add more images' : 'Upload images'}</span>
                    <input
                      id="imageUpload"
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  {previewImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImages([]);
                        setPreviewImages([]);
                      }}
                      className="ml-3 text-sm text-red-600 hover:text-red-800"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 5MB each. Select multiple files at once.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading || selectedImages.length === 0}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading || selectedImages.length === 0 ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? `Uploading ${selectedImages.length} image(s)...` : `Upload ${selectedImages.length || 0} Image(s)`}
          </button>
        </div>
      </form>

      {/* Images Table */}
      <div className="overflow-x-auto">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Existing Images</h4>
        {galleryImages.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caption</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {galleryImages.map(image => (
                <tr key={image._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={image.src} alt={image.caption} className="h-16 w-16 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{image.caption}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{image.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{image.collection}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{image.createdBy?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-4">No images found</p>
        )}
      </div>
    </div>
  );
};

export default GalleryImageForm;
