"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Clock, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface TxItem {
  _id: string;
  amount: number;
  type: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function WalletHistory() {
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/transactions?page=${pageNum}&limit=10`);
      if (res.success) {
        setTransactions(res.data.transactions);
        setPage(res.data.page);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const getTxTypeBadge = (type: string) => {
    const badges: { [key: string]: string } = {
      deposit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      withdrawal: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      package_purchase: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      direct_income: "bg-indigo-500/10 text-indigo-450 border-indigo-500/20",
      level_income: "bg-purple-500/10 text-purple-450 border-purple-500/20",
      manual_adjustment: "bg-zinc-900 border border-zinc-800 text-zinc-350"
    };
    return badges[type] || "bg-zinc-900 text-zinc-400 border-zinc-850";
  };

  return (
    <div className="space-y-6 font-sans text-zinc-300 relative">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Wallet History</h2>
          <p className="text-xs text-zinc-450 font-medium mt-1">Audit trail of all deposits, referrals, activations, and payouts.</p>
        </div>
      </div>

      <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-900 shadow-[0_0_20px_rgba(239,35,60,0.01)]">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-[#ef233c]" size={28} />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-zinc-550 font-semibold py-12 text-center">No transaction records found.</p>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Transaction ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Balances (Before → After)</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-350">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-4 text-xs font-mono text-zinc-500">#{tx._id.slice(-8)}</td>
                      <td className="py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase ${getTxTypeBadge(tx.type)}`}>
                          {tx.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-semibold text-white">{tx.description}</td>
                      <td className={`py-4 font-bold text-xs ${tx.amount > 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {tx.amount > 0 ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                      </td>
                      <td className="py-4 text-xs text-zinc-450 font-mono">
                        ₹{tx.balanceBefore?.toLocaleString()} → ₹{tx.balanceAfter?.toLocaleString()}
                      </td>
                      <td className="py-4 text-xs text-zinc-500 font-semibold">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
                <span className="text-xs text-zinc-500 font-semibold">
                  Page {page} of {pages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 border border-zinc-850 rounded-xl hover:bg-zinc-900 disabled:opacity-30 text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border border-zinc-855 rounded-xl hover:bg-zinc-900 disabled:opacity-30 text-white transition-colors"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
