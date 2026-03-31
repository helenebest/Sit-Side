import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const shouldShowPendingMessage = (user) =>
  user &&
  (user.userType === 'student' || user.userType === 'parent') &&
  user.isVerified === false;

const PendingApprovalBanner = () => {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  if (!shouldShowPendingMessage(user)) {
    return null;
  }

  const handleRefresh = async () => {
    setRefreshError('');
    setBusy(true);
    try {
      const result = await refreshUser();
      if (!result.success) {
        setRefreshError(result.error || 'Could not refresh.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm">
        <p className="font-medium">Your account is pending administrator approval</p>
        <p className="mt-1 text-amber-900/90">
          For security, new student and parent profiles are reviewed before full access. An administrator
          will approve your account shortly. You can still sign in and update your profile in the meantime.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={busy}
            className="text-amber-900 underline font-medium disabled:opacity-50"
          >
            {busy ? 'Checking status…' : 'Refresh approval status'}
          </button>
          {refreshError && (
            <span className="text-red-700 text-xs">{refreshError}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalBanner;
