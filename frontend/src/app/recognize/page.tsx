'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UploadIcon } from '@/components/Icons';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { recognizePlant, ApiError, type RecognitionResult } from '@/lib/api';

export default function RecognizePage() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsRecognizing(true);

    try {
      const data = await recognizePlant(file, token);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось распознать растение');
    } finally {
      setIsRecognizing(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы распознать растение</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-4">
      <h1 className="text-xl font-bold text-gray-800 mb-2">Распознать растение</h1>
      <p className="text-sm text-gray-500 mb-6">
        Загрузите фото — AI-помощник определит вид и предложит теги
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!preview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-square rounded-2xl border-2 border-dashed border-green-300 bg-green-50 flex flex-col items-center justify-center gap-3 hover:bg-green-100 transition-colors"
        >
          <UploadIcon size={40} className="text-green-600" />
          <span className="text-green-700 font-medium">Загрузить фото</span>
          <span className="text-xs text-gray-500">JPG, PNG до 5 МБ</span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
            <img src={preview} alt="Загруженное фото" className="w-full h-full object-cover" />
          </div>

          {isRecognizing ? (
            <LoadingSpinner text="Распознаём растение..." />
          ) : (
            <>
              {error && (
                <div className="card p-4 text-sm text-gray-700">
                  <p className="mb-1">{error}</p>
                  <p className="text-xs text-gray-500">Введите название вручную при создании объявления.</p>
                </div>
              )}

              {result && !result.recognized && (
                <div className="card p-4 text-sm text-gray-700">
                  Не удалось уверенно распознать растение. Введите название вручную.
                </div>
              )}

              {result?.recognized && (
                <div className="card p-4">
                  <h2 className="font-semibold text-gray-800 mb-1">{result.name}</h2>
                  {result.commonNames && result.commonNames.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2">{result.commonNames.join(', ')}</p>
                  )}
                  {typeof result.confidence === 'number' && (
                    <p className="text-xs text-gray-400">
                      Уверенность: {Math.round(result.confidence * 100)}%
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>
                  Другое фото
                </Button>
                {result?.recognized && (
                  <Button
                    fullWidth
                    onClick={() => router.push(`/listings/new?title=${encodeURIComponent(result.name ?? '')}`)}
                  >
                    Создать объявление
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
