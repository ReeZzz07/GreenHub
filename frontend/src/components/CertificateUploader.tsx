'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadListingCertificate, ApiError } from '@/lib/api';
import { useToast } from './Toast';
import { XIcon, UploadIcon, LoaderIcon, CheckIcon } from './Icons';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

interface CertificateUploaderProps {
  certificateUrl: string;
  onChange: (url: string) => void;
}

export function CertificateUploader({ certificateUrl, onChange }: CertificateUploaderProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file || !token) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Допустимые форматы сертификата: PDF, JPG, PNG', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('Файл больше 5 МБ', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadListingCertificate(file, token);
      onChange(url);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось загрузить сертификат', 'error');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="text-sm text-gray-700 mb-1 block">Фитосанитарный сертификат</label>
      {certificateUrl ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-green-200 bg-green-50">
          <CheckIcon size={16} className="text-green-600 flex-shrink-0" />
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 font-medium hover:underline flex-1 truncate"
          >
            Файл загружен — открыть
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
            aria-label="Удалить сертификат"
          >
            <XIcon size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isUploading ? <LoaderIcon size={16} /> : <UploadIcon size={16} />}
          {isUploading ? 'Загрузка...' : 'Загрузить PDF или фото сертификата'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <p className="text-xs text-gray-400 mt-1">PDF, JPG или PNG, максимум 5 МБ</p>
    </div>
  );
}
