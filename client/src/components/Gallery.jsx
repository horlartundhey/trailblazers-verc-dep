// components/Gallery.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const Gallery = () => {
  const [galleryImages, setGalleryImages] = useState([]); // Initialize as empty array
  const [categories] = useState(['all', 'worship', 'baptism', 'community', 'youth', 'missions']);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionImages, setCollectionImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/gallery');
        setGalleryImages(response.data.data || []); // Fallback to empty array
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch gallery images. Please check if the server is running.');
        setGalleryImages([]); // Ensure galleryImages is an array
        setLoading(false);
        console.error('Failed to fetch gallery images:', error);
      }
    };
    fetchImages();
  }, []);

  const filteredImages = activeCategory === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeCategory);

  const collections = filteredImages
    ? [...new Set(filteredImages.map(img => img.collection))]
    : [];

  const openCollectionModal = async (collection) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/gallery/collection/${encodeURIComponent(collection)}`);
      setCollectionImages(response.data.data || []);
      setSelectedCollection(collection);
      setIsModalOpen(true);
      setLoading(false);
    } catch (error) {
      setError('Failed to load collection');
      setLoading(false);
      console.error('Failed to load collection:', error);
    }
  };

  const closeModal = () => {
    setSelectedCollection(null);
    setCollectionImages([]);
    setIsModalOpen(false);
  };

  if (loading && galleryImages.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <section className="py-16 bg-purple-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-4">
            Gallery
          </h2>
          <div className="w-24 h-1 bg-yellow-300 mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Moments of faith, fellowship, and transformation
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full capitalize ${activeCategory === category
                ? 'bg-purple-800 text-white'
                : 'bg-white text-purple-800 border border-purple-800 hover:bg-purple-100'}`}
            >
              {category}
            </button>
          ))}
        </div>

        {collections.length === 0 ? (
          <p className="text-center text-gray-500">No collections available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {collections.map(collection => {
              const firstImage = filteredImages.find(img => img.collection === collection);
              return (
                <div
                  key={collection}
                  className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openCollectionModal(collection)}
                >
                  <img
                    src={firstImage?.src || '/images/placeholder.jpg'}
                    alt={collection}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium text-center px-4">{collection}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isModalOpen && selectedCollection && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-yellow-300"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="max-w-4xl w-full">
              <h3 className="text-white text-2xl mb-4">{selectedCollection}</h3>
              {loading ? (
                <div className="flex justify-center items-center h-64">Loading...</div>
              ) : collectionImages.length === 0 ? (
                <p className="text-white text-center">No images in this collection</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {collectionImages.map(img => (
                    <div key={img._id} className="relative">
                      <img
                        src={img.src}
                        alt={img.caption}
                        className="w-full h-48 object-cover rounded"
                      />
                      <p className="text-white text-center mt-2">{img.caption}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;