import { Link, useNavigate } from 'react-router-dom';
import { Home, UserCircle2, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-brand-600 dark:text-brand-500 hover:opacity-80 transition-opacity">
              <Home className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">UniBoarding</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">

            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <Link to="/" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                    Home
                  </Link>
                  <Link to="/search" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                    Browse Ads
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                      Admin Panel
                    </Link>
                  )}
                  {user.role === 'landlord' && (
                    <Link to="/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                      Dashboard
                    </Link>
                  )}
                  {user.role !== 'admin' && (
                    <Link to="/inbox" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                      Inbox
                    </Link>
                  )}
                  
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                  <Link 
                    to={user.role === 'admin' ? '/admin' : user.role === 'landlord' ? '/dashboard' : '/search'}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer group"
                    title="Go to your dashboard"
                  >
                    <UserCircle2 className="h-6 w-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    <span className="hidden sm:block font-medium">
                      {user.name}
                    </span>
                    <span className="hidden sm:inline-block ml-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800/50">
                      {user.role}
                    </span>
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Log out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                    Home
                  </Link>
                  <Link to="/search" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                    Browse Ads
                  </Link>
                  <Link to="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
                    Sign up
                  </Link>
                </div>
              )
            )}

            {/* Theme Toggle Switch */}
            <button 
              onClick={toggleDarkMode}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
              aria-label="Toggle Dark Mode"
            >
              <span
                className={`${
                  isDarkMode ? 'translate-x-7 bg-slate-900' : 'translate-x-1 bg-white'
                } inline-flex h-6 w-6 transform items-center justify-center rounded-full transition duration-200 ease-in-out shadow-sm`}
              >
                {isDarkMode ? (
                  <Moon className="h-3.5 w-3.5 text-blue-400" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
