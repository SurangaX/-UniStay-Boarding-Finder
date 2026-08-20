import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAds();
    }
  }, [user, activeTab]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accommodations?admin=true&status=${activeTab}`);
      const data = await res.json();
      setAds(data);
    } catch (err) {
      console.error('Failed to fetch ads', err);
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
        setAds(ads.filter(ad => ad.id !== id));
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

  const deleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this accommodation? This cannot be undone.')) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/accommodations', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setAds(ads.filter(ad => ad.id !== id));
      } else {
        alert('Failed to delete ad');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while deleting ad');
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
        <div className="border-b border-slate-200 dark:border-slate-700 flex">
          <button 
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'pending' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approvals
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'active' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Ads
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : ads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">There are no {activeTab} ads right now.</p>
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
                {ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{ad.title}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{ad.location || '-'}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">LKR {ad.rent_amount}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          to={`/accommodation/${ad.id}`}
                          className="bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-400 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-brand-200 dark:border-brand-800"
                        >
                          View
                        </Link>
                        {activeTab === 'pending' && (
                          <button 
                            onClick={() => approveAd(ad.id)} 
                            disabled={processingId === ad.id}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                            {processingId === ad.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                            ) : (
                              'Approve'
                            )}
                          </button>
                        )}
                        <button 
                          onClick={() => deleteAd(ad.id)} 
                          disabled={processingId === ad.id}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {processingId === ad.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
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
