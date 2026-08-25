'use client';

import { useRef, useState } from 'react';
import { UploadIcon } from '@/components/Icons';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/Button';

export default function RecognizePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setPreview(URL.createObjectURL(file));
    setIsRecognizing(true);

    // TODO: заменить на реальный вызов Plant.id API через бэкенд
    setTimeout(() => {
      setIsRecognizing(false);
      setResult('Интеграция с AI-распознаванием ещё не подключена — это заглушка для UI.');
    }, 1500);
  };

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
              {result && (
                <div className="card p-4 text-sm text-gray-700">{result}</div>
              )}
              <Button fullWidth onClick={() => fileInputRef.current?.click()}>
                Загрузить другое фото
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
