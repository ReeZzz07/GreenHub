'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, ArrowLeftIcon } from './Icons';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  variant?: 'edge' | 'card';
  overlay?: ReactNode;
}

// variant "card": фото в отступах со скруглением (карточка модерации).
// variant "edge": фото во всю ширину без отступов (публичная карточка товара).
export function ImageGallery({ images, alt, variant = 'card', overlay }: ImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen || images.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActiveImage((prev) => (prev - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setActiveImage((prev) => (prev + 1) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLightboxOpen, images.length]);

  const mainWrapperClass =
    variant === 'card'
      ? 'aspect-square bg-gradient-to-br from-green-50 to-green-100 relative rounded-2xl overflow-hidden cursor-zoom-in group'
      : 'aspect-square bg-gradient-to-br from-green-50 to-green-100 relative rounded-b-2xl overflow-hidden cursor-zoom-in group';

  const mainImage = (
    <div className={mainWrapperClass} onClick={() => images.length > 0 && setIsLightboxOpen(true)}>
      {images[activeImage] && (
        <img
          src={images[activeImage]}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      )}
      {overlay}
    </div>
  );

  return (
    <>
      {variant === 'card' ? <div className="px-4">{mainImage}</div> : mainImage}

      {images.length > 1 && (
        <div className={`flex gap-2 overflow-x-auto ${variant === 'card' ? 'p-4' : 'px-4 py-4'}`}>
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                index === activeImage ? 'ring-2 ring-green-600 ring-offset-2' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img src={url} alt={alt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen &&
        images.length > 0 &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              aria-label="Закрыть"
            >
              <XIcon size={24} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                  aria-label="Предыдущее фото"
                >
                  <ArrowLeftIcon size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev + 1) % images.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                  aria-label="Следующее фото"
                >
                  <ArrowLeftIcon size={24} className="rotate-180" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm z-10">
                  {activeImage + 1} / {images.length}
                </div>
              </>
            )}

            {images[activeImage] && (
              <img
                src={images[activeImage]}
                alt={alt}
                onClick={(e) => e.stopPropagation()}
                className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
