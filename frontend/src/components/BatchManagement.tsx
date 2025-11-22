import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface BatchSettings {
  max_batch_size: number;
  batch_assignment_strategy: 'alphabetical' | 'merit';
  auto_assign_sections: boolean;
  reorganize_annually: boolean;
}

interface Class {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

export default function BatchManagement() {
  const [settings, setSettings] = useState<BatchSettings>({
    max_batch_size: 30,
    batch_assignment_strategy: 'alphabetical',
    auto_assign_sections: true,
    reorganize_annually: true,
  });

  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [systemSettings, classesData, yearsData] = await Promise.all([
        apiClient.getSystemSettings(),
        apiClient.getClasses(),
        apiClient.getAcademicYears()
      ]);

      setSettings(systemSettings.batch);
      setClasses(classesData);
      setAcademicYears(yearsData);

      // Set current year as default
      const currentYear = yearsData.find((y: AcademicYear) => y.is_current);
      if (currentYear) {
        setSelectedYear(currentYear.id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('error', 'Failed to load batch management data');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.updateBatchSettings(settings);
      showMessage('success', 'Batch settings updated successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('error', 'Failed to save batch settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSections = async () => {
    if (!selectedClass || !selectedYear) {
      showMessage('error', 'Please select a class and academic year');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.assignSections({
        class_id: selectedClass,
        academic_year_id: selectedYear,
      });
      showMessage('success', result.message);
    } catch (error: any) {
      console.error('Failed to assign sections:', error);
      showMessage('error', error.response?.data?.detail || 'Failed to assign sections');
    } finally {
      setLoading(false);
    }
  };

  const handleReorganizeAll = async () => {
    if (!selectedYear) {
      showMessage('error', 'Please select an academic year');
      return;
    }

    if (!confirm('This will reorganize ALL classes. Students will be redistributed across sections. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.reorganizeAllClasses({
        academic_year_id: selectedYear,
      });
      showMessage('success', `${result.message}. Total students: ${result.total_students}`);
    } catch (error: any) {
      console.error('Failed to reorganize:', error);
      showMessage('error', error.response?.data?.detail || 'Failed to reorganize classes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Batch Management</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure automatic section assignment and batch reorganization
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h4 className="font-medium text-gray-900">Configuration</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Max Batch Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Students per Section
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={settings.max_batch_size}
              onChange={(e) => setSettings({ ...settings, max_batch_size: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of students before creating a new section
            </p>
          </div>

          {/* Assignment Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Strategy
            </label>
            <select
              value={settings.batch_assignment_strategy}
              onChange={(e) => setSettings({ ...settings, batch_assignment_strategy: e.target.value as 'alphabetical' | 'merit' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="alphabetical">Alphabetical (by name)</option>
              <option value="merit">Merit-based (by marks)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              How students are distributed across sections
            </p>
          </div>

          {/* Auto Assign */}
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={settings.auto_assign_sections}
              onChange={(e) => setSettings({ ...settings, auto_assign_sections: e.target.checked })}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="ml-3">
              <label className="text-sm font-medium text-gray-700">
                Auto-assign sections
              </label>
              <p className="text-xs text-gray-500">
                Automatically assign sections when students are admitted
              </p>
            </div>
          </div>

          {/* Annual Reorganization */}
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={settings.reorganize_annually}
              onChange={(e) => setSettings({ ...settings, reorganize_annually: e.target.checked })}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="ml-3">
              <label className="text-sm font-medium text-gray-700">
                Reorganize annually
              </label>
              <p className="text-xs text-gray-500">
                Redistribute students at the start of each academic year
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h4 className="font-medium text-gray-900">Actions</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_current && '(Current)'}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class (for single class assignment)
            </label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleAssignSections}
            disabled={loading || !selectedClass || !selectedYear}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Assigning...' : 'Assign Sections to Selected Class'}
          </button>

          <button
            onClick={handleReorganizeAll}
            disabled={loading || !selectedYear}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
          >
            {loading ? 'Reorganizing...' : 'Reorganize All Classes'}
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Reorganizing will redistribute all students across sections based on the current strategy and batch size.
            This action is typically performed at the start of a new academic year.
          </p>
        </div>
      </div>
    </div>
  );
}
