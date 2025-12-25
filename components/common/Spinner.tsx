import React from "react";

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-12 h-12 border-3 border-navy-700 border-t-gold rounded-full animate-spin" />
      <p className="mt-4 text-slate-400 text-sm">Loading...</p>
    </div>
  );
};

export default Spinner;
