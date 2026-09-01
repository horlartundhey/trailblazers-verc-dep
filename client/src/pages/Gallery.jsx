import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import { X, Calendar, Users, Heart, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import API from '../utils/api';

const gridStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardFadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const Gallery = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPrograms();
  }, []);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedProgram) return;
      
      if (e.key === 'ArrowLeft') {
        if (selectedProgram?.images) {
          setCurrentImageIndex((prev) => 
            prev === 0 ? selectedProgram.images.length - 1 : prev - 1
          );
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedProgram?.images) {
          setCurrentImageIndex((prev) => 
            prev === selectedProgram.images.length - 1 ? 0 : prev + 1
          );
        }
      } else if (e.key === 'Escape') {
        setSelectedProgram(null);
        setCurrentImageIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/gallery/programs');
      if (response.data.success) {
        setPrograms((response.data.data || []).sort((a, b) => new Date(b.programDate || 0) - new Date(a.programDate || 0)));
      }
    } catch (error) {
      console.error('Failed to fetch gallery programs:', error);
      setError('Failed to load gallery. Please try again later.');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const openProgramModal = (program) => {
    setSelectedProgram(program);
    setCurrentImageIndex(0);
  };

  const closeModal = () => {
    setSelectedProgram(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedProgram?.images) {
      setCurrentImageIndex((prev) => 
        prev === selectedProgram.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedProgram?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedProgram.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex justify-center items-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <PageHeader
          eyebrow="Moments Captured"
          title="Gallery"
          subtitle="Celebrating moments of faith, fellowship, and transformation."
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20">
          <BackButton />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {programs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg shadow-indigo-900/5">
              <ImageOff className="h-10 w-10 text-indigo-200 mx-auto mb-3" />
              <p className="text-gray-500">No programs available yet. Check back soon!</p>
            </div>
          ) : (
            <motion.div
              variants={gridStagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {programs.map((program) => (
                <motion.div
                  key={program._id}
                  variants={cardFadeUp}
                  whileHover={{ y: -4, boxShadow: '0 16px 32px -8px rgba(79,70,229,0.15)' }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
                  onClick={() => openProgramModal(program)}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={program.thumbnailImage || '/placeholder-gallery.jpg'}
                      alt={program.programTitle}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 bg-indigo-700/90 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {program.images?.length || 0} Photos
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-indigo-950 mb-2 leading-snug">
                      {program.programTitle}
                    </h3>

                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                      {new Date(program.programDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                      {program.description}
                    </p>

                    {(program.attendees || program.healings) && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                        {program.attendees && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1 text-indigo-500" />
                            <span>{program.attendees} attendees</span>
                          </div>
                        )}
                        {program.healings && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Heart className="h-4 w-4 mr-1 text-red-500" />
                            <span>{program.healings} healings</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Program Detail Modal */}
          <AnimatePresence>
          {selectedProgram && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl"
              >
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center rounded-t-2xl flex-shrink-0">
                  <h2 className="text-xl font-bold text-indigo-950">
                    {selectedProgram.programTitle}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-grow">
                  <div className="flex items-center text-gray-600 mb-3 text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(selectedProgram.programDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">About This Event</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProgram.description}</p>
                  </div>
                  
                  {selectedProgram.messageShared && (
                    <div className="bg-indigo-50 border-l-4 border-indigo-700 rounded-r-lg p-3 mb-4">
                      <h4 className="font-semibold text-sm text-indigo-950 mb-1">Message Shared</h4>
                      <p className="text-sm text-gray-700">{selectedProgram.messageShared}</p>
                    </div>
                  )}
                  
                  {selectedProgram.testimony && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">Testimony</h4>
                      <p className="text-sm text-gray-700 italic">"{selectedProgram.testimony}"</p>
                    </div>
                  )}
                  
                  {(selectedProgram.attendees || selectedProgram.healings) && (
                    <div className="flex gap-4 mb-4">
                      {selectedProgram.attendees && (
                        <div className="bg-indigo-50 rounded-lg p-3 flex items-center flex-1">
                          <Users className="h-6 w-6 text-indigo-600 mr-2" />
                          <div>
                            <p className="text-xl font-bold text-indigo-900">{selectedProgram.attendees}</p>
                            <p className="text-xs text-gray-600">Attendees</p>
                          </div>
                        </div>
                      )}
                      {selectedProgram.healings && (
                        <div className="bg-red-50 rounded-lg p-3 flex items-center flex-1">
                          <Heart className="h-6 w-6 text-red-500 mr-2" />
                          <div>
                            <p className="text-xl font-bold text-red-900">{selectedProgram.healings}</p>
                            <p className="text-xs text-gray-600">Healings</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Photo Gallery</h3>
                  
                  {/* Carousel Container */}
                  {selectedProgram.images && selectedProgram.images.length > 0 ? (
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      {/* Main Image / Video Display */}
                      <div className="relative" style={{height: 'clamp(320px, 60vh, 680px)'}}>
                        {selectedProgram.images[currentImageIndex]?.videoUrl ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${selectedProgram.images[currentImageIndex].videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([-\w]{11})/)?.[1]}`}
                            title={selectedProgram.images[currentImageIndex]?.caption || `Video ${currentImageIndex + 1}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <img
                            src={selectedProgram.images[currentImageIndex]?.src}
                            alt={selectedProgram.images[currentImageIndex]?.caption || `Photo ${currentImageIndex + 1}`}
                            className="w-full h-full object-contain"
                          />
                        )}
                        
                        {/* Image Caption */}
                        {selectedProgram.images[currentImageIndex]?.caption && !selectedProgram.images[currentImageIndex]?.videoUrl && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm p-3">
                            {selectedProgram.images[currentImageIndex].caption}
                          </div>
                        )}
                        
                        {/* Navigation Arrows */}
                        {selectedProgram.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="h-6 w-6 text-gray-800" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                              aria-label="Next image"
                            >
                              <ChevronRight className="h-6 w-6 text-gray-800" />
                            </button>
                          </>
                        )}
                        
                        {/* Image Counter */}
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {selectedProgram.images.length}
                        </div>
                      </div>
                      
                      {/* Thumbnail Navigation */}
                      {selectedProgram.images.length > 1 && (
                        <div className="flex gap-2 p-3 overflow-x-auto bg-gray-200">
                          {selectedProgram.images.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => goToImage(index)}
                              className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all relative ${
                                index === currentImageIndex
                                  ? 'border-indigo-600 shadow-lg'
                                  : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={img.src}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {img.videoUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No images available</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
