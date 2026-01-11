import { useState } from 'react';
import { Leaf } from "lucide-react";
import AuthDialog from "../components/AuthDialog";
import { onAuthStateChanged } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../utils/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import SimpleGoogleTranslate from '../components/SimpleGoogleTranslate';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import WorkflowSection from '../components/Landing/WorkflowSection';

const Index = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  const observeAuthState = (onUserAuthenticated, onUserNotAuthenticated) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user);
        onUserAuthenticated(user);
      } else {
        console.log("No user is logged in.");
        onUserNotAuthenticated();
      }
    });
  };

  const signInUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Signin error:", error.message);
      throw error;
    }
  };

  const handleAuthCheck = () => {
    observeAuthState(
      (user) => {
        // User is logged in
        setCurrentUser(user);
        setIsLoggedIn(true);
      },
      () => {
        // No user is logged in
        // navigate("/login");
      }
    );
  };

  const handleSignin = async (email, password) => {
    try {
      const user = await signInUser(email, password);
      setIsLoggedIn(true);
      setCurrentUser(user);
      // redirect or show message
    } catch (err) {
      console.log(err.message);
    }
  };

  if (isLoggedIn && currentUser) {
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen w-full bg-white relative">
      <div className='w-full z-50 fixed top-0 left-0 pointer-events-none'>
        <div className="pointer-events-auto">
          <AuthDialog
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLogin={(email, password) => handleSignin(email, password)}
          />
        </div>
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">KisaanSaathi</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <span className="text-gray-600 hover:text-green-600 font-medium text-sm transition-colors cursor-pointer">Dashboard</span>
              <Link to="/architecture" className="text-gray-600 hover:text-green-600 font-medium text-sm transition-colors">Architecture</Link>
              <a href="https://github.com/deba2k5/agri_front" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-600 font-medium text-sm transition-colors">GitHub</a>
            </div>

            <div className="flex items-center space-x-4">
              <div className="scale-90 origin-right">
                <SimpleGoogleTranslate />
              </div>
              <button
                onClick={() => {
                  setIsAuthOpen(true)
                  handleAuthCheck()
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Launch App
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <HeroSection onOpenAuth={() => setIsAuthOpen(true)} />
        <FeaturesSection />
        <WorkflowSection />
      </main>

      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4 opacity-50">
            <Leaf className="h-6 w-6" />
            <span className="text-lg font-bold">KisaanSaathi</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 KisaanSaathi Protocol. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;