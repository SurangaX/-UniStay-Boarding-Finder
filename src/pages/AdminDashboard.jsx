import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Loader2, CheckCircle, FileText, CheckCircle2, XCircle, ExternalLink, Eye, AlertCircle, Flame } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [boosts, setBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'verifications', or 'boosts'
  const [selectedDoc, setSelectedDoc] = useState(null); // Document preview modal

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'verifications') {
        fetchVerifications();
      } else if (activeTab === 'boosts') {
        fetchBoosts();
      } else {
        fetchAds();
      }
    }
  }, [user, activeTab]);

  const fetchBoosts = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/boosts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBoosts(data);
    } catch (err) {
      console.error('Failed to fetch boosts', err);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchVerifications = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/verifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVerifications(data);
    } catch (err) {
      console.error('Failed to fetch verifications', err);
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

  const updateVerificationStatus = async (id, status) => {
    const actionLabel = status === 'approved' ? 'Approve & Verify' : 'Reject';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this landlord verification?`)) return;

    setProcessingId(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/verifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        const updated = await res.json();
        setVerifications(prev => prev.map(v => v.id === id ? updated : v));
        alert(`Verification application successfully marked as ${status}!`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update verification status');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while updating verification');
    } finally {
      setProcessingId(null);
    }
  };

  const updateBoostStatus = async (id, status) => {
    const actionLabel = status === 'approved' ? 'Approve & Activate Boost' : 'Reject';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this boost request?`)) return;

    setProcessingId(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/boosts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        const updated = await res.json();
        setBoosts(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
        alert(`Boost request successfully marked as ${status}!`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update boost status');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while updating boost');
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
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 flex flex-wrap">
          <button 
            className={`flex-1 min-w-[150px] py-4 text-center font-medium transition-colors ${activeTab === 'pending' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Listing Approvals
          </button>
          <button 
            className={`flex-1 min-w-[150px] py-4 text-center font-medium transition-colors ${activeTab === 'active' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Listings
          </button>
          <button 
            className={`flex-1 min-w-[180px] py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'verifications' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('verifications')}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Landlord Verifications</span>
            {verifications.filter(v => v.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">
                {verifications.filter(v => v.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            className={`flex-1 min-w-[160px] py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'boosts' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('boosts')}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Boost Requests</span>
            {boosts.filter(b => b.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">
                {boosts.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : activeTab === 'verifications' ? (
          /* Landlord Verification Applications Tab */
          verifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-lg font-medium">No verification requests found</p>
              <p className="text-sm">Landlords will appear here when they upload their NIC, utility bill, and payment slip.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Landlord Details</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">NIC & Contacts</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Submitted Documents</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Payment Status</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Review Status</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {verifications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{app.full_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{app.landlord_email || app.account_name}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Submitted: {new Date(app.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-700 dark:text-slate-300">
                        <div className="font-semibold text-slate-900 dark:text-white">NIC: {app.nic_number}</div>
                        <div className="mt-0.5">Phone: {app.phone_number}</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium">WhatsApp: {app.whatsapp_number || app.phone_number}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 text-xs">
                          {app.nic_front_url && (
                            <button 
                              onClick={() => setSelectedDoc({ title: `${app.full_name} - NIC Front`, url: app.nic_front_url })}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium hover:underline text-left"
                            >
                              <Eye className="w-3.5 h-3.5" /> View NIC Front
                            </button>
                          )}
                          {app.utility_bill_url && (
                            <button 
                              onClick={() => setSelectedDoc({ title: `${app.full_name} - Utility Bill (Proof of Address)`, url: app.utility_bill_url })}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium hover:underline text-left"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Utility Bill
                            </button>
                          )}
                          {app.payment_slip_url && (
                            <button 
                              onClick={() => setSelectedDoc({ title: `${app.full_name} - Bank Deposit / Transfer Slip`, url: app.payment_slip_url })}
                              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 font-bold hover:underline text-left"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Payment Slip
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">LKR {app.package_amount || '1,490'}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold rounded-md border border-emerald-200 dark:border-emerald-800">
                          Bank Transfer
                        </span>
                      </td>
                      <td className="p-4">
                        {app.status === 'approved' ? (
                          <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Verified
                          </span>
                        ) : app.status === 'rejected' ? (
                          <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-bold flex items-center gap-1 w-fit">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-bold flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {app.status !== 'approved' && (
                            <button 
                              onClick={() => updateVerificationStatus(app.id, 'approved')}
                              disabled={processingId === app.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Approve
                            </button>
                          )}
                          {app.status !== 'rejected' && (
                            <button 
                              onClick={() => updateVerificationStatus(app.id, 'rejected')}
                              disabled={processingId === app.id}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'boosts' ? (
          /* Boost Requests Tab */
          boosts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-lg font-medium">No boost requests right now</p>
              <p className="text-sm">Landlord ad boost applications with deposit slips will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Accommodation</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Landlord Details</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Package & Days</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Payment Proof</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Status</th>
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {boosts.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        <Link to={`/accommodation/${b.accommodation_id}`} className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
                          {b.accommodation_title}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">Applied: {new Date(b.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-700 dark:text-slate-300">
                        <div className="font-bold text-slate-900 dark:text-white">{b.landlord_name}</div>
                        <div>{b.landlord_phone || b.landlord_email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{b.package_name}</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">LKR {b.package_amount} • {b.boost_days} Days</div>
                      </td>
                      <td className="p-4">
                        {b.payment_slip_url && (
                          <button 
                            onClick={() => setSelectedDoc({ title: `Boost Slip - ${b.accommodation_title}`, url: b.payment_slip_url })}
                            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 font-bold text-xs hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Deposit Slip
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        {b.status === 'approved' ? (
                          <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active Boost
                          </span>
                        ) : b.status === 'rejected' ? (
                          <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-bold flex items-center gap-1 w-fit">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-bold flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {b.status !== 'approved' && (
                            <button 
                              onClick={() => updateBoostStatus(b.id, 'approved')}
                              disabled={processingId === b.id}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5" />}
                              Approve
                            </button>
                          )}
                          {b.status !== 'rejected' && (
                            <button 
                              onClick={() => updateBoostStatus(b.id, 'rejected')}
                              disabled={processingId === b.id}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Listing Approvals Tab */
          ads.length === 0 ? (
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
                    <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Landlord Verified?</th>
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
                      <td className="p-4">
                        {ad.landlord_verified ? (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Landlord
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Standard</span>
                        )}
                      </td>
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
          )
        )}
      </div>

      {/* Document & Slip Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedDoc.title}</h3>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-900">
              {selectedDoc.url.startsWith('data:image') || selectedDoc.url.startsWith('http') ? (
                <img src={selectedDoc.url} alt={selectedDoc.title} className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm" />
              ) : (
                <div className="text-center p-8">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Embedded preview unavailable for this document format.</p>
                  <a 
                    href={selectedDoc.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-primary inline-flex items-center gap-2 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Document
                  </a>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-right bg-slate-50 dark:bg-slate-900/50">
              <button 
                onClick={() => setSelectedDoc(null)} 
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

