import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle2, Loader2, Save, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // If somehow a non-logged-in user gets here
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (name.trim() === '') {
      setMessage({ type: 'error', text: 'Name cannot be empty' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });
      await updateProfile({ id: user.id, name });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Header Profile Section */}
        <div className="bg-brand-600 dark:bg-slate-900 p-8 text-center sm:text-left sm:flex items-center gap-6">
          <div className="inline-block p-4 bg-white/20 rounded-full mb-4 sm:mb-0">
            <UserCircle2 className="w-20 h-20 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-brand-100 dark:text-slate-300">Manage your personal information and account settings.</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="p-8">
          {message.text && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50' 
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50'
            }`}>
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Email (Read Only) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-slate-500">Email cannot be changed.</p>
              </div>

              {/* Role (Read Only) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Account Type
                </label>
                <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  {user.role}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Personal Details</h3>
              
              {/* Name (Editable) */}
              <div className="max-w-md">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
