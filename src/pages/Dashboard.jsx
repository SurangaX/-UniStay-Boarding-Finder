import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listing Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [distance, setDistance] = useState('');
  const [photoInputType, setPhotoInputType] = useState('upload'); // 'upload' or 'url'
  const [photosText, setPhotosText] = useState('');
  const [base64Photos, setBase64Photos] = useState([]);

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
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })).then(base64Strings => {
      setBase64Photos(prev => [...prev, ...base64Strings]);
    }).catch(err => {
      console.error("Error reading files", err);
      alert("Failed to read one or more files.");
    });
  };

  const removeBase64Photo = (indexToRemove) => {
    setBase64Photos(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
              <label className="block text-sm font-medium mb-1">Location</label>
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
              <button type="submit" className="btn-primary w-full">
                {editingId ? 'Update Listing' : 'Save Listing'}
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
                  <td className="p-4 text-brand-600 dark:text-brand-400 font-medium text-sm">
                    <button onClick={() => openEditForm(acc)} className="hover:underline cursor-pointer">Edit</button>
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
