import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, ShieldCheck, Loader2, Star } from 'lucide-react';

export default function AccommodationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [acc, setAcc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    fetch(`/api/accommodations?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setAcc(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'student') return alert('Only students can leave reviews');
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          accommodation_id: id,
          student_id: user.id,
          rating,
          comment: reviewText
        })
      });
      if (res.ok) {
        const newReview = await res.json();
        // Optimistically add the review to UI
        setAcc({
          ...acc,
          reviews: [...(acc.reviews || []), { ...newReview, student_name: user.name }]
        });
        setReviewText('');
        setRating(5);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!acc || acc.error) {
    return <div className="text-center py-20 text-slate-500">Accommodation not found.</div>;
  }

  const photos = acc.photos && acc.photos.length > 0 ? acc.photos : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{acc.title}</h1>
          <div className="flex items-center text-slate-600 gap-4">
            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-slate-400" /> {acc.distance_to_uni} km to campus</span>
            {acc.is_verified && <span className="flex items-center text-brand-600 font-medium"><ShieldCheck className="w-4 h-4 mr-1" /> Verified</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold text-brand-600">${acc.rent_amount}</div>
          <div className="text-slate-500 text-sm">per month</div>
        </div>
      </div>

      {/* Main Image */}
      <div className="rounded-2xl overflow-hidden h-[400px] mb-8 shadow-sm">
        <img src={photos[0]} alt={acc.title} className="w-full h-full object-cover" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Details */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-xl font-bold mb-4 text-slate-900">About this place</h2>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed mb-6">
              {acc.description}
            </p>
            
            <h3 className="font-semibold text-slate-900 mb-3">Facilities</h3>
            <div className="flex flex-wrap gap-3">
              {acc.facilities && Object.entries(acc.facilities).map(([key, value]) => {
                if (value) {
                  return (
                    <span key={key} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm capitalize border border-slate-200">
                      {key}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </section>

          {/* Reviews */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-6 text-slate-900">Student Reviews</h2>
            
            <div className="space-y-6 mb-8">
              {acc.reviews && acc.reviews.length > 0 ? (
                acc.reviews.map((r, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold mr-3">
                        {r.student_name ? r.student_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{r.student_name || 'Student'}</div>
                        <div className="flex text-amber-400 text-sm">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 pl-13">{r.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No reviews yet. Be the first to leave one!</p>
              )}
            </div>

            {user?.role === 'student' && (
              <form onSubmit={submitReview} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium mb-3">Leave a Review</h4>
                <div className="mb-3">
                  <label className="block text-sm mb-1 text-slate-600">Rating (1-5)</label>
                  <input type="number" min="1" max="5" value={rating} onChange={e => setRating(e.target.value)} className="input-field w-24" />
                </div>
                <div className="mb-3">
                  <textarea 
                    className="input-field min-h-[100px]" 
                    placeholder="Share your experience..." 
                    value={reviewText} 
                    onChange={e => setReviewText(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">Submit Review</button>
              </form>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-bold text-lg mb-4 text-slate-900">Interested?</h3>
            <p className="text-slate-600 text-sm mb-6">Contact the landlord to ask questions or arrange a viewing.</p>
            {user?.role === 'student' ? (
              <button className="w-full btn-primary py-3">Message Landlord</button>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-800 rounded text-sm text-center">
                Log in as a student to send inquiries.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
