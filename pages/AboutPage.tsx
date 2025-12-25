import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { SITE_NAME } from '../constants';
import SEO from '../components/common/SEO';

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title="About Us"
        description={`Learn about the mission and story behind ${SITE_NAME}.`}
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-6">About {SITE_NAME}</h1>
          <p className="text-lg text-gray-700 mb-8">
            We believe that travel is more than just seeing new places. It's about experiencing new cultures, challenging your perspectives, and creating memories that last a lifetime.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <img src="https://picsum.photos/seed/aboutus/800/600" alt="Team of travelers" className="rounded-lg shadow-xl" />
            <div className="prose lg:prose-lg">
                <h2>Our Mission</h2>
                <p>
                    Our mission is to inspire and empower you to explore the world. Through our detailed guides, personal stories, and practical tips, we aim to make travel more accessible and enjoyable for everyone, whether you're a seasoned globetrotter or planning your very first trip.
                </p>
                <h2>Our Story</h2>
                <p>
                    Tripzy Lifestyle Adventures started as a small personal blog to document our own journeys. It has since grown into a community of passionate travelers who share a love for adventure and discovery. We're dedicated to bringing you authentic, high-quality content to fuel your wanderlust.
                </p>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;