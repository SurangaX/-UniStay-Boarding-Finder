import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, MapPin, Home as HomeIcon, Loader2 } from 'lucide-react';
import AccommodationCard from '../components/AccommodationCard';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export default function Home() {
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [mapPosition, setMapPosition] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
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
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater position={mapPosition} />
                <HomeMapPicker position={mapPosition} setPosition={setMapPosition} setLocation={setLocation} setGettingLocation={setGettingLocation} />
              </MapContainer>
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
            <div className="w-full md:w-[50%] flex flex-col justify-center space-y-4 px-2 py-4">
              <div ref={wrapperRef}>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-1.5">Search Location</label>
                <div className="text-xs text-slate-500 mb-2">Click on the map or type to set your location.</div>
                <div className="relative">
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 z-[60]">
                    <MapPin className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
                    <input 
                      type="text" 
                      placeholder="e.g. Colombo 07..."
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 outline-none"
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
                    <option value="" className="text-slate-900 dark:bg-slate-800">Any Distance</option>
                    <option value="1" className="text-slate-900 dark:bg-slate-800">Within 1 km</option>
                    <option value="2" className="text-slate-900 dark:bg-slate-800">Within 2 km</option>
                    <option value="5" className="text-slate-900 dark:bg-slate-800">Within 5 km</option>
                    <option value="10" className="text-slate-900 dark:bg-slate-800">Within 10 km</option>
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
                    <option value="" className="text-slate-900 dark:bg-slate-800">Any Budget</option>
                    <option value="10000" className="text-slate-900 dark:bg-slate-800">Under 10,000 /mo</option>
                    <option value="20000" className="text-slate-900 dark:bg-slate-800">10,000 - 20,000 /mo</option>
                    <option value="30000" className="text-slate-900 dark:bg-slate-800">20,000 - 30,000 /mo</option>
                    <option value="40000" className="text-slate-900 dark:bg-slate-800">30,000 - 40,000 /mo</option>
                    <option value="50000" className="text-slate-900 dark:bg-slate-800">40,000+ /mo</option>
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

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="py-16 bg-white dark:bg-slate-950 transition-colors duration-200 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Recently Viewed</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewed.map(acc => (
                <AccommodationCard key={acc.id} acc={acc} />
              ))}
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
