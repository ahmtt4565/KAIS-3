import { useState } from 'react';
import { Calendar, Check, X, Clock, Key, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';
import { API } from '../App';

export default function MeetupCard({ meetup, currentUserId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const isRequester = meetup.requester_id === currentUserId;
  const myCode = isRequester ? meetup.requester_code : meetup.receiver_code;
  const otherUser = isRequester ? meetup.receiver_username : meetup.requester_username;

  const handleAccept = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API}/meetups/${meetup.id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Meet-up accepted! Your code: ${response.data.your_code}`);
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to accept');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Reject this meet-up request?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/meetups/${meetup.id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      alert('Please enter a 6-character code');
      return;
    }
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/meetups/${meetup.id}/verify`,
        { code: code.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      setCode('');
      setShowCodeInput(false);
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/meetups/${meetup.id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Show rating modal
      if (window.openRatingModal) {
        window.openRatingModal(response.data.rate_user_id, response.data.rate_username, response.data.listing_id);
      }
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to complete');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this meet-up?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API}/meetups/${meetup.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (meetup.status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'accepted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (meetup.status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <Check className="w-4 h-4" />;
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'expired': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-2 border-teal-200 dark:border-teal-800 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Meet Up</h3>
        </div>
        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}>
          {getStatusIcon()}
          {meetup.status.toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>With:</strong> @{otherUser}
        </p>
        {meetup.location && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Location:</strong> {meetup.location}
          </p>
        )}
        {meetup.notes && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            <strong>Notes:</strong> {meetup.notes}
          </p>
        )}
      </div>

      {/* Actions based on status */}
      {meetup.status === 'pending' && !isRequester && (
        <div className="flex gap-2">
          <Button onClick={handleAccept} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <Check className="w-4 h-4 mr-1" /> Accept
          </Button>
          <Button onClick={handleReject} disabled={loading} variant="destructive" className="flex-1">
            <X className="w-4 h-4 mr-1" /> Reject
          </Button>
        </div>
      )}

      {meetup.status === 'pending' && isRequester && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">⏳ Waiting for {otherUser} to accept...</p>
          <Button onClick={handleCancel} disabled={loading} variant="outline" size="sm" className="w-full">
            Cancel Request
          </Button>
        </div>
      )}

      {meetup.status === 'accepted' && (
        <div className="space-y-3">
          {/* Show My Code */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border-2 border-teal-400 dark:border-teal-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Verification Code:</p>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 tracking-wider text-center">{myCode}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">Show this to {otherUser}</p>
          </div>

          {/* Code Verification */}
          {!showCodeInput ? (
            <Button onClick={() => setShowCodeInput(true)} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
              <Key className="w-4 h-4 mr-2" /> Verify {otherUser}'s Code
            </Button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-bold uppercase focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex gap-2">
                <Button onClick={() => { setShowCodeInput(false); setCode(''); }} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleVerifyCode} disabled={verifying || code.length !== 6} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {verifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          )}

          <Button onClick={handleCancel} disabled={loading} variant="outline" size="sm" className="w-full">
            Cancel Meet-up
          </Button>
        </div>
      )}

      {meetup.status === 'verified' && (
        <div className="space-y-2">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Both Verified! ✅</p>
            <p className="text-xs text-green-700 dark:text-green-400">You can now complete the exchange</p>
          </div>
          <Button onClick={handleComplete} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            Exchange Completed ✓
          </Button>
        </div>
      )}

      {meetup.status === 'completed' && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-3 text-center">
          <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">Exchange Completed! 🎉</p>
        </div>
      )}

      {(meetup.status === 'cancelled' || meetup.status === 'expired') && (
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">This meet-up is {meetup.status}</p>
        </div>
      )}
    </div>
  );
}
