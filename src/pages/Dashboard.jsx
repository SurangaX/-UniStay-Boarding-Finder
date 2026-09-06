import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2, MapPin, ShieldCheck, CheckCircle2, Clock, UploadCloud, FileText, CheckCircle } from 'lucide-react';
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

function MapLocationPicker({ position, setPosition, setLocation }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      // Reverse Geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            // Simplify address to a reasonable length if needed, or use full display_name
            const parts = [];
            if (data.address.road) parts.push(data.address.road);
            if (data.address.suburb) parts.push(data.address.suburb);
            if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
            
            const finalLocation = parts.length > 0 ? parts.join(', ') : data.display_name;
            setLocation(finalLocation);
          }
        })
        .catch(err => console.error("Geocoding error: ", err));
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

export default function Dashboard() {
  const { user } = useAuth();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listing Form State
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [mapPosition, setMapPosition] = useState(null); // Initialize with null until clicked
  const [rentAmount, setRentAmount] = useState('');
  const [distance, setDistance] = useState('');
  const [photoInputType, setPhotoInputType] = useState('upload'); // 'upload' or 'url'
  const [photosText, setPhotosText] = useState('');
  const [base64Photos, setBase64Photos] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

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

  // Landlord Verification Application State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationApp, setVerificationApp] = useState(null);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    full_name: user?.name || '',
    nic_number: '',
    phone_number: user?.contact_number || '',
    whatsapp_number: user?.whatsapp_number || user?.contact_number || '',
    nic_front_url: '',
    utility_bill_url: '',
    payment_slip_url: '',
    package_amount: 1490.00
  });

  useEffect(() => {
    if (user?.role === 'landlord') {
      fetch(`/api/accommodations?landlord_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setAccommodations(data);
          setLoading(false);
        });

      // Fetch landlord's latest verification status
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/verifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setVerificationApp(data[0]); // most recent
            }
          })
          .catch(err => console.error('Error fetching verification status', err));
      }
    }
  }, [user]);

  const handleDocUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('File size exceeds 2.5MB. Please upload a compressed photo or document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setVerifyForm(prev => ({ ...prev, [field]: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (!verifyForm.nic_front_url || !verifyForm.utility_bill_url || !verifyForm.payment_slip_url) {
      alert('Please upload your NIC, Utility Bill, and Bank Transfer Slip.');
      return;
    }

    setVerifySubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/verifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(verifyForm)
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationApp(data);
        setShowVerifyModal(false);
        alert('Verification application and payment slip submitted successfully! Admin will review within 24-48 hours.');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while submitting verification application.');
    } finally {
      setVerifySubmitting(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setMapPosition(null);
    setRentAmount('');
    setDistance('');
    setPhotosText('');
    setBase64Photos([]);
    setPhotoInputType('upload');
    setShowForm(true);
  };

  const openEditForm = (acc) => {
    setEditingId(acc.id);
    setTitle(acc.title);
    setDescription(acc.description || '');
    setLocation(acc.location || '');
    setMapPosition(null); // Reset map pin on edit unless we saved coordinates (which we don't yet)
    setRentAmount(acc.rent_amount);
    setDistance(acc.distance_to_uni);
    
    const existingPhotos = acc.photos || [];
    const regularUrls = existingPhotos.filter(p => p.startsWith('http') || p.startsWith('/'));
    const b64Data = existingPhotos.filter(p => p.startsWith('data:'));
    
    setPhotosText(regularUrls.join(', '));
    setBase64Photos(b64Data);
    
    // Automatically select input type based on existing data
    if (b64Data.length > 0) setPhotoInputType('upload');
    else if (regularUrls.length > 0) setPhotoInputType('url');
    else setPhotoInputType('upload');
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 1024; // Max width or height

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.7 quality to reduce payload size
            resolve(canvas.toDataURL('image/jpeg', 0.7)); 
          };
          img.onerror = reject;
          img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })).then(base64Strings => {
      setBase64Photos(prev => [...prev, ...base64Strings]);
    }).catch(err => {
      console.error("Error reading files", err);
      alert("Failed to process one or more images.");
    });
  };

  const removeBase64Photo = (indexToRemove) => {
    setBase64Photos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

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
        
        // Reverse Geocoding
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

  const saveListing = async (e) => {
    e.preventDefault();
    
    // Parse photos based on selected type
    let finalPhotos = [];
    if (photoInputType === 'url') {
      finalPhotos = photosText
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    } else {
      finalPhotos = [...base64Photos];
    }

    const payload = {
      landlord_id: user.id,
      title,
      description,
      location,
      rent_amount: rentAmount,
      distance_to_uni: distance,
      photos: finalPhotos,
      facilities: { internet: true, water: true }
    };

    try {
      setIsSaving(true);
      if (editingId) {
        // Edit existing listing
        const res = await fetch('/api/accommodations', {
          method: 'PUT',
          body: JSON.stringify({ ...payload, id: editingId })
        });
        if (res.ok) {
          const updatedAcc = await res.json();
          setAccommodations(accommodations.map(a => a.id === editingId ? updatedAcc : a));
          setShowForm(false);
        }
      } else {
        // Add new listing
        const res = await fetch('/api/accommodations', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const newAcc = await res.json();
          setAccommodations([newAcc, ...accommodations]);
          setShowForm(false);
        } else if (res.status === 403) {
          const errorData = await res.json();
          alert(errorData.error || 'Limit reached');
        } else {
          alert('Failed to save listing');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/accommodations', {
        method: 'DELETE',
        body: JSON.stringify({ id, landlord_id: user.id })
      });
      if (res.ok) {
        setAccommodations(accommodations.filter(a => a.id !== id));
      } else {
        alert('Failed to delete listing');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error occurred while deleting listing');
    }
  };

  const boostListing = async (id) => {
    if (!window.confirm('Simulate payment of LKR 299 to boost this ad for 7 days?')) return;
    
    try {
      const res = await fetch('/api/accommodations', {
        method: 'PATCH',
        body: JSON.stringify({ id, action: 'boost' })
      });
      if (res.ok) {
        const updatedAcc = await res.json();
        setAccommodations(accommodations.map(a => a.id === id ? updatedAcc : a));
        alert('Boost successful! Your ad is now prioritized for 7 days.');
      } else {
        alert('Failed to boost listing');
      }
    } catch (err) {
      console.error('Boost error:', err);
      alert('Error occurred while boosting listing');
    }
  };

  if (user?.role !== 'landlord') {
    return <div className="p-8 text-center text-slate-800 dark:text-slate-200">Please switch to Landlord mode to view the dashboard.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          Landlord Dashboard
          {user?.subscription_tier === 'pro' && (
            <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400 px-2 py-1 rounded-full font-bold uppercase tracking-wide border border-brand-200 dark:border-brand-800">
              Verified Pro
            </span>
          )}
        </h1>
        <div className="flex flex-wrap gap-3 items-center">
          {user?.is_verified_landlord ? (
            <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Document Verified Landlord
            </div>
          ) : verificationApp?.status === 'pending' ? (
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-sm">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Verification Under Review
            </div>
          ) : (
            <button 
              onClick={() => setShowVerifyModal(true)} 
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Get Document Verified (LKR 1,490)</span>
            </button>
          )}

          <button onClick={showForm ? () => setShowForm(false) : openAddForm} className="btn-primary flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> {showForm ? 'Cancel' : 'Add Listing'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveListing} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
            {editingId ? 'Edit Accommodation' : 'Add New Accommodation'}
          </h2>
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" required className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea required className="input-field min-h-[100px]" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Location</label>
                <button 
                  type="button" 
                  onClick={getLocationFromDevice}
                  disabled={gettingLocation}
                  className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
                >
                  {gettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  Use My Location
                </button>
              </div>
              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                Click on the map or use your device location to automatically get the address.
              </div>
              <div className="h-[250px] mb-3 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 z-10 relative">
                <MapContainer 
                  center={[6.9271, 79.8612]} // Default to Colombo
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater position={mapPosition} />
                  <MapLocationPicker position={mapPosition} setPosition={setMapPosition} setLocation={setLocation} />
                </MapContainer>
              </div>
              <div className="relative mt-3" ref={wrapperRef}>
                <input 
                  type="text" 
                  placeholder="e.g. Colombo 07" 
                  required 
                  className="input-field" 
                  value={location} 
                  onChange={handleLocationChange}
                  onFocus={() => setShowSuggestions(true)}
                />
                
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

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Rent Amount (LKR)</label>
                <input type="number" required className="input-field" value={rentAmount} onChange={e => setRentAmount(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Distance to Uni (km)</label>
                <input type="number" required step="0.1" className="input-field" value={distance} onChange={e => setDistance(e.target.value)} />
              </div>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <label className="block text-sm font-bold mb-3 text-slate-900 dark:text-white">Photos</label>
              
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="photoType" 
                    value="upload" 
                    checked={photoInputType === 'upload'} 
                    onChange={() => setPhotoInputType('upload')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Files</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="photoType" 
                    value="url" 
                    checked={photoInputType === 'url'} 
                    onChange={() => setPhotoInputType('url')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo URLs</span>
                </label>
              </div>

              {photoInputType === 'upload' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select Images (Max 5MB per image recommended)</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/30 dark:file:text-brand-400 dark:hover:file:bg-brand-900/50"
                  />
                  {base64Photos.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {base64Photos.map((b64, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={b64} alt="Upload preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeBase64Photo(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Paste Photo URLs (comma-separated)</label>
                  <textarea 
                    className="input-field min-h-[60px]" 
                    placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                    value={photosText} 
                    onChange={e => setPhotosText(e.target.value)} 
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isSaving} className="btn-primary w-full flex items-center justify-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                  </>
                ) : (
                  editingId ? 'Update Listing' : 'Save Listing'
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Your Properties</h2>
      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      ) : accommodations.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">You haven't listed any properties yet.</p>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Title</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Rent</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Status</th>
                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {accommodations.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{acc.title}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">LKR {acc.rent_amount}</td>
                  <td className="p-4">
                    {acc.is_verified ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium border border-transparent dark:border-green-800/50">Verified</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium border border-transparent dark:border-yellow-800/50">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-3">
                      {!acc.is_boosted && (
                        <button onClick={() => boostListing(acc.id)} className="text-amber-500 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                          Boost
                        </button>
                      )}
                      <button onClick={() => openEditForm(acc)} className="text-brand-600 dark:text-brand-400 font-medium hover:underline cursor-pointer">Edit</button>
                      <button onClick={() => deleteListing(acc.id)} className="text-red-600 dark:text-red-400 font-medium hover:underline cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Landlord Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8 border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-900/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white">Apply for Document Verification</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Earn the trusted "Document & Landlord Verified" badge across all your listings.
                </p>
              </div>
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={submitVerification} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Fee Notice */}
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-200">Verification Fee</span>
                  <span className="text-lg font-extrabold text-blue-700 dark:text-blue-400">LKR 1,490 <span className="text-xs font-normal text-slate-500">/ one-time</span></span>
                </div>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  Includes document authenticity validation, university proximity check, and unlocks the verified shield badge for 1 year.
                </p>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name as per NIC *</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field text-sm" 
                    value={verifyForm.full_name} 
                    onChange={e => setVerifyForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">National Identity Card (NIC) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 198512345678 or 851234567V"
                    className="input-field text-sm" 
                    value={verifyForm.nic_number} 
                    onChange={e => setVerifyForm(prev => ({ ...prev, nic_number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone *</label>
                  <input 
                    type="tel" 
                    required 
                    className="input-field text-sm" 
                    value={verifyForm.phone_number} 
                    onChange={e => setVerifyForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Number *</label>
                  <input 
                    type="tel" 
                    required 
                    className="input-field text-sm" 
                    value={verifyForm.whatsapp_number} 
                    onChange={e => setVerifyForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  />
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Required Verification Documents</h4>

                {/* 1. NIC Front */}
                <div className="p-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">1. NIC Copy (Front) *</span>
                    {verifyForm.nic_front_url && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded</span>}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    required 
                    onChange={e => handleDocUpload(e, 'nic_front_url')}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/40 dark:file:text-blue-300"
                  />
                </div>

                {/* 2. Utility Bill */}
                <div className="p-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">2. Proof of Address (Electricity or Water Bill) *</span>
                    {verifyForm.utility_bill_url && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Must show property address and landlord/owner name within last 3 months.</p>
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    required 
                    onChange={e => handleDocUpload(e, 'utility_bill_url')}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/40 dark:file:text-blue-300"
                  />
                </div>

                {/* 3. Bank Transfer Slip */}
                <div className="p-3 border border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">3. Bank Transfer / Deposit Slip (LKR 1,490) *</span>
                    {verifyForm.payment_slip_url && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded</span>}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="font-medium text-slate-800 dark:text-slate-200">Bank Details for Transfer:</p>
                    <p>Bank: <span className="font-semibold">Bank of Ceylon (BOC)</span> | Account: <span className="font-semibold">8492019482</span></p>
                    <p>Account Name: <span className="font-semibold">UniStay Student Services Pvt Ltd</span></p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    required 
                    onChange={e => handleDocUpload(e, 'payment_slip_url')}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/40 dark:file:text-blue-300"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={verifySubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifySubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Verification Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

