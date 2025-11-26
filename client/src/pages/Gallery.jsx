import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { X, Calendar, Users, Heart } from 'lucide-react';
import API from '../utils/api';

const Gallery = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/gallery/programs');
      if (response.data.success) {
        setPrograms(response.data.data || []);
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
  };

  const closeModal = () => {
    setSelectedProgram(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-800"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-purple-50">
        <div className="container mx-auto px-4 md:px-6 py-16">
          <BackButton />
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-4">
              Gallery
            </h1>
            <div className="w-24 h-1 bg-yellow-300 mx-auto mb-6"></div>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Celebrating moments of faith, fellowship, and transformation
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {programs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No programs available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programs.map((program) => (
                <div
                  key={program._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => openProgramModal(program)}
                >
                  <div className="relative h-64">
                    <img
                      src={program.thumbnailImage || '/placeholder-gallery.jpg'}
                      alt={program.programTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-purple-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {program.images?.length || 0} Photos
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-purple-900 mb-2">
                      {program.programTitle}
                    </h3>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(program.programDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    
                    <p className="text-gray-700 line-clamp-3 mb-4">
                      {program.description}
                    </p>
                    
                    {(program.attendees || program.healings) && (
                      <div className="flex items-center gap-4 pt-4 border-t">
                        {program.attendees && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-1 text-purple-600" />
                            <span>{program.attendees} attendees</span>
                          </div>
                        )}
                        {program.healings && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Heart className="h-4 w-4 mr-1 text-red-500" />
                            <span>{program.healings} healings</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Program Detail Modal */}
          {selectedProgram && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="bg-white border-b px-4 py-3 flex justify-between items-center rounded-t-lg flex-shrink-0">
                  <h2 className="text-xl font-bold text-purple-900">
                    {selectedProgram.programTitle}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
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
                    <div className="bg-purple-50 border-l-4 border-purple-800 p-3 mb-4">
                      <h4 className="font-semibold text-sm text-purple-900 mb-1">Message Shared</h4>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedProgram.images?.map((img, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={img.src}
                          alt={img.caption || `Photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                        />
                        {img.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 rounded-b-lg">
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
