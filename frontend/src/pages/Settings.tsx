import Layout from '../components/Layout';

export default function Settings() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure system parameters and preferences
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Settings Module
            </h3>
            <p className="text-gray-500">
              System configuration options coming soon
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
