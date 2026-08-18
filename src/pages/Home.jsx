import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, MapPin, Home as HomeIcon } from 'lucide-react';

export default function Home() {
  const [distance, setDistance] = useState('');
  const [budget, setBudget] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (distance) params.append('distance', distance);
    if (budget) params.append('budget', budget);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="dark:bg-slate-900 min-h-screen transition-colors duration-200">
      {/* Hero Section */}
      <div className="relative bg-brand-700 dark:bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" 
            alt="Students" 
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
            Find Your Perfect <br className="hidden sm:block" />
            <span className="text-brand-200 dark:text-brand-400">Student Home</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl text-brand-50 dark:text-slate-300 mb-12">
            Ditch the hassle of finding boarding. Browse verified accommodations, read reviews from peers, and connect directly with trusted landlords near your campus.
          </p>
          
          {/* Quick Search - Premium Pill Design */}
          <div className="bg-white dark:bg-slate-900 rounded-full shadow-2xl p-2 w-full max-w-3xl flex flex-col md:flex-row items-center border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex-1 w-full px-6 py-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-3xl md:rounded-l-full md:rounded-tr-none transition-colors cursor-text">
              <label className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-0.5">Location / Distance</label>
              <div className="relative flex items-center">
                <MapPin className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input 
                  type="number" 
                  placeholder="Max distance (km)"
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm md:text-base outline-none"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 w-full px-6 py-2 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-text">
              <label className="block text-[10px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-0.5">Budget</label>
              <div className="relative flex items-center">
                <span className="font-medium text-slate-400 mr-1 flex-shrink-0">$</span>
                <input 
                  type="number" 
                  placeholder="Max rent per month"
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm md:text-base outline-none"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-auto p-1 mt-2 md:mt-0">
              <button 
                onClick={handleSearch} 
                className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 text-white rounded-full h-12 px-8 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Verified Listings</h3>
              <p className="text-slate-600 dark:text-slate-400">Every property with a verified badge has been checked for safety and authenticity, so you can rent with peace of mind.</p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Close to Campus</h3>
              <p className="text-slate-600 dark:text-slate-400">Filter by distance to ensure you never have a long commute for those 8 AM lectures.</p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <HomeIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Student Reviews</h3>
              <p className="text-slate-600 dark:text-slate-400">Read honest reviews from previous student tenants before making a commitment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
