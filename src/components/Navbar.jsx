import { Link } from 'react-router-dom';
import { Home, UserCircle2, Moon, Sun, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, loginAs, loading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

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
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {!loading && user && (
              <div className="flex items-center gap-4">
                {user.role === 'landlord' ? (
                  <Link to="/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/search" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block">
                    Browse
                  </Link>
                )}
                
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <UserCircle2 className="h-6 w-6 text-slate-400" />
                  <span className="hidden sm:block font-medium">
                    {user.name}
                  </span>
                </div>
                
                {/* Custom Role Switcher */}
                <button 
                  onClick={() => loginAs(user.role === 'student' ? 'landlord' : 'student')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm"
                  title="Switch Role"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  {user.role === 'student' ? 'Student' : 'Landlord'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
