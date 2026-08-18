import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, Send, UserCircle2 } from 'lucide-react';

export default function Inbox() {
  const { user, token } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    
    fetch('/api/inquiries', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInquiries(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (selectedInquiry && token) {
      fetch(`/api/inquiries?id=${selectedInquiry.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setMessages(data.messages);
          }
        });
    }
  }, [selectedInquiry, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedInquiry) return;
    setSending(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiry_id: selectedInquiry.id,
          content: replyText
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setReplyText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col ${selectedInquiry ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {inquiries.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No messages yet.
              </div>
            ) : (
              inquiries.map(inq => (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquiry(inq)}
                  className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedInquiry?.id === inq.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{inq.other_party_name}</div>
                  <div className="text-sm text-brand-600 dark:text-brand-400 truncate mb-1">{inq.accommodation_title}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{inq.message}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 dark:bg-slate-900/50 ${!selectedInquiry ? 'hidden md:flex' : 'flex'}`}>
          {selectedInquiry ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <button className="md:hidden text-slate-500 mr-2" onClick={() => setSelectedInquiry(null)}>
                  &larr; Back
                </button>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{selectedInquiry.other_party_name}</h3>
                  <p className="text-sm text-brand-600 dark:text-brand-400">{selectedInquiry.accommodation_title}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <form onSubmit={sendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field flex-1 mb-0"
                    disabled={sending}
                  />
                  <button 
                    type="submit" 
                    disabled={!replyText.trim() || sending}
                    className="bg-brand-600 text-white p-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              Select a conversation to start messaging
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
