import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Utensils, 
  Users, 
  Calendar, 
  CreditCard, 
  Star, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

const HomePage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Utensils className="w-6 h-6" />,
      title: "Smart Meal Booking",
      description: "Book your meals in advance with our intuitive booking system. Choose from breakfast, lunch, and dinner options."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Student Management",
      description: "Efficiently manage student registrations, profiles, and dietary preferences in one centralized system."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Meal Scheduling",
      description: "Plan and schedule meals with detailed nutritional information and dietary restrictions support."
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payment Tracking",
      description: "Track payments, generate invoices, and manage billing with our comprehensive payment system."
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Feedback System",
      description: "Collect and manage feedback from students to continuously improve meal quality and service."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "Your data is protected with industry-standard security measures and regular backups."
    }
  ];

  const stats = [
    { label: "Active Students", value: "500+", icon: <Users className="w-5 h-5" /> },
    { label: "Meals Served", value: "50K+", icon: <Utensils className="w-5 h-5" /> },
    { label: "Satisfaction Rate", value: "98%", icon: <Star className="w-5 h-5" /> },
    { label: "Daily Orders", value: "1.5K+", icon: <Clock className="w-5 h-5" /> }
  ];

  const benefits = [
    "Easy meal booking and cancellation",
    "Real-time meal availability updates",
    "Dietary preference management",
    "Automated payment processing",
    "Comprehensive reporting and analytics",
    "Mobile-friendly interface",
    "24/7 customer support",
    "Regular menu updates"
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}


      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Modern Mess
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                {" "}Management
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Streamline your mess operations with our comprehensive management system. 
              From meal booking to payment tracking, we've got everything covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={user ? (user.role === 'admin' ? '/admin' : '/student') : '/login'}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                  Access Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> 

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to manage your mess
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to efficiently 
              manage mess operations and provide excellent service to students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why choose our mess management system?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We've designed our platform to make mess management as simple and efficient as possible. 
                Here's what makes us different:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-200">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                <p className="text-blue-100 dark:text-blue-200 mb-6">
                  Join thousands of students and administrators who trust our platform 
                  for their mess management needs.
                </p>
                {user ? (
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/student'}
                    className="inline-flex items-center bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex items-center bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Start Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">MessManager</span>
              </div>
              <p className="text-gray-400 dark:text-gray-300">
                Modern mess management system for educational institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-300">
                <li>Meal Booking</li>
                <li>Student Management</li>
                <li>Payment Tracking</li>
                <li>Feedback System</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-300">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Documentation</li>
                <li>API Reference</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-300">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Careers</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2024 MessManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;