'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadListingVideo, ApiError } from '@/lib/api';
import { useToast } from './Toast';
import { XIcon, UploadIcon, LoaderIcon } from './Icons';

const MAX_VIDEOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DURATION_SEC = 15;
const ALLOWED_TYPES = ['video/mp4'];

interface VideoUploaderProps {
  videos: string[];
  onChange: (videos: string[]) => void;
}

// Длительность видео можно надёжно проверить только на клиенте (sharp/ffmpeg на бэкенде не подключали
// ради одной проверки — TZ.md 4.3 просит короткие ролики до 15 сек, не более).
function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Не удалось прочитать видео'));
    };
    video.src = URL.createObjectURL(file);
  });
}

export function VideoUploader({ videos, onChange }: VideoUploaderProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) return;

    const remaining = MAX_VIDEOS - videos.length;
    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Можно добавить ещё не более ${remaining} видео`, 'warning');
    }

    setIsUploading(true);
    const uploaded: string[] = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`${file.name}: допустим только MP4`, 'error');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast(`${file.name}: файл больше 5 МБ`, 'error');
        continue;
      }
      try {
        const duration = await readVideoDuration(file);
        if (duration > MAX_DURATION_SEC) {
          showToast(`${file.name}: видео длиннее ${MAX_DURATION_SEC} сек`, 'error');
          continue;
        }
      } catch {
        showToast(`${file.name}: не удалось прочитать видео`, 'error');
        continue;
      }
      try {
        const { url } = await uploadListingVideo(file, token);
        uploaded.push(url);
      } catch (error) {
        showToast(
          error instanceof ApiError ? error.message : `Не удалось загрузить ${file.name}`,
          'error',
        );
      }
    }
    setIsUploading(false);
    if (uploaded.length > 0) onChange([...videos, ...uploaded]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeVideo = (url: string) => onChange(videos.filter((v) => v !== url));

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {videos.map((url) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
            <video src={url} className="w-full h-full object-cover" muted playsInline />
            <button
              type="button"
              onClick={() => removeVideo(url)}
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"
              aria-label="Удалить видео"
            >
              <XIcon size={12} />
            </button>
          </div>
        ))}
        {videos.length < MAX_VIDEOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
            aria-label="Добавить видео"
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
        accept="video/mp4"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-gray-400">До {MAX_VIDEOS} видео, MP4, максимум 5 МБ и {MAX_DURATION_SEC} сек каждое</p>
    </div>
  );
}
