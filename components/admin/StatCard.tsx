import React from 'react';

interface StatCardProps {
  // FIX: Explicitly type the icon prop to accept a `size` property. This resolves a TypeScript error with `React.cloneElement` on line 15.
  icon: React.ReactElement<{ size?: number }>;
  label: string;
  value: number | string;
  iconBgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconBgColor, iconColor }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
      <div className={`p-3 ${iconBgColor} ${iconColor} rounded-full mr-4`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default React.memo(StatCard);