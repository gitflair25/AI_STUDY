import React from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { LogIn, LogOut, BookOpen, User } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  user: any;
}

export default function Navbar({ user }: NavbarProps) {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      
      let message = "Login failed. Please try again.";
      if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for Firebase Auth. Please add this URL to your Firebase Console authorized domains.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Google Sign-In is not enabled in your Firebase Console.";
      }
      
      console.error("Firebase Auth Error:", error.code, error.message);
      alert(message);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <BookOpen className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">StudyAI</span>
        </motion.div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20">
                  <img src={user.photoURL || ''} alt={user.displayName} referrerPolicy="no-referrer" />
                </div>
                <span className="text-sm font-medium text-white/80">{user.displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <LogIn size={18} />
              <span>Login with Google</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
