import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, ShieldCheck, Loader2, Star } from 'lucide-react';

export default function AccommodationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [acc, setAcc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/accommodations?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setAcc(data);
        setLoading(false);
        
        if (!data.error) {
          try {
            const viewedStr = localStorage.getItem('recently_viewed');
            let viewed = viewedStr ? JSON.parse(viewedStr) : [];
            viewed = viewed.filter(v => v.id !== data.id);
            viewed.unshift({
              id: data.id,
              title: data.title,
              rent_amount: data.rent_amount,
              distance_to_uni: data.distance_to_uni,
              photos: data.photos,
              is_verified: data.is_verified
            });
            if (viewed.length > 4) viewed.pop();
            localStorage.setItem('recently_viewed', JSON.stringify(viewed));
          } catch (e) {
            console.error('Error saving recently viewed:', e);
          }
        }
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

  const submitMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSendingMsg(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          accommodation_id: id,
          message: messageText
        })
      });

      if (res.ok) {
        navigate('/inbox');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to send message');
        setSendingMsg(false);
      }
    } catch (err) {
      console.error(err);
      setSendingMsg(false);
    }
  };

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // If photos array changes or component re-renders with new acc, ensure selectedPhoto is valid
  useEffect(() => {
    if (acc && !acc.error) {
      const photos = acc.photos && acc.photos.length > 0 ? acc.photos : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000'];
      if (!photos.includes(selectedPhoto)) {
        setSelectedPhoto(photos[0]);
      }
    }
  }, [acc, selectedPhoto]);

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{acc.title}</h1>
          <div className="flex items-center text-slate-600 dark:text-slate-400 gap-4 mb-2">
            {acc.location && <span className="flex items-center font-medium"><MapPin className="w-4 h-4 mr-1 text-brand-500" /> {acc.location}</span>}
          </div>
          <div className="flex items-center text-slate-600 dark:text-slate-400 gap-4">
            <span className="flex items-center text-sm"> {acc.distance_to_uni} km to campus</span>
            {acc.is_verified && <span className="flex items-center text-brand-600 dark:text-brand-400 font-medium text-sm"><ShieldCheck className="w-4 h-4 mr-1" /> Verified</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">LKR {acc.rent_amount}</div>
          <div className="text-slate-500 dark:text-slate-400 text-sm">per month</div>
        </div>
      </div>

      {/* Main Image Gallery */}
      <div className="mb-8">
        <div className="rounded-2xl overflow-hidden h-[400px] shadow-sm mb-3">
          <img src={selectedPhoto} alt={acc.title} className="w-full h-full object-cover transition-opacity duration-300" />
        </div>
        {photos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {photos.map((photo, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedPhoto(photo)}
                className={`relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedPhoto === photo ? 'border-brand-500 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={photo} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Details */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">About this place</h2>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-6">
              {acc.description}
            </p>
            
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Facilities</h3>
            <div className="flex flex-wrap gap-3">
              {acc.facilities && Object.entries(acc.facilities).map(([key, value]) => {
                if (value) {
                  return (
                    <span key={key} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm capitalize border border-slate-200 dark:border-slate-600">
                      {key}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </section>

          {/* Reviews */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Student Reviews</h2>
            
            <div className="space-y-6 mb-8">
              {acc.reviews && acc.reviews.length > 0 ? (
                acc.reviews.map((r, idx) => (
                  <div key={idx} className="border-b border-slate-100 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-full flex items-center justify-center font-bold mr-3">
                        {r.student_name ? r.student_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{r.student_name || 'Student'}</div>
                        <div className="flex text-amber-400 text-sm">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 pl-13">{r.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No reviews yet. Be the first to leave one!</p>
              )}
            </div>

            {user?.role === 'student' && (
              <form onSubmit={submitReview} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-medium mb-3 dark:text-white">Leave a Review</h4>
                <div className="mb-3">
                  <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Rating (1-5)</label>
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
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-6">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Interested?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">Contact the landlord to ask questions or arrange a viewing.</p>
            {user?.role === 'student' ? (
              <button onClick={() => setShowModal(true)} className="w-full btn-primary py-3">Message Landlord</button>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Log in as a student to send inquiries.</p>
                <div className="flex flex-col gap-3">
                  <Link to="/login" className="w-full btn-primary py-2.5 text-sm justify-center flex items-center">
                    Log In
                  </Link>
                  <Link to="/register" className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 py-2.5 rounded-lg text-sm font-bold transition-colors justify-center flex items-center">
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white">Message Landlord</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={submitMessage} className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Ask about {acc.title}. The landlord will reply in your Inbox.
              </p>
              <textarea 
                className="input-field min-h-[120px] mb-4" 
                placeholder="Hi, I'm interested in this room..." 
                value={messageText} 
                onChange={e => setMessageText(e.target.value)}
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={sendingMsg || !messageText.trim()} className="btn-primary flex items-center gap-2">
                  {sendingMsg && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
