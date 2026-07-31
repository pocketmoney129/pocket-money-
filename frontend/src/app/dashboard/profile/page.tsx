"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Lock,
  KeyRound
} from "lucide-react";

export default function ProfilePage() {
  const { user, syncProfile, updateBankDetails, updateKycStatus } = useAuth();
  
  // Bank details form states
  const [holderName, setHolderName] = useState(user?.bankDetails?.holderName || "");
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || "");
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || "");
  const [ifsc, setIfsc] = useState(user?.bankDetails?.ifsc || "");
  const [upiId, setUpiId] = useState(user?.bankDetails?.upiId || "");
  const [updatingBank, setUpdatingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);

  // Change Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // KYC document form states
  const [documentType, setDocumentType] = useState("National ID");
  const [documentNumber, setDocumentNumber] = useState("");
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycSuccess, setKycSuccess] = useState<string | null>(null);

  // Sync profile details on load
  useEffect(() => {
    syncProfile();
  }, []);

  // Update bank forms when user context loads
  useEffect(() => {
    if (user?.bankDetails) {
      setHolderName(user.bankDetails.holderName || "");
      setAccountNumber(user.bankDetails.accountNumber || "");
      setBankName(user.bankDetails.bankName || "");
      setIfsc(user.bankDetails.ifsc || "");
      setUpiId(user.bankDetails.upiId || "");
    }
  }, [user]);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBank(true);
    setBankError(null);
    setBankSuccess(null);

    try {
      const res = await api.put("/user/bank-details", {
        holderName,
        accountNumber,
        bankName,
        ifsc,
        upiId
      });

      if (res.success) {
        setBankSuccess("Bank credentials updated successfully.");
        updateBankDetails(res.data);
      }
    } catch (err: any) {
      setBankError(err.message || "Failed to update bank details");
    } finally {
      setUpdatingBank(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await api.put("/user/change-password", {
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setPasswordSuccess("Password changed successfully! Your new password is now active.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFront(file);
      setDocFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocBack(file);
      setDocBackPreview(URL.createObjectURL(file));
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber || !docFront) {
      setKycError("Please specify the document number and select the front image.");
      return;
    }

    setSubmittingKyc(true);
    setKycError(null);
    setKycSuccess(null);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("documentNumber", documentNumber);
      formData.append("documentFront", docFront);
      if (docBack) {
        formData.append("documentBack", docBack);
      }

      const res = await api.post("/user/kyc", formData);
      if (res.success) {
        setKycSuccess("KYC submitted successfully. Waiting for administrative approval.");
        updateKycStatus(res.data);
        setDocFront(null);
        setDocFrontPreview(null);
        setDocBack(null);
        setDocBackPreview(null);
        setDocumentNumber("");
      }
    } catch (err: any) {
      setKycError(err.message || "Failed to upload KYC documents");
    } finally {
      setSubmittingKyc(false);
    }
  };

  const getKycBanner = () => {
    const status = user?.kyc?.status || "none";
    
    switch (status) {
      case "approved":
        return null;

      case "pending":
        return (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-start gap-4">
            <AlertTriangle className="text-amber-550 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold font-manrope">KYC Verification Pending Review</p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Your documents were submitted and are currently in the verification queue. Review typically takes 24 hours.</p>
            </div>
          </div>
        );
      case "rejected":
        return (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-455 flex items-start gap-4">
            <XCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold font-manrope">KYC Verification Rejected</p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Remarks: <strong className="text-rose-400 font-bold">{user?.kyc.remarks || "Documents unclear. Re-submit."}</strong>
              </p>
              <p className="text-xs text-rose-450 mt-2 font-medium">Please double-check details and submit a new request below.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-start gap-4">
            <AlertTriangle className="text-blue-550 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold font-manrope">KYC Verification Required</p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">KYC is mandatory to request payouts. Please upload a scan of your National ID, Passport, or PAN card.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Profile & KYC Settings</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">Configure security levels, withdraw destinations, and review document validations.</p>
      </div>

      {/* KYC Alert status Banner */}
      {getKycBanner()}

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Personal Details & Bank settings */}
        <div className="space-y-8">
          {/* User profile details info */}
          <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl space-y-6">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
              <User className="text-[#ef233c]" /> Account Profile Info
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-zinc-350">
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Full Name</span>
                <span className="text-white text-sm font-black mt-1 block">{user?.name}</span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Username</span>
                <span className="text-[#ef233c] text-sm font-black mt-1 block font-mono">@{user?.username}</span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Email Address</span>
                <span className="text-white text-sm font-black mt-1 block">{user?.email}</span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Phone Number</span>
                <span className="text-white text-sm font-black mt-1 block font-mono">{user?.phone}</span>
              </div>
            </div>
          </div>

          {/* Bank Settings manager */}
          <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl text-white">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 mb-6 font-manrope">
              <Building2 className="text-emerald-450" /> Payout Destination Settings
            </h3>

            {bankError && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-semibold">{bankError}</div>}
            {bankSuccess && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{bankSuccess}</div>}

            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Federal Union Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">IFSC Code / Routing</label>
                  <input
                    type="text"
                    placeholder="e.g. FUB0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm font-semibold tracking-wider font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="Enter Bank Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm font-semibold font-mono transition-all"
                />
              </div>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-zinc-900" />
                <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Or UPI Route</span>
                <div className="flex-grow border-t border-zinc-900" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. name@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm font-semibold text-emerald-400 font-mono transition-all"
                />
              </div>


              <button
                type="submit"
                disabled={updatingBank}
                className="w-full py-3.5 bg-[#ef233c] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingBank ? <Loader2 className="animate-spin" size={16} /> : "Update Credentials"}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div id="change-password" className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl text-white space-y-6">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
              <KeyRound className="text-[#ef233c]" /> Change Account Password
            </h3>

            {passwordError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{passwordError}</div>}
            {passwordSuccess && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{passwordSuccess}</div>}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Current Password <span className="text-[#ef233c]">*</span></label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">New Password <span className="text-[#ef233c]">*</span></label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Confirm Password <span className="text-[#ef233c]">*</span></label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-3.5 bg-[#ef233c] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {updatingPassword ? <Loader2 className="animate-spin" size={16} /> : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        {/* KYC Upload console (hidden when KYC is approved) */}
        {user?.kyc?.status !== "approved" && (
          <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl h-fit">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 mb-6 font-manrope">
              <ShieldCheck className="text-purple-400" /> KYC Identity Verification
            </h3>

            {user?.kyc?.status === "pending" ? (
              <div className="text-center py-12 space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-900">
                <ShieldCheck className="text-amber-400 mx-auto animate-pulse" size={48} />
                <p className="text-sm font-black text-white font-manrope">Verification materials secure.</p>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">To protect privacy, uploaded documents are locked from user view. Status: <strong className="uppercase text-amber-400 font-bold">PENDING APPROVAL</strong></p>
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="space-y-6">
                {kycError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{kycError}</div>}
                {kycSuccess && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{kycSuccess}</div>}

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Select ID Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white focus:outline-none text-sm transition-colors"
                  >
                    <option value="National ID">National ID Card</option>
                    <option value="Passport">Passport</option>
                    <option value="PAN Card">PAN Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Document ID Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter unique ID number"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm font-semibold transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Front Upload */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Front Side Image</label>
                    <div className="border border-zinc-800/80 rounded-2xl p-4 bg-zinc-900/40 hover:bg-zinc-900 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative h-36">
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleFrontChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {docFrontPreview ? (
                        <img src={docFrontPreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                      ) : (
                        <>
                          <Upload className="text-zinc-500 mb-1" size={20} />
                          <p className="text-[11px] font-bold text-zinc-350">Upload Front</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Back Upload */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Back Side Image (Optional)</label>
                    <div className="border border-zinc-800/80 rounded-2xl p-4 bg-zinc-900/40 hover:bg-zinc-900 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative h-36">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {docBackPreview ? (
                        <img src={docBackPreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                      ) : (
                        <>
                          <Upload className="text-zinc-500 mb-1" size={20} />
                          <p className="text-[11px] font-bold text-zinc-350">Upload Back</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="w-full py-3.5 bg-[#ef233c] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingKyc ? <Loader2 className="animate-spin" size={16} /> : "Submit KYC Request"}
                </button>
              </form>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
