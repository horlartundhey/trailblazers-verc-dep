import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const AdminUserActions = ({ user, onUpdate, onClose }) => {
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [regions, setRegions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [reassignData, setReassignData] = useState({ region: '', campus: '' });
  const [newRole, setNewRole] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegionsAndCampuses();
  }, []);

  const fetchRegionsAndCampuses = async () => {
    try {
      const [regionsRes, campusesRes] = await Promise.all([
        API.get('/api/region-campus/regions'),
        API.get('/api/region-campus/campuses')
      ]);
      setRegions(regionsRes.data.data || []);
      setCampuses(campusesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching regions/campuses:', err);
    }
  };

  const handleReassign = async () => {
    if (!reassignData.region || !reassignData.campus) {
      setError('Please select both region and campus');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await API.patch(`/api/users/${user._id}/reassign`, reassignData);
      if (response.data.success) {
        onUpdate();
        setShowReassignModal(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign user');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!newRole) {
      setError('Please select a role');
      return;
    }

    // If changing to Leader and user doesn't have a position, require it
    if (newRole === 'Leader' && !user.position && !position) {
      setError('Please provide a position for the leader role');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = { role: newRole };
      // If changing to Leader and position is provided, include it
      if (newRole === 'Leader' && position) {
        payload.position = position;
      }
      
      const response = await API.patch(`/api/users/${user._id}/role`, payload);
      if (response.data.success) {
        onUpdate();
        setShowRoleModal(false);
        setPosition('');
        setNewRole('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change user role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.delete(`/api/users/${user._id}`);
      if (response.data.success) {
        onClose();
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h4>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => {
            setShowReassignModal(true);
            setError('');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          Reassign
        </button>
        <button
          onClick={() => {
            setShowRoleModal(true);
            setError('');
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
        >
          Change Role
        </button>
        <button
          onClick={() => {
            setShowDeleteConfirm(true);
            setError('');
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          Delete User
        </button>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reassign User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={reassignData.region}
                  onChange={(e) => setReassignData({ ...reassignData, region: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Region</option>
                  {regions.map((region) => (
                    <option key={region._id} value={region.name}>{region.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                <select
                  value={reassignData.campus}
                  onChange={(e) => setReassignData({ ...reassignData, campus: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Campus</option>
                  {campuses.map((campus) => (
                    <option key={campus._id} value={campus.name}>{campus.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Reassigning...' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Change User Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Role: <span className="font-bold text-indigo-600">{user.role}</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mt-2"
                >
                  <option value="">Select New Role</option>
                  <option value="Member">Member</option>
                  <option value="Leader">Leader</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {newRole === 'Leader' && !user.position && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g., Campus Leader, Regional Leader"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">A position is required for Leader role</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setNewRole('');
                  setPosition('');
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete User</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserActions;
