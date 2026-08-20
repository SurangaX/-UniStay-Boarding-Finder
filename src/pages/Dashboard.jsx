import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

  useEffect(() => {
    if (user?.role === 'landlord') {
      fetch(`/api/accommodations?landlord_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setAccommodations(data);
          setLoading(false);
        });
    }
  }, [user]);

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

  if (user?.role !== 'landlord') {
    return <div className="p-8 text-center text-slate-800 dark:text-slate-200">Please switch to Landlord mode to view the dashboard.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Landlord Dashboard</h1>
        <button onClick={showForm ? () => setShowForm(false) : openAddForm} className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> {showForm ? 'Cancel' : 'Add Listing'}
        </button>
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
                  <MapLocationPicker position={mapPosition} setPosition={setMapPosition} setLocation={setLocation} />
                </MapContainer>
              </div>
              <input type="text" placeholder="e.g. Colombo 07" required className="input-field" value={location} onChange={e => setLocation(e.target.value)} />
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
    </div>
  );
}
