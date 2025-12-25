
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, Image, UploadCloud } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SITE_NAME } from '../../constants';

const AdminSidebar = () => {
  const { isAdmin, isEditor, isAuthor } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center px-4 py-2 mt-2 text-gray-100 rounded-md transition-colors duration-200 hover:bg-gray-700 hover:text-white ${isActive ? 'bg-gray-700' : ''}`;

  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-800 shrink-0 h-full">
      <div className="flex items-center justify-center h-20 shadow-md">
        <h1 className="text-2xl font-bold text-white font-serif">{SITE_NAME}</h1>
      </div>
      <div className="flex flex-col flex-1 p-4 overflow-y-auto">
        <nav>
          <NavLink to="/admin/dashboard" className={getNavLinkClass}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="mx-4">Dashboard</span>
          </NavLink>
          <NavLink to="/admin/posts" className={getNavLinkClass}>
            <FileText className="w-5 h-5" />
            <span className="mx-4">Posts</span>
          </NavLink>
          {(isAdmin || isEditor || isAuthor) && (
              <NavLink to="/admin/media" className={getNavLinkClass}>
                <Image className="w-5 h-5" />
                <span className="mx-4">Media</span>
              </NavLink>
          )}
          {(isAdmin || isEditor) && (
              <NavLink to="/admin/import" className={getNavLinkClass}>
                <UploadCloud className="w-5 h-5" />
                <span className="mx-4">Import Media</span>
              </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin/users" className={getNavLinkClass}>
                <Users className="w-5 h-5" />
                <span className="mx-4">Users</span>
              </NavLink>
              <NavLink to="/admin/settings" className={getNavLinkClass}>
                <Settings className="w-5 h-5" />
                <span className="mx-4">Settings</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
