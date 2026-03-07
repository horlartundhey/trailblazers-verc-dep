import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import API from '../../utils/api';
import { getFullImagePath } from '../../utils/imageUtils';
import { getCurrentUser } from '../../redux/slices/authSlice';

// Profile Picture Upload Component
const ProfilePictureUpload = ({ profile, onUpdate }) => {
  const dispatch = useDispatch();
  // Handle both Cloudinary URLs and local paths
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return '/default-profile.png';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath; // Cloudinary URL
    }
    return getFullImagePath(imagePath); // Local path
  };
  
  const [previewImage, setPreviewImage] = useState(getProfileImageUrl(profile?.profilePicture));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Update preview when profile changes
  useEffect(() => {
    setPreviewImage(getProfileImageUrl(profile?.profilePicture));
  }, [profile?.profilePicture]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current.files[0]) return;
    
    const file = fileInputRef.current.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File is too large. Please select an image less than 5MB.');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await API.put('/api/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onUpdate(response.data.data);
      // Refresh Redux user state to update header avatar
      dispatch(getCurrentUser());
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative inline-block">
        <img
          src={previewImage || '/default-profile.png'}
          alt="Profile"
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />
      {fileInputRef.current?.files[0] && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 text-sm sm:text-base"
        >
          {uploading ? 'Uploading...' : 'Save Changes'}
        </button>
      )}
    </div>
  );
};

// Training List Component
const TrainingList = ({ trainings, onAddTraining, onRemoveTraining }) => {
  const [newTraining, setNewTraining] = useState('');

  const handleAdd = () => {
    if (newTraining.trim()) {
      onAddTraining(newTraining.trim());
      setNewTraining('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTraining}
          onChange={(e) => setNewTraining(e.target.value)}
          placeholder="Enter training completed"
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {trainings.map((training, index) => (
          <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span>{training}</span>
            <button
              onClick={() => onRemoveTraining(index)}
              className="text-red-500 hover:text-red-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Main Profile Management Component
const ProfileManagement = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [position, setPosition] = useState('');
  const [trainings, setTrainings] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const response = await API.get('/api/users/profile');
      const profileData = response.data.data;
      setProfile(profileData);
      setPosition(profileData.position || '');
      setTrainings(profileData.trainings || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await API.put('/api/users/profile', {
        position,
        trainings
      });
      setProfile(response.data.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleAddTraining = (training) => {
    setTrainings([...trainings, training]);
  };

  const handleRemoveTraining = (index) => {
    setTrainings(trainings.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center overflow-y-auto z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 my-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Profile Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-center py-4">
              <ProfilePictureUpload profile={profile} onUpdate={setProfile} />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Head of Technical Department"
                  />
                ) : (
                  <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg">{position || 'No position set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Trainings Completed</label>
                {isEditing ? (
                  <TrainingList
                    trainings={trainings}
                    onAddTraining={handleAddTraining}
                    onRemoveTraining={handleRemoveTraining}
                  />
                ) : (
                  <div className="mt-1 space-y-2">
                    {trainings.length > 0 ? (
                      trainings.map((training, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">{training}</div>
                      ))
                    ) : (
                      <p className="text-gray-500">No trainings added yet</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Account Information</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm sm:text-base">{profile.name}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm sm:text-base break-all">{profile.email}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm sm:text-base">{profile.role}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Region</label>
                <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm sm:text-base">{profile.region}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Campus</label>
                <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm sm:text-base">{profile.campus}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
