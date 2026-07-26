"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { 
  LifeBuoy, 
  Plus, 
  Loader2, 
  Send, 
  MessageCircle, 
  CheckCircle
} from "lucide-react";

interface Message {
  sender: "user" | "admin";
  message: string;
  createdAt: string;
  _id?: string;
}

interface Ticket {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  messages: Message[];
  updatedAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Chat message reply form
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tickets");
      if (res.success) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await api.get(`/tickets/${id}`);
      if (res.success) {
        setSelectedTicket(res.data);
      }
    } catch (err) {
      console.error("Error loading ticket detail:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !newMsg) return;

    setSubmittingTicket(true);
    try {
      const res = await api.post("/tickets", { subject, message: newMsg });
      if (res.success) {
        setSubject("");
        setNewMsg("");
        setShowCreateModal(false);
        await fetchTickets();
        setSelectedTicket(res.data);
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !selectedTicket) return;

    setSubmittingReply(true);
    try {
      const res = await api.post(`/tickets/${selectedTicket._id}/reply`, { message: replyText });
      if (res.success) {
        setReplyText("");
        setSelectedTicket(res.data);
        fetchTickets(); // Sync list update
      }
    } catch (err) {
      console.error("Error replying to ticket:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      resolved: "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
    };
    return badges[status as keyof typeof badges] || "bg-zinc-900 border border-zinc-800 text-zinc-400";
  };

  return (
    <div className="space-y-6 font-sans h-[calc(100vh-12rem)] flex flex-col text-zinc-300 relative">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-900 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Support Desk</h2>
          <p className="text-xs text-zinc-450 font-semibold mt-1">Get in touch with administrators to resolve platform questions or wallet issues.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#ef233c] hover:bg-red-700 text-white shadow-md transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} /> Open Ticket
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin text-[#ef233c]" size={32} />
        </div>
      ) : (
        <div className="flex-1 grid lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
          
          {/* Ticket Listing Column */}
          <div className="bg-zinc-950 rounded-3xl border border-zinc-900 shadow-sm flex flex-col overflow-hidden min-h-0">
            <div className="p-4 border-b border-zinc-900 font-extrabold text-xs text-zinc-500 uppercase tracking-wider font-manrope">Your Ticket List</div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-zinc-550 italic text-xs font-medium">No support requests created.</div>
              ) : (
                tickets.map((t) => {
                  const isSelected = selectedTicket?._id === t._id;
                  const lastMessage = t.messages[t.messages.length - 1];
                  return (
                    <div
                      key={t._id}
                      onClick={() => fetchTicketDetails(t._id)}
                      className={`p-4 cursor-pointer text-left transition-colors relative flex justify-between items-start gap-4 ${
                        isSelected ? "bg-zinc-900 border-r-4 border-[#ef233c]" : "hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="overflow-hidden space-y-1">
                        <h4 className="font-bold text-white text-xs truncate font-manrope">{t.subject}</h4>
                        <p className="text-[10px] text-zinc-500 font-semibold truncate leading-relaxed">
                          {lastMessage ? `${lastMessage.sender === "admin" ? "Admin" : "You"}: ${lastMessage.message}` : "No messages"}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase shrink-0 ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Ticket Chat Column */}
          <div className="lg:col-span-2 bg-zinc-950 rounded-3xl border border-zinc-900 shadow-sm flex flex-col overflow-hidden min-h-0">
            {selectedTicket ? (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Chat Title */}
                <div className="p-4 border-b border-zinc-900 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="font-black text-sm text-white truncate max-w-[250px] font-manrope">{selectedTicket.subject}</h3>
                    <p className="text-[10px] text-zinc-550 font-semibold mt-1">Ticket ID: #{selectedTicket._id.slice(-8)}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>

                {/* Message logs */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {selectedTicket.messages.map((m, idx) => {
                    const isAdmin = m.sender === "admin";
                    return (
                      <div key={idx} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                          isAdmin 
                            ? "bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-850" 
                            : "bg-[#ef233c] text-white rounded-tr-none shadow-md shadow-red-650/10"
                        }`}>
                          <p className="font-semibold">{m.message}</p>
                          <span className={`text-[8px] mt-1.5 block text-right font-medium ${isAdmin ? "text-zinc-550" : "text-white/60"}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-zinc-900 shrink-0">
                  {selectedTicket.status === "resolved" ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} /> This support ticket has been resolved and closed.
                    </div>
                  ) : (
                    <form onSubmit={handleReplySubmit} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Type your message reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-zinc-850 bg-zinc-900/50 text-white placeholder-zinc-650 rounded-xl focus:border-[#ef233c] focus:outline-none text-xs transition-all"
                      />
                      <button
                        type="submit"
                        disabled={submittingReply || !replyText}
                        className="p-3 bg-[#ef233c] hover:bg-red-700 disabled:bg-zinc-900 text-white disabled:text-zinc-550 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
                      >
                        {submittingReply ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-3">
                <MessageCircle className="text-zinc-800" size={48} />
                <p className="text-sm font-black text-zinc-500 font-manrope">No Support Ticket Selected</p>
                <p className="text-xs text-zinc-550 leading-relaxed max-w-xs">Select a support ticket from the list or open a new one to speak with the system administrators.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 rounded-3xl border border-zinc-900 shadow-2xl p-6 sm:p-8 max-w-md w-full relative text-white">
            <h3 className="font-extrabold text-lg text-white mb-6 flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
              <LifeBuoy className="text-[#ef233c]" /> Open Support Request
            </h3>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposit not showing, KYC query"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-850 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-650 focus:border-[#ef233c] focus:outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Detailed Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe your problem or question..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-855 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-650 focus:border-[#ef233c] focus:outline-none text-sm transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-zinc-850 rounded-xl hover:bg-zinc-900 text-zinc-350 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="flex-1 py-3 bg-[#ef233c] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingTicket ? <Loader2 className="animate-spin" size={14} /> : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
