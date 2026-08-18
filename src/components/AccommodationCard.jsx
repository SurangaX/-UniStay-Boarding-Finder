import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck } from 'lucide-react';

export default function AccommodationCard({ acc }) {
  const thumbnail = acc.photos && acc.photos.length > 0 
    ? acc.photos[0] 
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={thumbnail} 
          alt={acc.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {acc.is_verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-brand-600 shadow-sm">
            <BadgeCheck className="w-4 h-4" />
            Verified
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-slate-900 leading-tight line-clamp-1">{acc.title}</h3>
          <span className="font-bold text-brand-600 text-lg">${acc.rent_amount}<span className="text-sm font-normal text-slate-500">/mo</span></span>
        </div>
        
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <MapPin className="w-4 h-4 mr-1 text-slate-400" />
          {acc.distance_to_uni} km from campus
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {acc.facilities && Object.entries(acc.facilities).map(([key, value]) => {
            if (value) {
              return (
                <span key={key} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md capitalize">
                  {key}
                </span>
              );
            }
            return null;
          })}
        </div>
        
        <Link 
          to={`/accommodation/${acc.id}`}
          className="block w-full text-center py-2 bg-brand-50 text-brand-700 font-medium rounded-lg hover:bg-brand-100 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
