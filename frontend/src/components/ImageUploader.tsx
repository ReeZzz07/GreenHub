'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { uploadMedia, ApiError } from '@/lib/api';
import { useToast } from './Toast';
import { XIcon, UploadIcon, LoaderIcon } from './Icons';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) return;

    const remaining = MAX_IMAGES - images.length;
    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Можно добавить ещё не более ${remaining} фото`, 'warning');
    }

    setIsUploading(true);
    const uploaded: string[] = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`${file.name}: допустимы только JPG и PNG`, 'error');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast(`${file.name}: файл больше 5 МБ`, 'error');
        continue;
      }
      try {
        const { url } = await uploadMedia(file, token);
        uploaded.push(url);
      } catch (error) {
        showToast(
          error instanceof ApiError ? error.message : `Не удалось загрузить ${file.name}`,
          'error',
        );
      }
    }
    setIsUploading(false);
    if (uploaded.length > 0) onChange([...images, ...uploaded]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = (url: string) => onChange(images.filter((img) => img !== url));

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {images.map((url) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <Image src={url} alt="" fill sizes="25vw" className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"
              aria-label="Удалить фото"
            >
              <XIcon size={12} />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
            aria-label="Добавить фото"
          >
            {isUploading ? (
              <LoaderIcon size={20} className="text-gray-400" />
            ) : (
              <UploadIcon size={20} className="text-gray-400" />
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-gray-400">До {MAX_IMAGES} фото, JPG/PNG, максимум 5 МБ каждое</p>
    </div>
  );
}
