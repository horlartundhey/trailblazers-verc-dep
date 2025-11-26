import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';

const BackButton = ({ showHome = true, customPath = null }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (customPath) {
      navigate(customPath);
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Back</span>
      </button>
      
      {showHome && (
        <button
          onClick={handleHome}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors duration-200"
        >
          <HomeIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Home</span>
        </button>
      )}
    </div>
  );
};

export default BackButton;
