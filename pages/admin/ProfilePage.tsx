import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({ name, avatarUrl });
      addToast('Profile updated successfully!', 'success');
    } catch (error) {
      addToast('Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div className="flex items-center space-x-6">
            <img src={avatarUrl || 'https://i.pravatar.cc/150'} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover" />
            <div className="flex-grow">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="mt-1 inline-block bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">{user.role}</span>
            </div>
          </div>
          
          <div className="border-t pt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
              <input type="url" id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-800 transition disabled:bg-gray-400">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
