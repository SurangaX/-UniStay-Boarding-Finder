import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AccommodationCard from '../components/AccommodationCard';
import AccommodationCardSkeleton from '../components/AccommodationCardSkeleton';
import { Loader2, School, MapPin } from 'lucide-react';
import { SRI_LANKAN_UNIVERSITIES, calculateHaversineDistance } from '../data/universities';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialLocation = searchParams.get('location') || '';
  const initialBudget = searchParams.get('budget') || '';
  const initialDistance = searchParams.get('max_distance') || '';
  const initialUni = searchParams.get('uni') || '';

  const [location, setLocation] = useState(initialLocation);
  const [budget, setBudget] = useState(initialBudget);
  const [maxDistance, setMaxDistance] = useState(initialDistance);
  const [selectedUniId, setSelectedUniId] = useState(initialUni);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const parts = [];
            if (data.address.suburb) parts.push(data.address.suburb);
            if (data.address.city || data.address.town || data.address.village) {
              parts.push(data.address.city || data.address.town || data.address.village);
            }
            const foundLoc = parts.length > 0 ? parts.join(', ') : (data.address.road || data.display_name.split(',')[0]);
            setLocation(foundLoc);
            applyFilters(foundLoc, budget, maxDistance, selectedUniId);
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            applyFilters(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, budget, maxDistance, selectedUniId);
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          alert('Could not resolve your location name. Please type it in manually.');
        } finally {
          setGettingLocation(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to retrieve your location. Please check browser permissions.');
        setGettingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // Keep state synchronized whenever URL search params change
  useEffect(() => {
    setLocation(initialLocation);
    setBudget(initialBudget);
    setMaxDistance(initialDistance);
    setSelectedUniId(initialUni);
  }, [initialLocation, initialBudget, initialDistance, initialUni]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/accommodations')
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        const selectedUni = SRI_LANKAN_UNIVERSITIES.find(u => u.id === initialUni);

        if (selectedUni) {
          const uniCity = selectedUni.city.split(',')[0].toLowerCase().trim();
          const uniShort = selectedUni.shortName.toLowerCase().trim();

          filtered = filtered.map(acc => {
            let dist = parseFloat(acc.distance_to_uni) || 1.2;
            if (acc.lat && acc.lng && selectedUni.lat && selectedUni.lng) {
              const geoDist = calculateHaversineDistance(parseFloat(acc.lat), parseFloat(acc.lng), selectedUni.lat, selectedUni.lng);
              if (geoDist !== null) dist = geoDist;
            }
            return { ...acc, computed_distance: dist };
          });

          // Sort by nearest to chosen university first
          filtered.sort((a, b) => a.computed_distance - b.computed_distance);
        }

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

        if (initialDistance) {
          filtered = filtered.filter(a => {
            const d = a.computed_distance !== undefined ? a.computed_distance : parseFloat(a.distance_to_uni);
            return d <= parseFloat(initialDistance);
          });
        }

        setAccommodations(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [initialLocation, initialBudget, initialDistance, initialUni]);

  const applyFilters = (newLoc, newBudget, newDist, newUni) => {
    const locVal = newLoc !== undefined ? newLoc : location;
    const budVal = newBudget !== undefined ? newBudget : budget;
    const distVal = newDist !== undefined ? newDist : maxDistance;
    const uniVal = newUni !== undefined ? newUni : selectedUniId;

    const params = new URLSearchParams();
    if (locVal) params.append('location', locVal);
    if (budVal) params.append('budget', budVal);
    if (distVal) params.append('max_distance', distVal);
    if (uniVal) params.append('uni', uniVal);
    setSearchParams(params);
  };

  const updateFilters = (e) => {
    if (e) e.preventDefault();
    applyFilters();
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={gettingLocation}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors disabled:opacity-50"
                    title="Use my current location"
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Use my location</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. Colombo"
                    className="input-field pr-9"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={gettingLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1 rounded transition-colors disabled:opacity-50"
                    title="Use my current location"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="mb-4">
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span>Target University</span>
                </label>
                <div className="relative">
                  <select 
                    className="input-field text-xs sm:text-sm truncate pr-8 cursor-pointer"
                    value={selectedUniId}
                    onChange={(e) => {
                      const uniId = e.target.value;
                      setSelectedUniId(uniId);
                      const uni = SRI_LANKAN_UNIVERSITIES.find(u => u.id === uniId);
                      const newCity = uni ? uni.city.split(',')[0].trim() : '';
                      setLocation(newCity);
                      // Instantly apply the switch to update URL and search results immediately
                      applyFilters(newCity, budget, maxDistance, uniId);
                    }}
                  >
                    <option value="">All Universities in Sri Lanka</option>
                    {SRI_LANKAN_UNIVERSITIES.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.shortName} ({u.city.split(',')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Distance to Uni (km)</label>
                <select 
                  className="input-field"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                >
                  <option value="">Any Distance</option>
                  <option value="1">Within 1 km (&lt; 12 mins walk)</option>
                  <option value="2">Within 2 km (&lt; 25 mins walk)</option>
                  <option value="3">Within 3 km (Campus Radius)</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <AccommodationCardSkeleton key={`skeleton-${i}`} />
              ))}
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
