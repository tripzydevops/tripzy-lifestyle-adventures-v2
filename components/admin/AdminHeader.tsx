import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, LogOut, User } from 'lucide-react';
// FIX: Ensure react-router-dom import is correct.
import { Link } from 'react-router-dom';

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b-2 border-gray-200">
      <div>
        {/* Placeholder for breadcrumbs or page title */}
      </div>
      <div className="relative">
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2">
          <img src={user?.avatarUrl} alt={user?.name} className="w-10 h-10 rounded-full object-cover" />
          <span className="font-medium hidden md:block">{user?.name}</span>
          <ChevronDown size={20} />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
            <Link to="/admin/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
              <User size={16} className="mr-2" /> Profile
            </Link>
            <button
              onClick={logout}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={16} className="mr-2" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
