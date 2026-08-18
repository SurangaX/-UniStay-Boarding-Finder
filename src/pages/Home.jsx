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
    <div>
      {/* Hero Section */}
      <div className="relative bg-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" 
            alt="Students" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Find Your Perfect <br className="hidden sm:block" />
            <span className="text-brand-200">Student Home</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl text-brand-50 mb-10">
            Ditch the hassle of finding boarding. Browse verified accommodations, read reviews from peers, and connect directly with trusted landlords near your campus.
          </p>
          
          {/* Quick Search */}
          <div className="bg-white p-4 rounded-xl shadow-xl max-w-3xl flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Distance (km)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="number" 
                  placeholder="e.g. 2"
                  className="pl-10 input-field"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Rent ($/mo)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-slate-400">$</span>
                <input 
                  type="number" 
                  placeholder="e.g. 400"
                  className="pl-8 input-field"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={handleSearch} className="w-full md:w-auto btn-primary h-[42px] flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Listings</h3>
              <p className="text-slate-600">Every property with a verified badge has been checked for safety and authenticity, so you can rent with peace of mind.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Close to Campus</h3>
              <p className="text-slate-600">Filter by distance to ensure you never have a long commute for those 8 AM lectures.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <HomeIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Student Reviews</h3>
              <p className="text-slate-600">Read honest reviews from previous student tenants before making a commitment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
