import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, X, Footprints, MessageSquareQuote, MessageCircle, ShieldCheck } from 'lucide-react';

export default function AccommodationCard({ acc }) {
  const [showModal, setShowModal] = useState(false);

  const thumbnail = acc.photos && acc.photos.length > 0 
    ? acc.photos[0] 
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400';

  // Calculate approximate walking minutes (approx. 12 mins per 1km)
  const displayDist = acc.computed_distance !== undefined ? acc.computed_distance : (parseFloat(acc.distance_to_uni) || 0.8);
  const walkMinutes = Math.max(2, Math.round(displayDist * 12));

  // Determine utilities included
  const hasUtilities = acc.facilities && (acc.facilities.water || acc.facilities.electricity || acc.facilities.internet);

  // Landlord contact phone or WhatsApp
  const targetWhatsapp = acc.landlord_whatsapp || acc.whatsapp_number || acc.landlord_phone || acc.contact_number || '94771234567';
  const cleanPhone = targetWhatsapp.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('0') ? '94' + cleanPhone.slice(1) : (cleanPhone.startsWith('94') ? cleanPhone : '94' + cleanPhone);
  const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(`Hello, I found your boarding listing "${acc.title}" on UniStay and would like to arrange an inspection.`)}`;

  return (
    <>
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border ${acc.is_boosted ? 'border-amber-400 dark:border-amber-500 shadow-amber-100 dark:shadow-amber-900/20 shadow-md ring-1 ring-amber-400/50' : 'border-slate-200 dark:border-slate-700'} overflow-hidden hover:shadow-md transition-shadow group flex flex-col`}>
        <div 
          className="relative h-48 overflow-hidden cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <img 
            src={thumbnail} 
            alt={acc.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {acc.is_boosted && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-lg">
                🔥 Boosted
              </div>
            )}
            {acc.landlord_verified && (
              <span className="px-2.5 py-1 bg-blue-600/90 backdrop-blur-md text-white font-semibold rounded-full text-xs shadow-md flex items-center gap-1 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Landlord
              </span>
            )}
          </div>

          {/* Walking time chip on photo */}
          <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5 text-brand-400" />
            <span>~{walkMinutes} mins walk to gate</span>
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div 
            className="flex justify-between items-start mb-2 gap-2 cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white leading-tight line-clamp-1 flex-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{acc.title}</h3>
            <div className="text-right whitespace-nowrap shrink-0">
              <div className="font-bold text-brand-600 dark:text-brand-400 text-lg">LKR {acc.rent_amount}<span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mo</span></div>
              {hasUtilities && (
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">✓ Utilities Included</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-3 gap-2">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
              {displayDist} km from campus
            </span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Zero Broker Fee</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
            {acc.facilities && Object.entries(acc.facilities).map(([key, value]) => {
              if (value) {
                return (
                  <span key={key} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md capitalize border border-transparent dark:border-slate-600">
                    {key}
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <Link 
              to={`/accommodation/${acc.id}`}
              className="flex-1 text-center py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs"
            >
              Details
            </Link>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-xs flex items-center justify-center gap-1 shadow-sm"
              title="Direct Landlord WhatsApp Chat"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="relative h-64 shrink-0">
              <img src={thumbnail} alt={acc.title} className="w-full h-full object-cover" />
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors group"
              >
                <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
              {acc.is_verified && (
                <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-800">
                  <BadgeCheck className="w-4 h-4 text-emerald-500" />
                  Admin Approved
                </div>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white leading-tight">{acc.title}</h3>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-brand-600 dark:text-brand-400 text-xl">LKR {acc.rent_amount}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">per month</div>
                  {hasUtilities && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">✓ Utilities Included</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 mb-6 flex-wrap">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-medium flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                  <span>{displayDist} km to campus</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-medium flex items-center">
                  <Footprints className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                  <span>~{walkMinutes} mins walk to gate</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800 text-xs font-semibold">
                  Zero Broker Commission
                </div>
              </div>
              
              {acc.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Description</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {acc.description}
                  </p>
                </div>
              )}
              
              {acc.facilities && Object.keys(acc.facilities).some(k => acc.facilities[k]) && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Amenities & Utilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(acc.facilities).map(([key, value]) => {
                      if (value) {
                        return (
                          <span key={key} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg capitalize">
                            {key}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                <Link 
                  to={`/accommodation/${acc.id}`}
                  className="flex-1 text-center py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm"
                >
                  Full Details & Reviews
                </Link>
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
