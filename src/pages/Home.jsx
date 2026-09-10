import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, MapPin, Home as HomeIcon, Loader2, School, Sparkles, Flame, ArrowRight, Clock, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AccommodationCard from '../components/AccommodationCard';
import AccommodationCardSkeleton from '../components/AccommodationCardSkeleton';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SRI_LANKAN_UNIVERSITIES } from '../data/universities';

// Fix for default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function HomeMapPicker({ position, setPosition, setLocation, setGettingLocation }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setGettingLocation(true);
      
      // Reverse Geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const parts = [];
            if (data.address.road) parts.push(data.address.road);
            if (data.address.suburb) parts.push(data.address.suburb);
            if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
            
            const finalLocation = parts.length > 0 ? parts.join(', ') : data.display_name;
            setLocation(finalLocation);
          }
        })
        .catch(err => console.error("Geocoding error: ", err))
        .finally(() => setGettingLocation(false));
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, {
        animate: true,
        duration: 1
      });
    }
  }, [position, map]);
  return null;
}

function MobileMapTouchHandler({ isMobileActive, setIsMobileActive }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && window.innerWidth <= 768) {
      if (isMobileActive) {
        map.dragging.enable();
        if (map.touchZoom) map.touchZoom.enable();
      } else {
        map.dragging.disable();
        if (map.touchZoom) map.touchZoom.enable(); // pinch-to-zoom always works smoothly
      }
    } else {
      map.dragging.enable();
    }
  }, [map, isMobileActive]);

  return null;
}

