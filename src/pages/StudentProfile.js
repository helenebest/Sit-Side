import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const StudentProfile = () => {
  const { id } = useParams();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Mock student data - in real app, this would be fetched based on ID
  const student = {
    id: parseInt(id),
    name: 'Helen Best',
    school: 'Windward High School',
    grade: 11,
    hourlyRate: 20,
    location: 'Venice4',
    bio: 'Experienced babysitter and tutor with retail work experience. Love working with kids of all ages! I have been babysitting for over 2 years and have experience with children from 1 to 12 years old. I am responsible, reliable, and love creating fun activities for kids.',
    certifications: ['California Licensed Driver'],
    availability: {
      monday: { morning: false, afternoon: false, evening: true },
      tuesday: { morning: false, afternoon: false, evening: true },
      wednesday: { morning: false, afternoon: false, evening: true },
      thursday: { morning: false, afternoon: false, evening: true },
      friday: { morning: false, afternoon: true, evening: true },
      saturday: { morning: true, afternoon: true, evening: true },
      sunday: { morning: false, afternoon: false, evening: true },
    },
    experience: '2 years',
    phone: '(917) 837-3801',
    email: 'helbybest@gmail.com',
  };

  const reviews = [
    {
      id: 1,
      parentName: 'Kelly Root',
      rating: 5,
      date: '2025-12-10',
      comment: 'Helen was amazing with my two kids! They had so much fun and I felt completely comfortable leaving them in her care. Highly recommend!',
    },
    {
      id: 2,
      parentName: 'Mike Chen',
      rating: 5,
      date: '2024-01-05',
      comment: 'Very responsible and punctual. My 3-year-old loved playing with Ava. Will definitely book again.',
    },
    {
      id: 3,
      parentName: 'Lisa Davis',
      rating: 4,
      date: '2023-12-28',
      comment: 'Great babysitter! Very professional and the kids had a wonderful time.',
    },
  ];

  const handleBookNow = () => {
    setBookingDialogOpen(true);
  };

  const handleBookingSubmit = () => {
    setBookingDialogOpen(false);
  };

  const getAvailabilityText = (day, slots) => {
    const available = Object.entries(slots)
      .filter(([_, available]) => available)
      .map(([timeSlot, _]) => timeSlot);
    
    if (available.length === 0) return 'Not available';
    if (available.length === 3) return 'All day';
    return available.join(', ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mr-6">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-dark">{student.name}</h1>
                <p className="text-lg text-neutral-light">Grade {student.grade} • {student.school}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center mr-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">
                        {i < Math.floor(student.rating) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-neutral-dark font-medium">{student.rating} ({student.reviewCount} reviews)</span>
                </div>
                <p className="text-sm text-neutral-light mt-1 flex items-center">
                  📍 {student.location}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-neutral-dark mb-4">About Me</h2>
              <p className="text-neutral-light leading-relaxed">{student.bio}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-neutral-dark mb-4">Certifications & Experience</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {student.certifications.map((cert, index) => (
                  <Badge key={index} color="primary">{cert}</Badge>
                ))}
              </div>
              <p className="text-neutral-light">Experience: {student.experience}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-neutral-dark mb-4">Availability</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(student.availability).map(([day, slots]) => (
                  <div key={day} className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-neutral-dark mb-2 capitalize">{day}</h4>
                    <p className="text-sm text-neutral-light">{getAvailabilityText(day, slots)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-neutral-dark mb-4">Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div key={review.id}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-dark">{review.parentName}</h4>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-yellow-400">
                              {i < review.rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-neutral-light">{review.date}</span>
                      </div>
                    </div>
                    <p className="text-neutral-light">{review.comment}</p>
                    {index < reviews.length - 1 && <div className="border-b border-gray-200 mt-4" />}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-8">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Booking Information</h3>
            
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">💰</span>
              <span className="text-3xl font-bold text-primary">${student.hourlyRate}/hour</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-neutral-dark">Background Verified</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-yellow-400 mr-2">⭐</span>
                <span className="text-neutral-dark">{student.rating} Star Rating</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-neutral-light mr-2">📅</span>
                <span className="text-neutral-dark">{student.reviewCount} Completed Bookings</span>
              </div>
            </div>

            <div className="space-y-3">
              <PrimaryButton onClick={handleBookNow} className="w-full">
                Book Now
              </PrimaryButton>
              <OutlineButton className="w-full">
                Back to Search
              </OutlineButton>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 mt-4">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="text-neutral-light mr-2">📞</span>
                <span className="text-neutral-dark">{student.phone}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-neutral-light mr-2">📧</span>
                <span className="text-neutral-dark">{student.email}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Booking Dialog */}
      {bookingDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">Quick Book {student.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Start Time</label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">End Time</label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Number of Children</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">Special Instructions</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Any special needs, allergies, or instructions..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <OutlineButton onClick={() => setBookingDialogOpen(false)} className="flex-1">
                Cancel
              </OutlineButton>
              <PrimaryButton onClick={handleBookingSubmit} className="flex-1">
                Send Booking Request
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
