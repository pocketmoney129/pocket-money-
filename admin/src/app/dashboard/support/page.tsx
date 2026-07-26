"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { LifeBuoy, Loader2, Send, MessageCircle, CheckCircle } from "lucide-react";

interface Message { sender: "user" | "admin"; message: string; createdAt: string; }
interface Ticket {
  _id: string; subject: string; status: "open" | "in_progress" | "resolved";
  messages: Message[]; updatedAt: string;
  user: { name: string; username: string; email: string };
}

const statusStyle: Record<string, string> = {
  open:        "text-blue-400 bg-blue-500/10 border-blue-500/20",
  in_progress: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  resolved:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async (status = statusFilter) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tickets?status=${status}`);
      if (res.success) setTickets(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await api.get(`/tickets/${id}`);
      if (res.success) setSelectedTicket(res.data);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchTickets(statusFilter); }, [statusFilter]);

  const handleReply = async (e: React.FormEvent, customStatus?: string) => {
    e.preventDefault();
    const textToSend = customStatus === "resolved"
      ? "This issue has been reviewed and resolved by the administrator. Closing ticket."
      : replyText;
    if (!textToSend || !selectedTicket) return;
    setSubmittingReply(true);
    try {
      const res = await api.post(`/tickets/${selectedTicket._id}/reply`, {
        message: textToSend, status: customStatus || "in_progress"
      });
      if (res.success) { setReplyText(""); setSelectedTicket(res.data); fetchTickets(statusFilter); }
    } catch { /* silent */ }
    finally { setSubmittingReply(false); }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <LifeBuoy size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Support Desk</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Respond to user tickets</p>
          </div>
        </div>
        <div className="flex gap-2 text-[10px] font-black">
          {["", "open", "in_progress", "resolved"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl border transition-all capitalize ${
                statusFilter === s ? "bg-[#ef233c] border-[#ef233c]/40 text-white" : "border-zinc-800 text-zinc-500 hover:text-white"
              }`}>{s.replace("_", " ") || "All"}</button>
          ))}
        </div>
      </div>

      {/* Panel */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin text-[#ef233c]" size={28} />
        </div>
      ) : (
        <div className="flex-1 grid lg:grid-cols-3 gap-4 overflow-hidden min-h-0">
          {/* Ticket list */}
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-600">
              Tickets ({tickets.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/50">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-600 font-semibold">No tickets found.</div>
              ) : tickets.map(t => {
                const isSelected = selectedTicket?._id === t._id;
                return (
                  <div key={t._id} onClick={() => fetchTicketDetails(t._id)}
                    className={`p-4 cursor-pointer flex justify-between items-start gap-3 transition-colors ${
                      isSelected ? "bg-[#ef233c]/5 border-r-2 border-[#ef233c]" : "hover:bg-zinc-900/40"
                    }`}>
                    <div className="overflow-hidden">
                      <h4 className="font-black text-white text-xs truncate">{t.subject}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{t.user?.name} (@{t.user?.username})</p>
                      <p className="text-[9px] text-zinc-700 mt-1">{new Date(t.updatedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase shrink-0 ${statusStyle[t.status] || ""}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          <div className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
            {selectedTicket ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-zinc-900 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="font-black text-sm text-white truncate max-w-[260px]">{selectedTicket.subject}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{selectedTicket.user?.name} · {selectedTicket.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== "resolved" && (
                      <button onClick={(e) => handleReply(e, "resolved")} disabled={submittingReply}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-bold transition-colors">
                        <CheckCircle size={11} /> Resolve
                      </button>
                    )}
                    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${statusStyle[selectedTicket.status]}`}>
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {selectedTicket.messages.map((m, idx) => {
                    const isAdmin = m.sender === "admin";
                    return (
                      <div key={idx} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-[#ef233c] text-white rounded-tr-none shadow-lg shadow-[#ef233c]/20"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                        }`}>
                          <p>{m.message}</p>
                          <span className={`text-[8px] mt-1.5 block text-right font-semibold ${isAdmin ? "text-white/60" : "text-zinc-600"}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply input */}
                <div className="p-4 border-t border-zinc-900 shrink-0">
                  {selectedTicket.status === "resolved" ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} /> Ticket resolved & closed.
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="flex gap-3">
                      <input type="text" placeholder="Type reply to user..."
                        value={replyText} onChange={e => setReplyText(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:border-[#ef233c]/50 focus:outline-none text-xs transition-colors placeholder-zinc-600" />
                      <button type="submit" disabled={submittingReply || !replyText}
                        className="w-10 h-10 bg-[#ef233c] hover:bg-[#d90429] disabled:bg-zinc-800 text-white disabled:text-zinc-600 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-[#ef233c]/20">
                        {submittingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <MessageCircle size={44} className="text-zinc-800" />
                <p className="text-sm font-black text-zinc-600">No Ticket Selected</p>
                <p className="text-xs text-zinc-700 max-w-xs">Click a ticket from the list to view messages and reply.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
