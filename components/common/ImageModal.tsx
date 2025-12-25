import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageModalProps {
  images: { src: string; alt: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ images, currentIndex, onClose, onNavigate }) => {
  const currentImage = images[currentIndex];

  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-caption"
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          aria-label="Close image viewer"
        >
          <X size={32} />
        </button>

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {/* Image and Caption */}
        <figure className="max-w-full max-h-full flex flex-col items-center justify-center gap-4">
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
          />
          {currentImage.alt && (
            <figcaption id="image-modal-caption" className="text-white text-center text-sm md:text-base">
              {currentImage.alt}
            </figcaption>
          )}
        </figure>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
