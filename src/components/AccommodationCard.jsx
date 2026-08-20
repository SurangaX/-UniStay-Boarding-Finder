import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, X } from 'lucide-react';

export default function AccommodationCard({ acc }) {
  const [showModal, setShowModal] = useState(false);

  const thumbnail = acc.photos && acc.photos.length > 0 
    ? acc.photos[0] 
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400';

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
        <div 
          className="relative h-48 overflow-hidden cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <img 
            src={thumbnail} 
            alt={acc.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {acc.is_verified && (
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 shadow-sm">
              <BadgeCheck className="w-4 h-4" />
              Verified
            </div>
          )}
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div 
            className="flex justify-between items-start mb-2 gap-2 cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white leading-tight line-clamp-1 flex-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{acc.title}</h3>
            <div className="font-bold text-brand-600 dark:text-brand-400 text-lg whitespace-nowrap shrink-0">LKR {acc.rent_amount}<span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mo</span></div>
          </div>
          
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
            <MapPin className="w-4 h-4 mr-1 text-slate-400 dark:text-slate-500" />
            {acc.distance_to_uni} km from campus
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4 flex-1">
            {acc.facilities && Object.entries(acc.facilities).map(([key, value]) => {
              if (value) {
                return (
                  <span key={key} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md capitalize border border-transparent dark:border-slate-600">
                    {key}
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <div className="flex gap-2 mt-auto">
            <button 
              onClick={() => setShowModal(true)}
              className="flex-1 text-center py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              Quick View
            </button>
            <Link 
              to={`/accommodation/${acc.id}`}
              className="flex-1 text-center py-2 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-medium rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors text-sm"
            >
              Full Details
            </Link>
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
                <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 shadow-sm">
                  <BadgeCheck className="w-4 h-4" />
                  Verified Listing
                </div>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white leading-tight">{acc.title}</h3>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-brand-600 dark:text-brand-400 text-xl">LKR {acc.rent_amount}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">per month</div>
                </div>
              </div>
              
              <div className="flex items-center text-slate-600 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <MapPin className="w-4 h-4 mr-2 text-brand-500" />
                <span className="font-medium">{acc.distance_to_uni} km</span> <span className="ml-1 text-slate-500">from campus</span>
              </div>
              
              {acc.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {acc.description}
                  </p>
                </div>
              )}
              
              {acc.facilities && Object.keys(acc.facilities).some(k => acc.facilities[k]) && (
                <div className="mb-8">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(acc.facilities).map(([key, value]) => {
                      if (value) {
                        return (
                          <span key={key} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg capitalize">
                            {key}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <Link 
                  to={`/accommodation/${acc.id}`}
                  className="block w-full text-center py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
                >
                  View Full Details & Contact Landlord
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