export default function Home() {
  const [selectedUni, setSelectedUni] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [mapPosition, setMapPosition] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isMobileMapActive, setIsMobileMapActive] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLocations = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/places?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocation(val);
    setShowSuggestions(true);
    
    const timer = setTimeout(() => fetchLocations(val), 300);
    return () => clearTimeout(timer);
  };

  const selectLocation = (place) => {
    setLocation(place.display_name);
    setShowSuggestions(false);
    
    // Move map pin
    if (place.lat && place.lon) {
      setMapPosition([parseFloat(place.lat), parseFloat(place.lon)]);
    }
  };

  const [featuredListings, setFeaturedListings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setListingsLoading(true);
        const res = await fetch('/api/accommodations');
        if (res.ok) {
          const data = await res.json();
          // Featured: prioritized by is_boosted, then fallback to verified
          const boosted = data.filter(a => a.is_boosted);
          const nonBoostedVerified = data.filter(a => !a.is_boosted && a.is_verified);
          const combinedFeatured = [...boosted, ...nonBoostedVerified].slice(0, 4);
          setFeaturedListings(combinedFeatured.length > 0 ? combinedFeatured : data.slice(0, 4));

          // Recently added: sorted by created_at DESC
          const sortedRecent = [...data].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8);
          setRecentListings(sortedRecent);
        }
      } catch (err) {
        console.error('Failed to fetch home listings:', err);
      } finally {
        setListingsLoading(false);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    try {
      const viewedStr = localStorage.getItem('recently_viewed');
      if (viewedStr) {
        setRecentlyViewed(JSON.parse(viewedStr));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const getLocationFromDevice = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapPosition([latitude, longitude]);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) {
              const parts = [];
              if (data.address.road) parts.push(data.address.road);
              if (data.address.suburb) parts.push(data.address.suburb);
              if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
              
              const finalLocation = parts.length > 0 ? parts.join(', ') : data.display_name;
              setLocation(finalLocation);
            }
          })
          .catch(err => console.error("Geocoding error: ", err))
          .finally(() => setGettingLocation(false));
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location. Please check your permissions.");
        setGettingLocation(false);
      }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedUni) params.append('uni', selectedUni);
    if (location) params.append('location', location);
    if (budget) params.append('budget', budget);
    if (maxDistance) params.append('max_distance', maxDistance);
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
            Find Your Perfect <br className="hidden sm:block" />
            <span className="text-brand-200 dark:text-brand-400">Student Home</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl text-brand-50 dark:text-slate-300 mb-10">
            Ditch the hassle of finding boarding. Browse verified accommodations, read reviews from peers, and connect directly with trusted landlords near your campus.
          </p>
          
          {/* Map & Search Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-4 w-full max-w-5xl border border-slate-100 dark:border-slate-800 transition-colors text-left flex flex-col md:flex-row gap-6">
            
            {/* Map Container */}
            <div className="w-full md:w-[50%] h-[300px] md:h-auto rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700 z-10">
              <MapContainer 
                center={[6.9271, 79.8612]} // Default to Colombo
                zoom={11} 
                scrollWheelZoom={false}
                tap={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater position={mapPosition} />
                <MobileMapTouchHandler isMobileActive={isMobileMapActive} setIsMobileActive={setIsMobileMapActive} />
                <HomeMapPicker position={mapPosition} setPosition={setMapPosition} setLocation={setLocation} setGettingLocation={setGettingLocation} />
              </MapContainer>

              {/* Mobile Tap-to-Interact Badge/Toggle */}
              <div className="md:hidden absolute bottom-2 left-2 z-[1000]">
                <button
                  type="button"
                  onClick={() => setIsMobileMapActive(!isMobileMapActive)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-md transition-all flex items-center gap-1.5 backdrop-blur-sm ${
                    isMobileMapActive 
                      ? 'bg-brand-600 text-white shadow-brand-500/20 ring-2 ring-brand-400' 
                      : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <span>{isMobileMapActive ? 'Map Active (Tap to lock page scroll)' : 'Tap map to interact / scroll page freely'}</span>
                </button>
              </div>

              <div className="absolute top-2 right-2 z-[1000]">
                <button 
                  type="button" 
                  onClick={getLocationFromDevice}
                  disabled={gettingLocation}
                  className="bg-white dark:bg-slate-800 text-brand-600 hover:text-brand-700 p-2 rounded-lg shadow-md font-medium disabled:opacity-50 flex items-center justify-center border border-slate-200 dark:border-slate-700"
                  title="Use My Location"
                >
                  {gettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Filter Forms */}
            <div className="w-full md:w-[50%] flex flex-col justify-center space-y-3 px-2 py-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Select University (Sri Lanka)</span>
                </label>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
                  <select 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
                    value={selectedUni}
                    onChange={(e) => {
                      const uniId = e.target.value;
                      setSelectedUni(uniId);
                      const uni = SRI_LANKAN_UNIVERSITIES.find(u => u.id === uniId);
                      if (uni) {
                        setMapPosition([uni.lat, uni.lng]);
                        if (!location || location === '') {
                          setLocation(uni.city.split(',')[0]);
                        }
                      }
                    }}
                  >
                    <option value="" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Choose Your Campus / University</option>
                    {SRI_LANKAN_UNIVERSITIES.map(u => (
                      <option key={u.id} value={u.id} className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">
                        {u.name} ({u.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div ref={wrapperRef}>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-1">Search Location</label>
                <div className="relative">
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 z-[60]">
                    <MapPin className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                    <input 
                      type="text" 
                      placeholder="e.g. Kelaniya, Colombo 07..."
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                      value={location}
                      onChange={handleLocationChange}
                      onFocus={() => setShowSuggestions(true)}
                    />
                  </div>
                  
                  {/* Custom Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-700">
                      {suggestions.map((place) => (
                        <li 
                          key={place.place_id}
                          onClick={() => selectLocation(place)}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-left text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          <div className="font-medium text-slate-900 dark:text-white truncate">{place.name}</div>
                          <div className="text-xs text-slate-500 truncate">{place.display_name}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-1.5">Max Distance to Uni (Range)</label>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                  <select 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-900 dark:text-white outline-none cursor-pointer"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value)}
                  >
                    <option value="" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Any Distance</option>
                    <option value="1" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Within 1 km</option>
                    <option value="2" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Within 2 km</option>
                    <option value="5" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Within 5 km</option>
                    <option value="10" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Within 10 km</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-1.5">Max Budget (LKR)</label>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                  <select 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-900 dark:text-white outline-none cursor-pointer"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  >
                    <option value="" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Any Budget</option>
                    <option value="10000" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">Under 10,000 /mo</option>
                    <option value="20000" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">10,000 - 20,000 /mo</option>
                    <option value="30000" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">20,000 - 30,000 /mo</option>
                    <option value="40000" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">30,000 - 40,000 /mo</option>
                    <option value="50000" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">40,000+ /mo</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={handleSearch} 
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white rounded-xl h-14 flex items-center justify-center gap-2 font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <Search className="w-5 h-5" />
                  <span>Search Properties</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Accommodations */}
      {(listingsLoading || featuredListings.length > 0) && (
        <div className="py-16 bg-white dark:bg-slate-950 transition-colors duration-200 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Editor's Choice & Promoted</span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  Featured Accommodations
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Hand-picked student homes, high-rated stays, and verified host partners
                </p>
              </div>
              <Link 
                to="/search" 
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors group"
              >
                <span>View all listings</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listingsLoading ? (
                [...Array(4)].map((_, i) => (
                  <AccommodationCardSkeleton key={`featured-skeleton-${i}`} />
                ))
              ) : (
                featuredListings.map(acc => (
                  <AccommodationCard key={`featured-${acc.id}`} acc={acc} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="py-16 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-200 border-t border-slate-200/60 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Your Activity</span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  Recently Viewed
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Places and rooms you looked at during this session
                </p>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('recently_viewed');
                  setRecentlyViewed([]);
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                title="Clear viewed history"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear history</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewed.map(acc => (
                <AccommodationCard key={`viewed-${acc.id}`} acc={acc} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently Added */}
      {(listingsLoading || recentListings.length > 0) && (
        <div className="py-16 bg-white dark:bg-slate-950 transition-colors duration-200 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fresh on UniStay</span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  Recently Added
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  The latest boarding places and rooms listed by local landlords
                </p>
              </div>
              <Link 
                to="/search" 
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors group"
              >
                <span>Browse all new</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listingsLoading ? (
                [...Array(4)].map((_, i) => (
                  <AccommodationCardSkeleton key={`recent-skeleton-${i}`} />
                ))
              ) : (
                recentListings.map(acc => (
                  <AccommodationCard key={`recent-${acc.id}`} acc={acc} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
