import React from "react";

interface StatCardProps {
  // FIX: Explicitly type the icon prop to accept a `size` property. This resolves a TypeScript error with `React.cloneElement` on line 15.
  icon: React.ReactElement<{ size?: number }>;
  label: string;
  value: number | string;
  iconBgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  iconBgColor,
  iconColor,
}) => {
  return (
    <div className="bg-navy-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex items-center shadow-lg group hover:border-gold/30 transition-all duration-300">
      <div
        className={`p-4 ${iconBgColor} ${iconColor} rounded-2xl mr-5 group-hover:scale-110 transition-transform`}
      >
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-white font-serif">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
};

export default React.memo(StatCard);
