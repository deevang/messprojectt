import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { weeklyMealPlanAPI } from '../services/api';
import { useState, useEffect } from 'react';
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
import tiffinspaceLogo from '../assets/tiffinspace-logo.png';

const HomePage = () => {
  const { user } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);

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

  const fetchWeeklyPlan = async () => {
    setPlanLoading(true);
    try {
      const res = await weeklyMealPlanAPI.getWeeklyPlan();
      setWeeklyPlan(res.data.meals || []);
    } catch (err) {
      setWeeklyPlan([]);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPlan();
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}


      {/* Custom Hero Section */}
      <section className="pt-16 pb-8 bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <img 
            src={tiffinspaceLogo} 
            alt="Bowl Logo" 
            className="w-16 h-16 mb-4 animate-float"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.10))' }}
          />
          <h1 className="text-4xl md:text-6xl font-serif font-semibold text-gray-900 dark:text-white mb-4 leading-tight">
            Your daily dose of<br />home-cooked happiness
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
            Serving up smiles to students and professionals with our daily thali.
            <br />
            <br />
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={user ? (user.role === 'admin' ? '/admin' : user.role === 'staff_head' ? '/head-staff' : user.role === 'mess_staff' ? '/mess-staff' : user.role === 'student') : '/login'}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                  Access Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
        </div>
      </section>

      {/* Hero Section */}
    

      {/* Stats Section */}
      {/* <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
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
      </section>  */}

      {/* Benefits & USP's Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-gray-900 dark:text-white mb-8 text-center">Our Benefits & USP's</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
            {/* Card 1 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-green-100 dark:bg-green-200/80 p-6 flex flex-col items-center text-center shadow-md transition-transform duration-200 hover:scale-105">
              <span className="uppercase text-[10px] tracking-widest text-gray-700 mb-3 mt-1">Homemade Meals</span>
              <p className="text-base text-black mb-6">Enjoy the comfort of homestyle cooking, no matter where you are, anytime.</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-black mt-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9zm9 3.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm0 0v2.5m0-2.5v-2.5" /></svg>
            </div>
            {/* Card 2 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-purple-100 dark:bg-purple-200/80 p-6 flex flex-col items-center text-center shadow-md transition-transform duration-200 hover:scale-105">
              <span className="uppercase text-[10px] tracking-widest text-gray-700 mb-3 mt-1">Nutritionally Balanced</span>
              <p className="text-base text-black mb-6">Our meals aren't just delicious; they're crafted to meet your nutritional needs.</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-black mt-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-6 0a2 2 0 01-2-2v-2a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2m-6 0v2a2 2 0 002 2h2a2 2 0 002-2v-2" /></svg>
            </div>
            {/* Card 3 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-pink-100 dark:bg-pink-200/80 p-6 flex flex-col items-center text-center shadow-md transition-transform duration-200 hover:scale-105">
              <span className="uppercase text-[10px] tracking-widest text-gray-700 mb-3 mt-1">On Time Deliveries</span>
              <p className="text-base text-black mb-6">With our on-time delivery service, you can count on having your meal exactly when you need it.</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-black mt-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-9 13V5a2 2 0 012-2h2a2 2 0 012 2v16" /></svg>
            </div>
            {/* Card 4 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-orange-100 dark:bg-orange-200/80 p-6 flex flex-col items-center text-center shadow-md transition-transform duration-200 hover:scale-105">
              <span className="uppercase text-[10px] tracking-widest text-gray-700 mb-3 mt-1">Flexible Meal for Everyone</span>
              <p className="text-base text-black mb-6">Meals for all: diverse plans for every diet and lifestyle, from students to professionals</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-black mt-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
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

      {/* Weekly Meal Plan Section */}
      {/* <section className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              This Week's Meal Plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Check out our delicious weekly menu and plan your meals in advance.
            </p>
          </div>
          {planLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-4">Loading meal plan...</p>
            </div>
          ) : weeklyPlan.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Day</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Breakfast</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Lunch</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Dinner</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {weeklyPlan.map(day => (
                      <tr key={day.day} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{day.day}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{day.breakfast || 'TBD'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{day.lunch || 'TBD'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{day.dinner || 'TBD'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {user && user.role === 'student' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/student"
                      className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Book Your Meals
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                    <Link
                      to="/meals"
                      className="inline-flex items-center bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      View All Meals
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <img src={tiffinspaceLogo} alt="TiffinSpace Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
              <p className="text-gray-600 dark:text-gray-300">No meal plan available at the moment.</p>
            </div>
          )}
        </div>
      </section> */}

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
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
                    to={user.role === 'admin' ? '/admin' : user.role === 'staff_head' ? '/head-staff' : user.role === 'mess_staff' ? '/mess-staff' : '/student'}
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
                <img src={tiffinspaceLogo} alt="TiffinSpace Logo" className="w-8 h-8 object-contain rounded-lg" />
                <span className="text-xl font-bold">TiffinSpace</span>
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
            <p>&copy; 2024 TiffinSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;