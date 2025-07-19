import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return <div className="p-8 text-center">Please log in to view your profile.</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-background dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Profile Settings</h1>
      <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 transition-colors duration-300">
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Name</label>
          <input type="text" value={user.name} disabled className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Email</label>
          <input type="email" value={user.email} disabled className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">Role</label>
          <input type="text" value={user.role} disabled className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-background dark:bg-gray-800 text-gray-900 dark:text-white capitalize" />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" disabled>Edit Profile (Coming Soon)</button>
      </div>
    </div>
  );
};

export default ProfilePage; 