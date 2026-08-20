import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AccommodationCard from '../components/AccommodationCard';
import { Loader2 } from 'lucide-react';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialLocation = searchParams.get('location') || '';
  const initialBudget = searchParams.get('budget') || '';

  const [location, setLocation] = useState(initialLocation);
  const [budget, setBudget] = useState(initialBudget);

  useEffect(() => {
    fetch('/api/accommodations')
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        if (initialLocation) {
          const mainLocation = initialLocation.split(',')[0].toLowerCase().trim();
          filtered = filtered.filter(a => {
            const locMatch = a.location && a.location.toLowerCase().includes(mainLocation);
            const titleMatch = a.title && a.title.toLowerCase().includes(mainLocation);
            const descMatch = a.description && a.description.toLowerCase().includes(mainLocation);
            return locMatch || titleMatch || descMatch;
          });
        }
        if (initialBudget) {
          filtered = filtered.filter(a => parseFloat(a.rent_amount) <= parseFloat(initialBudget));
        }
        setAccommodations(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [initialLocation, initialBudget]);

  const updateFilters = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (budget) params.append('budget', budget);
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Filters</h2>
            <form onSubmit={updateFilters}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Colombo"
                  className="input-field"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Rent (LKR)</label>
                <select 
                  className="input-field"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                >
                  <option value="">Any Budget</option>
                  <option value="10000">Under 10,000</option>
                  <option value="20000">10,000 - 20,000</option>
                  <option value="30000">20,000 - 30,000</option>
                  <option value="40000">30,000 - 40,000</option>
                  <option value="50000">40,000+</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-brand-600 text-white rounded-md py-2 hover:bg-brand-700 transition">Apply Filters</button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Search Results {accommodations.length > 0 && <span className="text-slate-500 font-normal text-lg">({accommodations.length})</span>}
          </h1>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : accommodations.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-lg">No accommodations found matching your criteria.</p>
              <button onClick={() => setSearchParams({})} className="mt-4 text-brand-600 dark:text-brand-400 font-medium hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map(acc => (
                <AccommodationCard key={acc.id} acc={acc} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
