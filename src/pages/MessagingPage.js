import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import { useAuth } from '../contexts/AuthContext';

const MessagingPage = () => {
  const { user, loading, getMyBookings } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const result = await getMyBookings();
        if (!isMounted) return;
        if (result.success) {
          setBookings(result.data.bookings || []);
        } else {
          setBookingsError(result.error || 'Unable to load conversations.');
        }
      } catch (error) {
        if (isMounted) {
          setBookingsError(error.message || 'Unable to load conversations.');
        }
      } finally {
        if (isMounted) setBookingsLoading(false);
      }
    };

    if (user) {
      load();
    } else {
      setBookingsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user, getMyBookings]);

  const conversations = useMemo(
    () => (bookings || []).filter((b) => Array.isArray(b.messages) && b.messages.length > 0),
    [bookings]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold text-neutral-dark mb-4">Messaging</h1>
          <p className="text-neutral-light mb-6">
            Please sign in to view and send messages about your bookings.
          </p>
          <div className="flex justify-center gap-3">
            <PrimaryButton onClick={() => navigate('/login')}>Sign In</PrimaryButton>
            <OutlineButton onClick={() => navigate('/signup')}>Create Account</OutlineButton>
          </div>
        </Card>
      </div>
    );
  }

  const isParent = user.userType === 'parent';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-neutral-dark mb-4">Messaging</h1>
      <p className="text-neutral-light mb-8 max-w-2xl">
        A summary of all conversations related to your bookings. Open your dashboard to continue any conversation.
      </p>

      {bookingsError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bookingsError}
        </div>
      )}

      {bookingsLoading ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
          Loading your conversations...
        </div>
      ) : conversations.length === 0 ? (
        <Card className="p-6">
          <p className="text-neutral-light">
            You don&apos;t have any messages yet. Once you start booking sitters, your conversations will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((booking) => {
            const lastMsg = booking.messages[booking.messages.length - 1];
            const otherParty = isParent ? booking.student : booking.parent;

            return (
              <Card key={booking._id} className="p-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-dark mb-1">
                    {otherParty
                      ? `${otherParty.firstName} ${otherParty.lastName}`.trim()
                      : isParent
                      ? 'Babysitter'
                      : 'Parent'}
                  </h2>
                  <p className="text-sm text-neutral-light mb-1">
                    {booking.date ? new Date(booking.date).toLocaleDateString() : ''} •{' '}
                    {booking.startTime} – {booking.endTime} •{' '}
                    <span className="capitalize">{booking.status}</span>
                  </p>
                  <p className="text-sm text-neutral-dark mb-1">
                    Last message from {lastMsg.senderRole === 'parent' ? 'parent' : 'student'}:{' '}
                    <span className="italic">"{lastMsg.text}"</span>
                  </p>
                  {lastMsg.sentAt && (
                    <p className="text-xs text-neutral-light">
                      {new Date(lastMsg.sentAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <PrimaryButton
                    onClick={() => navigate(isParent ? '/parent' : '/student')}
                    className="whitespace-nowrap"
                  >
                    Open in Dashboard
                  </PrimaryButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessagingPage;

