import React from "react";

const SkeletonPostCard = () => {
  return (
    <div className="bg-navy-800 rounded-2xl overflow-hidden border border-white/5 flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-56 bg-navy-700/50" />

      {/* Content Skeleton */}
      <div className="p-6 flex flex-col flex-grow space-y-4">
        {/* Meta Row */}
        <div className="flex gap-3">
          <div className="h-4 w-24 bg-navy-700/50 rounded-full" />
          <div className="h-4 w-20 bg-navy-700/50 rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-7 w-3/4 bg-navy-700/50 rounded-lg" />
          <div className="h-7 w-1/2 bg-navy-700/50 rounded-lg" />
        </div>

        {/* Excerpt */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-navy-700/50 rounded" />
          <div className="h-4 w-full bg-navy-700/50 rounded" />
          <div className="h-4 w-2/3 bg-navy-700/50 rounded" />
        </div>

        {/* Footer Row */}
        <div className="pt-4 mt-auto flex justify-between items-center border-t border-white/5">
          <div className="h-4 w-24 bg-navy-700/50 rounded" />
          <div className="h-8 w-8 bg-navy-700/50 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonPostCard;
