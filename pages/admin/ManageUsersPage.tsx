import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { userService } from '../../services/userService';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../hooks/useToast';

const ManageUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const fetchedUsers = await userService.getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        addToast('Failed to fetch users.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
        await userService.updateUser(userId, { role: newRole });
        setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));
        addToast('User role updated!', 'success');
    } catch (error) {
        addToast('Failed to update user role.', 'error');
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        {loading ? <Spinner /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt={user.name} />
                        <div className="ml-4 text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="border-gray-300 rounded-md text-sm shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value={UserRole.Administrator}>{UserRole.Administrator}</option>
                      <option value={UserRole.Editor}>{UserRole.Editor}</option>
                      <option value={UserRole.Author}>{UserRole.Author}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPage;
