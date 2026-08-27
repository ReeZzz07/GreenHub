'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';
import { Button } from './Button';
import { StarIcon, UserIcon } from './Icons';
import { replyToReview, ApiError, type Review } from '@/lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function SellerReviews({ sellerId, reviews: initialReviews }: { sellerId: string; reviews: Review[] }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwnProfile = user?.id === sellerId;

  const submitReply = async (reviewId: string) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const updated = await replyToReview(reviewId, replyText, token);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      setReplyingId(null);
      setReplyText('');
      showToast('Ответ добавлен', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось отправить ответ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500 py-6 text-center">Пока нет отзывов</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="card p-4">
          <div className="flex items-start gap-3">
            <div className="relative w-9 h-9 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {review.reviewer.avatarUrl ? (
                <Image src={review.reviewer.avatarUrl} alt={review.reviewer.name} fill sizes="36px" className="object-cover" />
              ) : (
                <UserIcon size={18} className="text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-800 truncate">{review.reviewer.name}</p>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(review.createdAt)}</span>
              </div>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} size={14} filled={star <= review.rating} className="text-amber-400" />
                ))}
              </div>
              {review.comment && <p className="text-sm text-gray-600 mt-2">{review.comment}</p>}
            </div>
          </div>

          {review.sellerReply && (
            <div className="mt-3 ml-12 p-3 rounded-xl bg-gray-50 text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Ответ продавца</p>
              {review.sellerReply}
            </div>
          )}

          {isOwnProfile && !review.sellerReply && (
            <div className="mt-3 ml-12">
              {replyingId === review.id ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    rows={2}
                    placeholder="Ваш ответ..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input-field text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      isLoading={isSubmitting}
                      disabled={!replyText.trim()}
                      onClick={() => submitReply(review.id)}
                    >
                      Отправить
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setReplyingId(null)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setReplyingId(review.id);
                    setReplyText('');
                  }}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Ответить
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
