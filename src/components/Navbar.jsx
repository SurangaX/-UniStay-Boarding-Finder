import { Link } from 'react-router-dom';
import { Home, UserCircle2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, loginAs, loading } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-brand-600">
              <Home className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight">UniBoarding</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {!loading && user && (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <UserCircle2 className="h-5 w-5" />
                  <span className="hidden sm:block">
                    {user.name} ({user.role})
                  </span>
                </div>
                {user.role === 'landlord' ? (
                  <Link to="/dashboard" className="text-sm font-medium text-slate-700 hover:text-brand-600">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/search" className="text-sm font-medium text-slate-700 hover:text-brand-600">
                    Browse
                  </Link>
                )}
                
                {/* Mock role switcher for testing */}
                <select 
                  className="text-xs border rounded p-1 ml-2 bg-slate-50"
                  value={user.role}
                  onChange={(e) => loginAs(e.target.value)}
                >
                  <option value="student">Student Mode</option>
                  <option value="landlord">Landlord Mode</option>
                </select>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
