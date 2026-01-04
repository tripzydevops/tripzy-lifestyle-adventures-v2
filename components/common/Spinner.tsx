import React from "react";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
}

const Spinner: React.FC<SpinnerProps> = ({ size = "medium" }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} border-3 border-navy-700 border-t-gold rounded-full animate-spin`}
      />
      <p className="mt-4 text-slate-400 text-sm">Loading...</p>
    </div>
  );
};

export default Spinner;
