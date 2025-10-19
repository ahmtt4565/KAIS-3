import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';
import { API } from '../App';

export default function RatingModal({ isOpen, onClose, ratedUserId, ratedUsername, listingId }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/ratings`,
        {
          rated_user_id: ratedUserId,
          listing_id: listingId,
          rating: rating,
          comment: comment || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setRating(0);
        setComment('');
      }, 2000);
    } catch (error) {
      console.error('Rating error:', error);
      alert(error.response?.data?.detail || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rate Exchange</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-green-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Thank You! 🎉</h3>
            <p className="text-gray-600 dark:text-gray-400">Your rating has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">How was your exchange with</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">@{ratedUsername}?</p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hover || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-center mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && '⭐ Poor'}
                {rating === 2 && '⭐⭐ Fair'}
                {rating === 3 && '⭐⭐⭐ Good'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                Skip
              </Button>
              <Button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
