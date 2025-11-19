import Layout from '../components/Layout';

export default function Students() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage student records, enrollment, and information
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Students Module
            </h3>
            <p className="text-gray-500 mb-6">
              Student management functionality will be available here
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                Add New Student
              </button>
              <button className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50">
                Import Students
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
