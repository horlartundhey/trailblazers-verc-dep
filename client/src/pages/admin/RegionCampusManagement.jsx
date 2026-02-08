import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, MapPin, RefreshCw } from 'lucide-react';
import API from '../../utils/api';
import BackButton from '../../components/BackButton';

const AdminRegionCampusManagement = () => {
  const [activeTab, setActiveTab] = useState('regions');
  const [regions, setRegions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add-region', 'edit-region', 'add-campus', 'edit-campus'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentRegion: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
    fetchRegionsForDropdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchRegionsForDropdown = async () => {
    try {
      const response = await API.get('/api/region-campus/regions');
      setRegions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching regions for dropdown:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'regions') {
        const response = await API.get('/api/region-campus/regions');
        setRegions(response.data.data || []);
      } else {
        const response = await API.get('/api/region-campus/campuses');
        setCampuses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    
    if (item) {
      setFormData({
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        parentRegion: item.parentRegion?._id || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        parentRegion: ''
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
    setFormData({ name: '', code: '', description: '', parentRegion: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'add-region') {
        await API.post('/api/region-campus/regions', {
          name: formData.name,
          code: formData.code,
          description: formData.description
        });
        showMessage('success', 'Region created successfully');
      } else if (modalType === 'edit-region') {
        await API.put(`/api/region-campus/regions/${selectedItem._id}`, {
          name: formData.name,
          code: formData.code,
          description: formData.description
        });
        showMessage('success', 'Region updated successfully');
      } else if (modalType === 'add-campus') {
        await API.post('/api/region-campus/campuses', {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          parentRegion: formData.parentRegion
        });
        showMessage('success', 'Campus created successfully');
      } else if (modalType === 'edit-campus') {
        await API.put(`/api/region-campus/campuses/${selectedItem._id}`, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          parentRegion: formData.parentRegion
        });
        showMessage('success', 'Campus updated successfully');
      }
      
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save changes';
      showMessage('error', errorMessage);
    }
  };

  const handleDelete = async (type, id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      if (type === 'region') {
        await API.delete(`/api/region-campus/regions/${id}`);
        showMessage('success', 'Region deleted successfully');
      } else {
        await API.delete(`/api/region-campus/campuses/${id}`);
        showMessage('success', 'Campus deleted successfully');
      }
      
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete';
      showMessage('error', errorMessage);
    }
  };

  const handleSyncFromUsers = async () => {
    if (!confirm('This will import all regions and campuses from existing user records. Continue?')) {
      return;
    }

    setSyncing(true);
    try {
      const response = await API.post('/api/region-campus/sync');
      const { regionsCreated, campusesCreated, totalRegions, totalCampuses } = response.data;
      
      showMessage('success', 
        `Sync complete! Created ${regionsCreated} new regions and ${campusesCreated} new campuses. Total: ${totalRegions} regions, ${totalCampuses} campuses.`
      );
      
      fetchData();
      fetchRegionsForDropdown();
    } catch (error) {
      console.error('Error syncing:', error);
      const errorMessage = error.response?.data?.message || 'Failed to sync data';
      showMessage('error', errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6">
      <BackButton />
      <div className="mb-6 mt-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Region & Campus Management</h1>
            <p className="text-gray-600 mt-1">Manage regions and campuses for your organization. These will be available throughout the platform.</p>
          </div>
          
          {/* Sync Button */}
          <button
            onClick={handleSyncFromUsers}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Import from Users'}
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div 
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('regions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'regions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Regions ({regions.length})
          </button>
          <button
            onClick={() => setActiveTab('campuses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campuses'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campuses ({campuses.length})
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div>
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {activeTab === 'regions' ? 'All Regions' : 'All Campuses'}
          </h2>
          <button
            onClick={() => openModal(activeTab === 'regions' ? 'add-region' : 'add-campus')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'regions' ? 'Region' : 'Campus'}
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Regions Table */}
            {activeTab === 'regions' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {regions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          No regions found. Create your first region to get started.
                        </td>
                      </tr>
                    ) : (
                      regions.map((region) => (
                        <tr key={region._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{region.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {region.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{region.description || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {region.userCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openModal('edit-region', region)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('region', region._id, region.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Campuses Table */}
            {activeTab === 'campuses' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campuses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          No campuses found. Create your first campus to get started.
                        </td>
                      </tr>
                    ) : (
                      campuses.map((campus) => (
                        <tr key={campus._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{campus.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {campus.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{campus.parentRegion?.name || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{campus.description || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campus.userCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openModal('edit-campus', campus)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('campus', campus._id, campus.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'add-region' && 'Add New Region'}
                {modalType === 'edit-region' && 'Edit Region'}
                {modalType === 'add-campus' && 'Add New Campus'}
                {modalType === 'edit-campus' && 'Edit Campus'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    required
                    maxLength={10}
                  />
                  <p className="mt-1 text-xs text-gray-500">Short code (e.g., SW for South West)</p>
                </div>

                {(modalType === 'add-campus' || modalType === 'edit-campus') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.parentRegion}
                      onChange={(e) => setFormData({ ...formData, parentRegion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select a region</option>
                      {regions.map((region) => (
                        <option key={region._id} value={region._id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional description..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {modalType.startsWith('add') ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegionCampusManagement;
