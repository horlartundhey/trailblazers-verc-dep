// components/GalleryImageForm.js
import React, { useState, useEffect } from 'react';
import API from '../utils/api';


const GalleryImageForm = () => {
  const [formData, setFormData] = useState({
    category: 'worship',
    caption: '',
    collection: '',
    imageFile: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
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
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        return;
      }
      if (file.size > maxSize) {
        setError('File is too large. Maximum size is 5MB.');
        return;
      }
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('category', formData.category);
      formDataToSend.append('caption', formData.caption);
      formDataToSend.append('collection', formData.collection);
      formDataToSend.append('image', formData.imageFile);

      const response = await API.post('/api/gallery', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setGalleryImages(prev => [response.data.data, ...prev]);
      setSuccess('Image uploaded successfully!');
      setFormData({ category: 'worship', caption: '', collection: '', imageFile: null });
      setPreviewImage(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
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
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700">Caption</label>
            <input
              type="text"
              name="caption"
              id="caption"
              value={formData.caption}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="collection" className="block text-sm font-medium text-gray-700">Collection</label>
            <input
              type="text"
              name="collection"
              id="collection"
              value={formData.collection}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="mx-auto h-32 w-auto object-cover rounded-md"
                  />
                ) : (
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="imageUpload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload an image</span>
                    <input
                      id="imageUpload"
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="sr-only"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData(prev => ({ ...prev, imageFile: null }));
                      }}
                      className="ml-3 text-sm text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 5MB</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Uploading...' : 'Upload Image'}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{image.caption}</td>
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