import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle2, Loader2, Save, Mail, ShieldCheck, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState(user?.contact_number || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsapp_number || '');
  const [sameAsPhone, setSameAsPhone] = useState(
    Boolean(user?.contact_number && user?.whatsapp_number && user.contact_number === user.whatsapp_number)
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Synchronize when user data loads or updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setContactNumber(user.contact_number || '');
      setWhatsappNumber(user.whatsapp_number || '');
      if (user.contact_number && user.whatsapp_number && user.contact_number === user.whatsapp_number) {
        setSameAsPhone(true);
      }
    }
  }, [user]);

  // If somehow a non-logged-in user gets here
  if (!user) {
    navigate('/login');
    return null;
  }

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setContactNumber(val);
    if (sameAsPhone) {
      setWhatsappNumber(val);
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setSameAsPhone(checked);
    if (checked) {
      setWhatsappNumber(contactNumber);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (name.trim() === '') {
      setMessage({ type: 'error', text: 'Name cannot be empty' });
      return;
    }

    if (user.role === 'landlord' && !contactNumber.trim()) {
      setMessage({ type: 'error', text: 'Phone number is mandatory for landlords.' });
      return;
    }

    const finalWhatsapp = sameAsPhone ? contactNumber : whatsappNumber;

    if (user.role === 'landlord' && !finalWhatsapp.trim()) {
      setMessage({ type: 'error', text: 'WhatsApp number is mandatory for landlords.' });
      return;
    }

    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setMessage({ type: 'error', text: 'Please fill in all password fields to change your password.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
        return;
      }
    }

    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });
      await updateProfile({ 
        id: user.id, 
        name, 
        contact_number: contactNumber,
        whatsapp_number: finalWhatsapp,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
              
              <div className="max-w-md space-y-6 mb-8">
                {/* Name (Editable) */}
                <div>
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

                {/* Contact Phone Number (Editable) */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>Phone Number</span>
                    </span>
                    {user.role === 'landlord' && (
                      <span className="text-xs font-semibold text-red-500">Mandatory for Landlords</span>
                    )}
                  </label>
                  <input 
                    type="tel" 
                    value={contactNumber}
                    onChange={handlePhoneChange}
                    placeholder="+94 77 123 4567"
                    required={user.role === 'landlord'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none transition-all"
                  />
                </div>

                {/* WhatsApp Number (Editable with Same as Phone toggle) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span>WhatsApp Number</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={sameAsPhone}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-brand-600 bg-slate-100 border-slate-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:bg-slate-700 dark:border-slate-600"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Same as Phone</span>
                    </label>
                  </div>

                  {!sameAsPhone && (
                    <div>
                      <input 
                        type="tel" 
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+94 71 987 6543"
                        required={user.role === 'landlord'}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none transition-all text-sm"
                      />
                    </div>
                  )}

                  {sameAsPhone && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Using <span className="font-semibold text-slate-700 dark:text-slate-300">{contactNumber || 'phone number'}</span> as WhatsApp contact for boarding inquiries.
                    </p>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Change Password</h3>
              
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Current Password
                  </label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none transition-all"
                  />
                </div>
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
