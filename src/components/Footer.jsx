import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-brand-600 dark:text-brand-500 hover:opacity-80 transition-opacity mb-4">
              <Home className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">UniBoarding</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm">
              The premier platform for university students to find safe, comfortable, and affordable accommodations near campus.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Browse Ads
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Safety Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            &copy; {currentYear} UniBoarding. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Made for Students
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
