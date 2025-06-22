# Mess Management System

A modern, full-stack mess management system built with React, Node.js, and MongoDB. This system helps educational institutions manage student meals, bookings, payments, and feedback efficiently.

## Features

### 🍽️ **Meal Management**
- Create and manage daily meals (breakfast, lunch, dinner)
- Set meal prices, nutritional information, and dietary restrictions
- Track meal capacity and bookings
- Support for vegetarian/non-vegetarian options

### 👥 **Student Management**
- Student registration with detailed profiles
- Room number and contact information tracking
- Dietary preferences and restrictions
- Mess plan selection (daily/weekly/monthly)

### 📅 **Booking System**
- Real-time meal booking and cancellation
- Booking status tracking (booked, consumed, cancelled)
- Special requests and dietary accommodations
- Booking history and analytics

### 💳 **Payment Management**
- Multiple payment types (daily, weekly, monthly)
- Payment status tracking (pending, completed, failed)
- Invoice generation
- Revenue analytics and reporting

### ⭐ **Feedback System**
- Student feedback and ratings for meals
- Anonymous feedback option
- Admin response and resolution tracking
- Feedback analytics and insights

### 🔐 **Authentication & Authorization**
- Secure user authentication with JWT
- Role-based access control (Admin, Student, Mess Staff)
- Password reset functionality
- Profile management

### 📊 **Analytics & Reporting**
- Dashboard with key metrics
- Student and meal statistics
- Revenue and payment reports
- Booking and consumption analytics

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Router** - Client-side routing
- **React Hot Toast** - Toast notifications
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd messmanagementsystem
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/mess_management

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Optional: Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

### 4. Start the development servers

```bash
# Start the backend server (from server directory)
cd server
npm run dev

# Start the frontend development server (from client directory)
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

```
messmanagementsystem/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json
├── server/                 # Backend Node.js application
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── uploads/            # File uploads
│   ├── server.js           # Main server file
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/reset-password` - Reset password

### Meals
- `GET /api/meals` - Get all meals
- `POST /api/meals` - Create meal (Admin)
- `PUT /api/meals/:id` - Update meal (Admin)
- `DELETE /api/meals/:id` - Delete meal (Admin)
- `POST /api/meals/book/:mealId` - Book a meal
- `PUT /api/meals/cancel-booking/:bookingId` - Cancel booking

### Students
- `GET /api/students` - Get all students (Admin)
- `GET /api/students/:id` - Get student by ID (Admin)
- `PUT /api/students/:id` - Update student (Admin)
- `DELETE /api/students/:id` - Delete student (Admin)

### Bookings
- `GET /api/bookings` - Get all bookings (Admin)
- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking (Admin)

### Payments
- `GET /api/payments` - Get all payments (Admin)
- `GET /api/payments/my-payments` - Get user payments
- `POST /api/payments` - Create payment (Admin)
- `POST /api/payments/process` - Process payment

### Feedback
- `GET /api/feedback` - Get all feedback (Admin)
- `GET /api/feedback/my-feedback` - Get user feedback
- `POST /api/feedback` - Create feedback
- `PUT /api/feedback/:id` - Update feedback

## Usage

### For Students
1. Register an account with your details
2. Browse available meals
3. Book meals in advance
4. Track your bookings and payments
5. Provide feedback on meals

### For Administrators
1. Access the admin dashboard
2. Manage student registrations
3. Create and manage meals
4. Monitor bookings and payments
5. View analytics and reports
6. Respond to student feedback

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/yourusername/messmanagementsystem/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- MongoDB for the flexible database solution
- All contributors and users of this project

---

**Happy Coding! 🚀** 