import React, { useState } from 'react';
import ImageModal from './ImageModal';

interface Image {
  src: string;
  alt: string;
}

interface ImageGalleryProps {
  images: Image[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="my-8 not-prose">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openModal(index)}
            className="relative aspect-video md:aspect-square overflow-hidden rounded-lg group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-center text-sm p-2">{image.alt}</p>
            </div>
          </button>
        ))}
      </div>

      {isModalOpen && (
        <ImageModal
          images={images}
          currentIndex={currentIndex}
          onClose={closeModal}
          onNavigate={setCurrentIndex}
        />
      )}
    </div>
  );
};

export default ImageGallery;
