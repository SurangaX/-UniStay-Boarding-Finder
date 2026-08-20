import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingAds();
    }
  }, [user]);

  const fetchPendingAds = async () => {
    try {
      const res = await fetch('/api/accommodations?admin=true');
      const data = await res.json();
      setPendingAds(data);
    } catch (err) {
      console.error('Failed to fetch pending ads', err);
    } finally {
      setLoading(false);
    }
  };

  const approveAd = async (id) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/accommodations', {
        method: 'PATCH',
        body: JSON.stringify({ id, is_verified: true })
      });
      if (res.ok) {
        setPendingAds(pendingAds.filter(ad => ad.id !== id));
      } else {
        alert('Failed to approve ad');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while approving ad');
    } finally {
      setProcessingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pending Accommodations</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review and approve new listings before they go public.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : pendingAds.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">There are no pending ads to approve right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Title</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Location</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Rent</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Date Submitted</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pendingAds.map(ad => (
                  <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{ad.title}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{ad.location || '-'}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">LKR {ad.rent_amount}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => approveAd(ad.id)} 
                        disabled={processingId === ad.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ml-auto"
                      >
                        {processingId === ad.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                        ) : (
                          'Approve'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
