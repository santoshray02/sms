import { useState } from 'react';
import { apiClient } from '../services/api';

interface SchoolSettings {
  school_name?: string;
  school_code?: string;
  affiliation_number?: string;
  school_address?: string;
  principal_name?: string;
  principal_signature_url?: string;
  school_logo_url?: string;
}

interface SchoolSettingsFormProps {
  settings: SchoolSettings;
  onUpdate: () => void;
}

export default function SchoolSettingsForm({ settings, onUpdate }: SchoolSettingsFormProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    school_name: settings?.school_name || '',
    school_code: settings?.school_code || '',
    affiliation_number: settings?.affiliation_number || '',
    school_address: settings?.school_address || '',
    principal_name: settings?.principal_name || '',
    principal_signature_url: settings?.principal_signature_url || '',
    school_logo_url: settings?.school_logo_url || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.updateSchoolSettings(formData);
      setSuccess('School information updated successfully');
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      console.error('Failed to update school settings:', err);
      setError(err.response?.data?.detail || 'Failed to update school settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">School Information</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Edit Information
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              School Name
            </label>
            <input
              type="text"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="Your School Name"
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              UDISE Code
            </label>
            <input
              type="text"
              value={formData.school_code}
              onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="UDISE School Code"
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CBSE Affiliation Number
            </label>
            <input
              type="text"
              value={formData.affiliation_number}
              onChange={(e) => setFormData({ ...formData, affiliation_number: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="CBSE Affiliation Number"
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Principal Name
            </label>
            <input
              type="text"
              value={formData.principal_name}
              onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="Principal's Full Name"
              disabled={!editing}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            School Address
          </label>
          <textarea
            value={formData.school_address}
            onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
            rows={3}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              !editing ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            placeholder="Complete school address with district and state"
            disabled={!editing}
          />
        </div>

        {/* File URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              School Logo URL
            </label>
            <input
              type="url"
              value={formData.school_logo_url}
              onChange={(e) => setFormData({ ...formData, school_logo_url: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="https://example.com/logo.png"
              disabled={!editing}
            />
            <p className="mt-1 text-xs text-gray-500">URL to your school logo image</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Principal Signature URL
            </label>
            <input
              type="url"
              value={formData.principal_signature_url}
              onChange={(e) => setFormData({ ...formData, principal_signature_url: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="https://example.com/signature.png"
              disabled={!editing}
            />
            <p className="mt-1 text-xs text-gray-500">URL to principal's signature for certificates</p>
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setSuccess(null);
                // Reset form data
                setFormData({
                  school_name: settings?.school_name || '',
                  school_code: settings?.school_code || '',
                  affiliation_number: settings?.affiliation_number || '',
                  school_address: settings?.school_address || '',
                  principal_name: settings?.principal_name || '',
                  principal_signature_url: settings?.principal_signature_url || '',
                  school_logo_url: settings?.school_logo_url || '',
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>

      {!editing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Information</p>
          <p>This information will be used on receipts, certificates, and official documents.</p>
        </div>
      )}
    </div>
  );
}
