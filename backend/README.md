# Sit Side Backend API

This is the backend API server for Sit Side, built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sitside
   JWT_SECRET=your_super_secret_jwt_key_here
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

4. **Run the server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/students` - Get all students (for parents)
- `GET /api/users/students/:id` - Get student profile
- `GET /api/users/search` - Search students
- `PUT /api/users/availability` - Update availability (students only)
- `POST /api/users/certifications` - Add certification (students only)
- `DELETE /api/users/certifications/:cert` - Remove certification

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/complete` - Mark booking as completed
- `POST /api/bookings/:id/review` - Add review to booking

## 🗄️ Database Schema

### User Model
- Basic info: email, password, firstName, lastName, phone, userType
- Student fields: grade, school, bio, hourlyRate, experience, certifications, location, availability
- Parent fields: emergencyContact
- Common fields: profileImage, rating, reviewCount, isVerified, isActive, backgroundCheckStatus

### Booking Model
- Booking details: student, parent, date, startTime, endTime, numberOfChildren
- Payment: hourlyRate, totalAmount, paymentStatus, stripePaymentIntentId
- Reviews: studentReview, parentReview
- Status: pending, confirmed, completed, cancelled, disputed

## 🔒 Security Features

- JWT authentication with 7-day expiration
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 🧪 Testing the API

### Register a student:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "firstName": "Alex",
    "lastName": "Thompson",
    "phone": "555-1234",
    "userType": "student",
    "grade": 11,
    "school": "Lincoln High School"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

### Get students (with auth token):
```bash
curl -X GET http://localhost:5000/api/users/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Deployment

### Environment Variables for Production:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sitside
JWT_SECRET=your_production_jwt_secret_here
CORS_ORIGIN=https://your-frontend-domain.com
```

### Deploy to Heroku:
```bash
heroku create sitside-backend
heroku config:set MONGODB_URI=your_production_mongodb_uri
heroku config:set JWT_SECRET=your_production_jwt_secret
git push heroku main
```

## 📝 Next Steps

This backend provides the foundation for:
- ✅ User authentication and authorization
- ✅ Student and parent profiles
- ✅ Booking management
- ✅ Review system

Still to implement:
- 💳 Stripe payment processing
- 🔍 Background check integration
- 💬 Real-time messaging (Socket.io)
- 📱 Push notifications
- 👨‍💼 Admin dashboard

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env
   - Verify network access for MongoDB Atlas

2. **JWT Token Errors:**
   - Check JWT_SECRET is set in .env
   - Ensure token is included in Authorization header
   - Verify token hasn't expired (7 days)

3. **CORS Issues:**
   - Update CORS_ORIGIN in .env
   - Ensure frontend URL matches exactly

4. **Port Already in Use:**
   - Change PORT in .env
   - Kill existing process: `lsof -ti:5000 | xargs kill -9`
