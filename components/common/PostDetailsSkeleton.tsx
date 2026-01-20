import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const PostDetailsSkeleton = () => {
  return (
    <div className="flex flex-col min-h-screen bg-navy-900 animate-pulse">
      <Header />
      <main className="flex-grow">
        {/* Hero Section Skeleton */}
        <div className="relative h-96 md:h-[500px] bg-navy-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative h-full flex flex-col justify-end pb-12">
            <div className="w-32 h-4 bg-navy-700 rounded mb-4" />
            <div className="w-3/4 h-12 md:h-16 bg-navy-700 rounded mb-6" />
            <div className="flex gap-4">
              <div className="w-24 h-4 bg-navy-700 rounded" />
              <div className="w-24 h-4 bg-navy-700 rounded" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-12">
            {/* Sidebar Skeleton */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 space-y-4">
                <div className="w-full h-8 bg-navy-800 rounded mb-4" />
                <div className="space-y-2">
                  <div className="w-full h-4 bg-navy-800 rounded" />
                  <div className="w-full h-4 bg-navy-800 rounded" />
                  <div className="w-full h-4 bg-navy-800 rounded" />
                  <div className="w-3/4 h-4 bg-navy-800 rounded" />
                </div>
              </div>
            </aside>

            {/* Content Skeleton */}
            <div className="lg:col-span-9 space-y-6">
              <div className="w-full h-4 bg-navy-800 rounded" />
              <div className="w-full h-4 bg-navy-800 rounded" />
              <div className="w-5/6 h-4 bg-navy-800 rounded" />
              <div className="w-full h-4 bg-navy-800 rounded" />

              <div className="w-full h-64 bg-navy-800 rounded my-8" />

              <div className="w-full h-4 bg-navy-800 rounded" />
              <div className="w-full h-4 bg-navy-800 rounded" />
              <div className="w-4/5 h-4 bg-navy-800 rounded" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostDetailsSkeleton;
