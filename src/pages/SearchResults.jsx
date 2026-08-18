import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AccommodationCard from '../components/AccommodationCard';
import { Loader2 } from 'lucide-react';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialDistance = searchParams.get('distance') || '';
  const initialBudget = searchParams.get('budget') || '';

  const [distance, setDistance] = useState(initialDistance);
  const [budget, setBudget] = useState(initialBudget);

  useEffect(() => {
    fetch('/api/accommodations')
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        if (initialDistance) {
          filtered = filtered.filter(a => parseFloat(a.distance_to_uni) <= parseFloat(initialDistance));
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
  }, [initialDistance, initialBudget]);

  const updateFilters = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (distance) params.append('distance', distance);
    if (budget) params.append('budget', budget);
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-lg mb-4 text-slate-800">Filters</h2>
            <form onSubmit={updateFilters}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Distance (km)</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Rent ($)</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full btn-primary">Apply Filters</button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Search Results {accommodations.length > 0 && <span className="text-slate-500 font-normal text-lg">({accommodations.length})</span>}
          </h1>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : accommodations.length === 0 ? (
            <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
              <p className="text-slate-500 text-lg">No accommodations found matching your criteria.</p>
              <button onClick={() => setSearchParams({})} className="mt-4 text-brand-600 font-medium hover:underline">Clear all filters</button>
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
