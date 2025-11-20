import { useState } from 'react';
import { apiClient } from '../services/api';

interface SMSSettings {
  sms_provider?: string;
  sms_api_key?: string;
  sms_sender_id?: string;
  sms_balance?: number;
  sms_enabled?: boolean;
}

interface SMSSettingsFormProps {
  settings: SMSSettings;
  onUpdate: () => void;
}

export default function SMSSettingsForm({ settings, onUpdate }: SMSSettingsFormProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sms_provider: settings?.sms_provider || '',
    sms_api_key: settings?.sms_api_key || '',
    sms_sender_id: settings?.sms_sender_id || '',
    sms_balance: settings?.sms_balance || 0,
    sms_enabled: settings?.sms_enabled || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.updateSMSSettings({
        ...formData,
        sms_balance: Number(formData.sms_balance),
      });
      setSuccess('SMS settings updated successfully');
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      console.error('Failed to update SMS settings:', err);
      setError(err.response?.data?.detail || 'Failed to update SMS settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">SMS Configuration</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Edit Configuration
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
        {/* SMS Enable Toggle */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div>
            <label htmlFor="sms_enabled" className="text-sm font-medium text-gray-900">
              SMS Notifications Enabled
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Enable or disable SMS notifications system-wide
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sms_enabled"
              checked={formData.sms_enabled}
              onChange={(e) => setFormData({ ...formData, sms_enabled: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={!editing}
            />
            <label htmlFor="sms_enabled" className="ml-3 text-sm font-medium text-gray-700">
              {formData.sms_enabled ? 'Enabled' : 'Disabled'}
            </label>
          </div>
        </div>

        {/* SMS Provider Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              SMS Provider
            </label>
            <select
              value={formData.sms_provider}
              onChange={(e) => setFormData({ ...formData, sms_provider: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              disabled={!editing}
            >
              <option value="">Select Provider</option>
              <option value="msg91">MSG91</option>
              <option value="textlocal">TextLocal</option>
              <option value="twilio">Twilio</option>
              <option value="fast2sms">Fast2SMS</option>
              <option value="gupshup">Gupshup</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Choose your SMS gateway provider</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sender ID (DLT Registered)
            </label>
            <input
              type="text"
              value={formData.sms_sender_id}
              onChange={(e) => setFormData({ ...formData, sms_sender_id: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !editing ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="SCHOOL"
              maxLength={10}
              disabled={!editing}
            />
            <p className="mt-1 text-xs text-gray-500">Must be registered with DLT (max 10 chars)</p>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            API Key / Authentication Token
          </label>
          <input
            type="password"
            value={formData.sms_api_key}
            onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              !editing ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            placeholder="Your API key or authentication token"
            disabled={!editing}
          />
          <p className="mt-1 text-xs text-gray-500">
            API key from your SMS provider (kept secure)
          </p>
        </div>

        {/* SMS Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            SMS Balance (Credits)
          </label>
          <input
            type="number"
            value={formData.sms_balance}
            onChange={(e) => setFormData({ ...formData, sms_balance: e.target.value as any })}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              !editing ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            placeholder="0"
            min="0"
            disabled={!editing}
          />
          <p className="mt-1 text-xs text-gray-500">
            Current SMS credits available (update manually or sync from provider)
          </p>
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
                  sms_provider: settings?.sms_provider || '',
                  sms_api_key: settings?.sms_api_key || '',
                  sms_sender_id: settings?.sms_sender_id || '',
                  sms_balance: settings?.sms_balance || 0,
                  sms_enabled: settings?.sms_enabled || false,
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
        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Current Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Provider:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formData.sms_provider || 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Credits:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formData.sms_balance}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Sender ID:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formData.sms_sender_id || 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                  formData.sms_enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.sms_enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Important Notes</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>SMS credits must be purchased from your chosen provider</li>
              <li>Sender ID must be registered with DLT (Digital Locker Template)</li>
              <li>Test your configuration before enabling system-wide</li>
              <li>Balance is tracked manually - sync with provider regularly</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
