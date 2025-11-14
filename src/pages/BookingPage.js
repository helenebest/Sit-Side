import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';

// Core students data - same as in ParentDashboard and StudentProfile
const CORE_STUDENTS = [
  {
    id: 1001,
    name: 'Helen Best',
    hourlyRateRange: '$18 – $25 / hour',
  },
  {
    id: 1002,
    name: 'Ava Parker',
    hourlyRateRange: '$20 / hour',
  },
  {
    id: 1003,
    name: 'Lilah Rubinson',
    hourlyRateRange: '$20 / hour',
  },
  {
    id: 1004,
    name: 'Lila Owens',
    hourlyRateRange: '$20 / hour',
  },
];

const BookingPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { getStudentProfile } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    numberOfChildren: 1,
    childrenAges: '',
    specialInstructions: '',
    emergencyContact: '',
    paymentMethod: 'card',
  });

  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);
      setError(null);
      
      const id = parseInt(studentId);
      
      // First check if it's a core student
      const coreStudent = CORE_STUDENTS.find(s => s.id === id);
      if (coreStudent) {
        setStudent({
          id: coreStudent.id,
          name: coreStudent.name,
          hourlyRate: coreStudent.hourlyRateRange 
            ? parseFloat(coreStudent.hourlyRateRange.replace(/[^0-9.]/g, '').split('–')[0]) || 15
            : 15,
          rating: null,
        });
        setLoading(false);
        return;
      }

      // Otherwise, fetch from API
      try {
        const result = await getStudentProfile(studentId);
        if (result.success && result.data) {
          // Handle both API format and core student format
          const studentData = result.data.student || result.data;
          setStudent({
            id: parseInt(studentId),
            name: studentData.firstName && studentData.lastName 
              ? `${studentData.firstName} ${studentData.lastName}`
              : studentData.name || 'Student',
            hourlyRate: studentData.hourlyRate || studentData.hourlyRateRange 
              ? parseFloat((studentData.hourlyRateRange || '').replace(/[^0-9.]/g, '').split('–')[0]) || studentData.hourlyRate || 15
              : 15,
            rating: studentData.rating || null,
          });
        } else {
          setError('Student not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [studentId, getStudentProfile]);

  // If still loading or error, show loading/error state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading student profile...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <div className="text-center text-red-600 mb-4">{error || 'Student not found'}</div>
          <div className="text-center">
            <OutlineButton onClick={() => navigate('/parent')}>Back to Search</OutlineButton>
          </div>
        </Card>
      </div>
    );
  }

  const steps = ['Booking Details', 'Payment', 'Confirmation'];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateTotal = () => {
    if (!bookingData.startTime || !bookingData.endTime || !student) return 0;
    
    const start = new Date(`2000-01-01T${bookingData.startTime}`);
    const end = new Date(`2000-01-01T${bookingData.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    
    return Math.round(hours * (student.hourlyRate || 15) * 100) / 100;
  };

  const handleSubmit = () => {
    console.log('Booking submitted:', bookingData);
  };

  const renderBookingDetails = () => (
    <div>
      <h3 className="text-xl font-semibold text-neutral-dark mb-6">Booking Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-dark mb-2">Date</label>
          <input
            type="date"
            name="date"
            value={bookingData.date}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">Start Time</label>
          <input
            type="time"
            name="startTime"
            value={bookingData.startTime}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">End Time</label>
          <input
            type="time"
            name="endTime"
            value={bookingData.endTime}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">Number of Children</label>
          <input
            type="number"
            name="numberOfChildren"
            value={bookingData.numberOfChildren}
            onChange={handleChange}
            min="1"
            max="10"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">Children's Ages</label>
          <input
            type="text"
            name="childrenAges"
            value={bookingData.childrenAges}
            onChange={handleChange}
            placeholder="e.g., 5, 8, 12"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-neutral-light mt-1">Separate ages with commas</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-dark mb-2">Special Instructions</label>
          <textarea
            name="specialInstructions"
            value={bookingData.specialInstructions}
            onChange={handleChange}
            rows={4}
            placeholder="Any allergies, special needs, bedtime routines, or other important information..."
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-dark mb-2">Emergency Contact</label>
          <input
            type="tel"
            name="emergencyContact"
            value={bookingData.emergencyContact}
            onChange={handleChange}
            placeholder="Phone number for emergencies"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div>
      <h3 className="text-xl font-semibold text-neutral-dark mb-6">Payment Information</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        Payment will be processed after the babysitting session is completed.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">Payment Method</label>
          <select
            name="paymentMethod"
            value={bookingData.paymentMethod}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="card">Credit/Debit Card</option>
            <option value="paypal">PayPal</option>
            <option value="venmo">Venmo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">Card Number</label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            disabled={bookingData.paymentMethod !== 'card'}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">Expiry Date</label>
          <input
            type="text"
            placeholder="MM/YY"
            disabled={bookingData.paymentMethod !== 'card'}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">CVV</label>
          <input
            type="text"
            placeholder="123"
            disabled={bookingData.paymentMethod !== 'card'}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-dark mb-2">ZIP Code</label>
          <input
            type="text"
            placeholder="12345"
            disabled={bookingData.paymentMethod !== 'card'}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Booking Summary */}
      <Card className="p-6 mt-6">
        <h4 className="text-lg font-semibold text-neutral-dark mb-4">Booking Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-light">Babysitter:</span>
            <span className="text-neutral-dark">{student.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-light">Date:</span>
            <span className="text-neutral-dark">{bookingData.date || 'Select a date'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-light">Time:</span>
            <span className="text-neutral-dark">
              {bookingData.startTime && bookingData.endTime
                ? `${bookingData.startTime} - ${bookingData.endTime}`
                : 'Select time'}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-neutral-dark">Total:</span>
            <span className="text-primary">${calculateTotal()}</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderConfirmation = () => (
    <div>
      <h3 className="text-xl font-semibold text-neutral-dark mb-6">Confirm Your Booking</h3>
      
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center">
        <span className="text-green-600 mr-2">✓</span>
        <span className="text-green-800">
          Your booking request has been sent to {student.name}. You will receive a confirmation once they accept.
        </span>
      </div>

      <Card className="p-6">
        <h4 className="text-lg font-semibold text-neutral-dark mb-4">Booking Details</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-light">Babysitter:</span>
            <span className="text-neutral-dark">{student.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-light">Date & Time:</span>
            <span className="text-neutral-dark">
              {bookingData.date} from {bookingData.startTime} to {bookingData.endTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-light">Children:</span>
            <span className="text-neutral-dark">
              {bookingData.numberOfChildren} child(ren) - Ages: {bookingData.childrenAges || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-neutral-dark">Total Cost:</span>
            <span className="text-primary">${calculateTotal()}</span>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-neutral-dark mb-8">Book {student.name}</h1>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= activeStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index <= activeStep ? 'text-primary' : 'text-gray-600'
              }`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  index < activeStep ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="p-8">
        <div className="min-h-96">
          {activeStep === 0 && renderBookingDetails()}
          {activeStep === 1 && renderPayment()}
          {activeStep === 2 && renderConfirmation()}
        </div>
        
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <OutlineButton
            onClick={handleBack}
            disabled={activeStep === 0}
            className={activeStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Back
          </OutlineButton>
          
          <div>
            {activeStep === steps.length - 1 ? (
              <PrimaryButton onClick={handleSubmit}>
                ✓ Complete Booking
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={handleNext}
                disabled={
                  activeStep === 0 && (!bookingData.date || !bookingData.startTime || !bookingData.endTime)
                }
                className={
                  activeStep === 0 && (!bookingData.date || !bookingData.startTime || !bookingData.endTime)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }
              >
                Next
              </PrimaryButton>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingPage;
