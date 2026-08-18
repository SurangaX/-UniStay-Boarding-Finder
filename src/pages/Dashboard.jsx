import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Listing Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [distance, setDistance] = useState('');

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

  const addListing = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accommodations', {
        method: 'POST',
        body: JSON.stringify({
          landlord_id: user.id,
          title,
          description,
          rent_amount: rentAmount,
          distance_to_uni: distance,
          photos: [], // Simplify for now
          facilities: { internet: true, water: true }
        })
      });
      if (res.ok) {
        const newAcc = await res.json();
        setAccommodations([newAcc, ...accommodations]);
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (user?.role !== 'landlord') {
    return <div className="p-8 text-center">Please switch to Landlord mode to view the dashboard.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Landlord Dashboard</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> Add Listing
        </button>
      </div>

      {showForm && (
        <form onSubmit={addListing} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Add New Accommodation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" required className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea required className="input-field" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Rent Amount ($)</label>
                <input type="number" required className="input-field" value={rentAmount} onChange={e => setRentAmount(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Distance to Uni (km)</label>
                <input type="number" required step="0.1" className="input-field" value={distance} onChange={e => setDistance(e.target.value)} />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" className="btn-primary w-full">Save Listing</button>
            </div>
          </div>
        </form>
      )}

      <h2 className="text-xl font-bold mb-4 text-slate-800">Your Properties</h2>
      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      ) : accommodations.length === 0 ? (
        <p className="text-slate-500">You haven't listed any properties yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-slate-600">Title</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Rent</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Status</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accommodations.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{acc.title}</td>
                  <td className="p-4 text-slate-600">${acc.rent_amount}</td>
                  <td className="p-4">
                    {acc.is_verified ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Verified</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-brand-600 font-medium text-sm hover:underline cursor-pointer">Edit</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
