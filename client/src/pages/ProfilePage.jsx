import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return <div className="p-8 text-center">Please log in to view your profile.</div>;

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Name</label>
          <input type="text" value={user.name} disabled className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input type="email" value={user.email} disabled className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Role</label>
          <input type="text" value={user.role} disabled className="w-full border border-gray-300 rounded px-3 py-2 capitalize" />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled>Edit Profile (Coming Soon)</button>
      </div>
    </div>
  );
};

export default ProfilePage; 