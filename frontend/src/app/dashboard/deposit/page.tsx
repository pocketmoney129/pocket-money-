"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { 
  ArrowDownCircle, 
  Copy, 
  Check, 
  Upload, 
  Loader2, 
  QrCode, 
  Building,
  AlertCircle,
  Package,
  CheckCircle,
  Calendar,
  Clock,
  ArrowUpRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

interface PaymentSettings {
  upiId: string;
  minDeposit: number;
  maxDeposit: number;
  qrCodeImage?: string;
  bankTransferDetails: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    holderName: string;
  };
}

interface DepositItem {
  _id: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  screenshot: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  packageId?: string;
  createdAt: string;
}

interface PackageItem {
  _id: string;
  name: string;
  price: number;
  directCommission: number;
  levelCommissions: number[];
  description: string;
}

export default function DepositPage() {
  const { user, syncProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageIdParam = searchParams.get("packageId");

  const [paySettings, setPaySettings] = useState<PaymentSettings | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [history, setHistory] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Flow State
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);

  // Form states
  const [transactionReference, setTransactionReference] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  // Copy states
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const termsParagraphs = [
    `By accessing, browsing, registering, purchasing any membership plan, or utilizing any services or features provided under the brand name "Pocket Money" (hereinafter referred to as "the Company"), the user expressly acknowledges, understands, and agrees to be legally bound by the following Terms & Conditions. These Terms govern the entire relationship between the user and the Company and supersede any previous verbal or written communications regarding the platform. Participation in the platform is completely voluntary and undertaken solely at the user's own discretion without any force, coercion, or misrepresentation by the Company or its representatives.`,
    `The Company operates under its own independent business model. Funds received through membership plans or platform participation may be utilized by the Company for legitimate business operations and investment activities intended to generate business revenue. The Company may allocate these funds across various business opportunities, partnerships, expansion initiatives, or other revenue-generating activities in accordance with its internal business strategy. Revenue generated from these activities may be utilized for platform development, operational expenses, business expansion, reward programs, incentive pools, commissions, bonuses, and eligible member payouts as determined by the Company's policies. Participation in the platform does not create any ownership rights over the Company's investments, assets, or business operations.`,
    `The user understands and agrees that Pocket Money is not a banking institution, savings scheme, fixed deposit, mutual fund, chit fund, NBFC, insurance provider, or any financial institution unless specifically required by applicable law. Participation on the platform should not be interpreted as purchasing any regulated financial product.`,
    `All users acknowledge and accept that any membership purchase, financial contribution, package activation, or monetary transaction made through the platform is entirely voluntary and carried out at the user's own discretion. The Company does not guarantee fixed, assured, or risk-free returns. Earnings, rewards, bonuses, commissions, incentives, or payouts are governed solely by the Company's business model, reward plan, eligibility requirements, internal policies, and overall business performance. Actual earnings may vary depending on multiple factors including user activity, referral performance, team growth, package eligibility, system rules, business performance, verification processes, and other operational considerations.`,
    `The user understands that all payments made toward membership plans or package activations are generally final and shall be processed in accordance with the Company's Refund and Cancellation Policy, if applicable. Submission of payment details or transaction proof does not automatically guarantee account activation or entitlement to any reward until verification is successfully completed by the Company.`,
    `All withdrawal requests are subject to verification, fraud detection, compliance review, account status verification, and the Company's internal processing policies. The Company reserves the right to approve, delay, hold, or reject withdrawal requests where necessary to ensure platform security, regulatory compliance, or investigation of suspicious activities.`,
    `The user further acknowledges that participation in referral programs, team-building activities, leadership rewards, level-based incentives, bonuses, or any other reward mechanism is entirely performance-based. The Company's reward structure depends upon eligibility criteria, platform policies, and business performance. The Company shall not be responsible for the actions, inactivity, misconduct, or performance of any referral, team member, or third party connected with the platform.`,
    `Users agree to provide accurate, complete, and truthful personal information at all times. Pocket Money reserves the right to request identity verification (KYC), banking verification, or additional documentation whenever necessary to maintain platform security and regulatory compliance.`,
    `Any misuse of the platform including but not limited to fake registrations, multiple accounts, identity fraud, forged payment proofs, unauthorized promotions, misleading advertisements, spam activities, system manipulation, hacking attempts, automated registrations, money laundering activities, or violations of applicable laws may result in immediate suspension or permanent termination of the user's account without prior notice. Any pending rewards or platform benefits may also be withheld where policy violations are detected.`,
    `The Company continuously works to improve its services and therefore reserves the absolute right to modify, suspend, discontinue, replace, or update any feature, membership plan, business model, reward structure, withdrawal policy, referral policy, or these Terms & Conditions at any time without prior notice. Continued use of the platform after such modifications shall constitute acceptance of the revised Terms.`,
    `While Pocket Money strives to maintain uninterrupted platform availability, the Company shall not be liable for temporary service interruptions caused by maintenance, software updates, server downtime, cyber incidents, third-party service failures, internet connectivity issues, force majeure events, or circumstances beyond its reasonable control.`,
    `To the maximum extent permitted by applicable law, the Company, its owners, directors, employees, developers, partners, affiliates, and representatives shall not be held liable for any direct, indirect, incidental, consequential, special, or financial losses arising from the use of the platform, including but not limited to loss of profits, data loss, business interruption, unauthorized account access caused by user negligence, or actions of third parties.`,
    `By creating an account, purchasing a membership, making any payment, or using any feature of Pocket Money, the user confirms that they have carefully read, fully understood, and voluntarily accepted these Terms & Conditions in their entirety.`,
    `If the user does not agree with any provision of these Terms & Conditions, they should immediately discontinue use of the platform and refrain from registering or participating in any activities offered by Pocket Money.`
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, pkgsRes, historyRes] = await Promise.all([
        api.get("/user/payment-settings"),
        api.get("/user/packages"),
        api.get("/transactions/deposits")
      ]);
      if (settingsRes.success) setPaySettings(settingsRes.data);
      
      let sortedPkgs: PackageItem[] = [];
      if (pkgsRes.success) {
        sortedPkgs = [...pkgsRes.data].sort((a, b) => a.price - b.price);
        setPackages(sortedPkgs);
      }
      
      if (historyRes.success) setHistory(historyRes.data);

      // Handle query param packageId
      if (packageIdParam && sortedPkgs.length > 0) {
        const found = sortedPkgs.find(p => p._id === packageIdParam);
        if (found) {
          setSelectedPackage(found);
        }
      }
    } catch (err) {
      console.error("Error loading dashboard packages and deposits config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncProfile();
    fetchData();
  }, [packageIdParam]);


  const handleSelectPackage = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setError(null);
    setSuccess(null);
    setTransactionReference("");
    setScreenshot(null);
    setScreenshotPreview(null);
    setAcceptedTerms(false);
    router.replace(`/dashboard/deposit?packageId=${pkg._id}`);
  };

  const handleClearSelection = () => {
    setSelectedPackage(null);
    setError(null);
    setSuccess(null);
    setTransactionReference("");
    setScreenshot(null);
    setScreenshotPreview(null);
    setAcceptedTerms(false);
    router.replace(`/dashboard/deposit`);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const copyText = (text: string, type: "upi" | "bank") => {
    navigator.clipboard.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      setError("Please select a package first.");
      return;
    }
    if (!transactionReference || !screenshot) {
      setError("Please fill in the UTR transaction reference and upload payment receipt screenshot.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("amount", selectedPackage.price.toString());
      formData.append("paymentMethod", "UPI / Bank Transfer");
      formData.append("transactionReference", transactionReference);
      formData.append("screenshot", screenshot);
      formData.append("packageId", selectedPackage._id);

      const res = await api.post("/transactions/deposit", formData);
      if (res.success) {
        setSuccess(`Payment receipt for plan ${selectedPackage.name} submitted successfully! Your account will activate upon admin verification.`);
        setTransactionReference("");
        setScreenshot(null);
        setScreenshotPreview(null);
        fetchData(); // Reload list
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit payment request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    const styles = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-450 border-emerald-500/20",
      rejected: "bg-rose-500/10 text-rose-455 border-rose-500/20"
    };
    return styles[status as keyof typeof styles] || "bg-zinc-900 border-zinc-850 text-zinc-400";
  };

  // Use live API data from package if available, else fallback to hardcoded by name
  const getPackageDetails = (pkg: PackageItem) => {
    // If ROI fields stored in Firestore (set via admin panel), use them
    if ((pkg as any).dailyRoi !== undefined && (pkg as any).dailyRoi > 0) {
      return {
        daily: (pkg as any).dailyRoi,
        total: (pkg as any).totalReturn || 0,
        returnPercent: (pkg as any).returnPercent || "N/A",
        expiry: `${(pkg as any).expiryDays || 25} Days`,
        badge: (pkg as any).badge || pkg.name
      };
    }
    // Fallback hardcoded by name (for backward compatibility)
    const cleanName = pkg.name.toLowerCase();
    if (cleanName.includes("basic")) {
      return { daily: 32, total: 800, returnPercent: "60%", expiry: "25 Days", badge: "Starter" };
    } else if (cleanName.includes("medium")) {
      return { daily: 66, total: 1650, returnPercent: "65%", expiry: "25 Days", badge: "Standard" };
    } else if (cleanName.includes("advance")) {
      return { daily: 136, total: 3400, returnPercent: "70%", expiry: "25 Days", badge: "Popular" };
    } else if (cleanName.includes("bronze")) {
      return { daily: 288, total: 7200, returnPercent: "80%", expiry: "25 Days", badge: "Recommended" };
    } else if (cleanName.includes("silver")) {
      return { daily: 592, total: 14800, returnPercent: "85%", expiry: "25 Days", badge: "Premium" };
    } else if (cleanName.includes("gold")) {
      return { daily: 1140, total: 28500, returnPercent: "90%", expiry: "25 Days", badge: "VIP Elite" };
    } else if (cleanName.includes("diamond")) {
      return { daily: 2340, total: 58500, returnPercent: "95%", expiry: "25 Days", badge: "Top Tier" };
    } else if (cleanName.includes("platinum")) {
      return { daily: 4000, total: 100000, returnPercent: "100%", expiry: "25 Days", badge: "Ultimate VIP" };
    }
    return { daily: 0, total: 0, returnPercent: "0%", expiry: "25 Days", badge: pkg.name };
  };

  const getPackageNameById = (pkgId?: string, amount?: number) => {
    if (pkgId) {
      const found = packages.find(p => p._id === pkgId);
      if (found) return found.name;
    }
    if (amount) {
      const found = packages.find(p => p.price === amount);
      if (found) return found.name;
    }
    return "Earning Plan";
  };

  const backendUrl = "http://localhost:5001";

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Earning Plan Payments</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">Select a package tier, make the payment, and submit screenshot receipt for account activation.</p>
      </div>

      {error && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold shadow-md">{error}</div>}
      {success && <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-md">{success}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-[#ef233c]" size={32} />
        </div>
      ) : (
        <>
          {/* STEP 1: Packages Selection (Shown if selectedPackage is null) */}
          {!selectedPackage ? (
            <div className="space-y-8">
              {user?.activePackage && (
                <div className="bg-zinc-950 p-6 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Package size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Current Active Package: {(user.activePackage as any).name}</p>
                    <p className="text-xs text-zinc-400 mt-1">Cost: ₹{(user.activePackage as any).price?.toLocaleString()}</p>
                    {user.packageActivatedAt && (
                      <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1 font-mono">
                        <Calendar size={12} /> Activated on {new Date(user.packageActivatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {packages.map((pkg) => {
                  const isActive = !!(user?.activePackage && (user.activePackage as any)._id === pkg._id);
                  const details = getPackageDetails(pkg);
                  const isPopular = !isActive && pkg.name.toLowerCase().includes("bronze");
                  
                  return (
                    <div 
                      key={pkg._id} 
                      className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                        isActive 
                          ? "border border-emerald-500 bg-zinc-950/60 shadow-[0_15px_40px_rgba(16,185,129,0.12)] scale-105 z-10" 
                          : isPopular 
                          ? "border border-[#ef233c] bg-zinc-900/40 shadow-[0_15px_40px_rgba(239,35,60,0.12)] scale-105 z-10"
                          : "bg-zinc-950/85 hover:bg-zinc-900/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(239,35,60,0.03)] hover:scale-[1.02]"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-lg">
                          Active Plan
                        </span>
                      )}
                      {!isActive && isPopular && (
                        <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#ef233c] text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-lg">
                          Recommended
                        </span>
                      )}

                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-lg text-white font-manrope">{pkg.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/20 border border-[#ef233c]/15 text-[#ef233c] font-semibold">{details.badge}</span>
                        </div>
                        <p className="text-[11px] mt-2 leading-relaxed text-zinc-400 font-light">{pkg.description}</p>
                        
                        <div className="my-6">
                          <span className="text-3xl font-black font-manrope tracking-tight">₹{pkg.price.toLocaleString()}</span>
                          <span className="text-[10px] block mt-1 text-zinc-550 font-medium">Plan purchase price</span>
                        </div>

                        <div className="border-t border-zinc-900 my-4" />

                        <ul className="space-y-2.5 text-xs mb-6">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                            <span className="text-zinc-300 font-light">Daily return: <strong className="text-white font-semibold">₹{details.daily}</strong></span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                            <span className="text-zinc-300 font-light">Total return: <strong className="text-white font-semibold">₹{details.total}</strong></span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                            <span className="text-zinc-300 font-light">ROI Percent: <strong className="text-white font-semibold">{details.returnPercent}</strong></span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                            <span className="text-zinc-300 font-light">Expiry: <strong className="text-white font-semibold">{details.expiry}</strong></span>
                          </li>
                        </ul>
                      </div>

                      {isActive ? (
                        <button disabled className="w-full text-center py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 cursor-not-allowed">
                          Active Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectPackage(pkg)}
                          className="w-full text-center py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-[#ef233c] hover:bg-red-750 text-white shadow-md shadow-red-650/20 flex items-center justify-center gap-1.5"
                        >
                          Select Plan <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STEP 2: Checkout & Direct Payment Form */
            <div className="space-y-6">
              {/* Back to selection link */}
              <button 
                onClick={handleClearSelection}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-450 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} /> Choose another package
              </button>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Gateway Credentials */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-zinc-950 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
                    <div className="border-b border-zinc-900 pb-4 flex justify-between items-center">
                      <h3 className="font-extrabold text-lg text-white flex items-center gap-2 font-manrope">
                        <QrCode className="text-[#ef233c]" /> Official Payment Details
                      </h3>
                      <span className="text-xs bg-[#ef233c]/10 text-[#ef233c] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-[#ef233c]/20">
                        {selectedPackage.name} - ₹{selectedPackage.price.toLocaleString()}
                      </span>
                    </div>

                    {/* UPI Details */}
                    <div className="grid sm:grid-cols-2 gap-6 items-start">
                      <div className="space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">UPI Account</span>
                        <div className="bg-zinc-900/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
                          <div className="overflow-hidden">
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase">Official UPI ID</span>
                            <p className="text-sm font-bold text-white truncate font-mono">{paySettings?.upiId || "pocketmoney@upi"}</p>
                          </div>
                          <button
                            onClick={() => copyText(paySettings?.upiId || "pocketmoney@upi", "upi")}
                            className="p-2.5 bg-zinc-800 border border-zinc-850 rounded-xl hover:bg-zinc-750 text-white transition-colors shadow-sm"
                          >
                            {copiedUpi ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-zinc-400" />}
                          </button>
                        </div>
                      </div>

                      {/* QR Code Scan */}
                      {paySettings?.qrCodeImage && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 self-start font-semibold">Scan code to pay</span>
                          <div className="w-40 h-40 rounded-2xl overflow-hidden p-2 bg-white flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.03)]">
                            <img
                              src={`${backendUrl}${paySettings.qrCodeImage}`}
                              alt="Official QR Code"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bank Account */}
                    <div className="space-y-4 border-t border-zinc-900 pt-6">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 font-semibold">
                        <Building size={14} /> Direct Bank Transfer details
                      </span>
                      
                      <div className="bg-zinc-900/60 rounded-2xl p-4 sm:p-6 grid sm:grid-cols-2 gap-4 relative shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div>
                          <span className="text-[10px] text-zinc-550 font-bold uppercase">Account Holder</span>
                          <p className="text-sm font-black text-white">{paySettings?.bankTransferDetails.holderName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-555 font-bold uppercase">Bank Name</span>
                          <p className="text-sm font-black text-white">{paySettings?.bankTransferDetails.bankName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-555 font-bold uppercase">Account Number</span>
                          <p className="text-sm font-black text-white font-mono">{paySettings?.bankTransferDetails.accountNumber}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-555 font-bold uppercase">IFSC Code</span>
                          <p className="text-sm font-black text-[#ef233c] font-mono">{paySettings?.bankTransferDetails.ifsc}</p>
                        </div>
                        <button
                          onClick={() => copyText(JSON.stringify(paySettings?.bankTransferDetails), "bank")}
                          className="absolute top-4 right-4 p-2 bg-zinc-800 border border-zinc-850 rounded-xl hover:bg-zinc-750 text-white transition-colors shadow-sm"
                        >
                          {copiedBank ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-zinc-400" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-400 font-semibold leading-relaxed shadow-md">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p>Instructions: Pay exactly ₹{selectedPackage.price.toLocaleString()} using any method above, then upload the receipt proof below to request plan activation.</p>
                      <p className="mt-1 text-[#ef233c] font-medium font-mono text-[10px] uppercase tracking-wider">Duplicate transaction references or invalid receipts are subject to immediate account restriction.</p>
                    </div>
                  </div>
                </div>

                {/* Upload Payment Details Form */}
                <div className="bg-zinc-950 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] h-fit">
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 mb-6 font-manrope">
                    <ArrowDownCircle className="text-emerald-400" /> Upload Receipt
                  </h3>

                  <form onSubmit={handleSubmitDeposit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Required Amount</label>
                      <div className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 text-white font-black text-base border border-zinc-850 tracking-wider">
                        ₹{selectedPackage.price.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Transaction UTR / Reference ID</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter 12-digit transaction ID"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-655 focus:border-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm font-semibold tracking-wider font-mono transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Payment Receipt Screenshot</label>
                      <div className="border-2 border-dashed border-zinc-850 rounded-2xl p-4 hover:bg-zinc-900 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {screenshotPreview ? (
                          <div className="w-full">
                            <img src={screenshotPreview} alt="Preview" className="max-h-32 object-contain mx-auto mb-2 rounded-lg" />
                            <p className="text-[11px] text-zinc-500 font-bold truncate">{screenshot?.name}</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-zinc-500 mb-2" size={24} />
                            <p className="text-xs font-bold text-zinc-350">Click to upload file</p>
                            <p className="text-[10px] text-zinc-500 mt-1 font-medium font-mono">JPEG, PNG, WEBP max 5MB</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* MANDATORY TERMS & CONDITIONS ACCEPTANCE SECTION */}
                    <div className="pt-2 border-t border-zinc-900">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="acceptedTerms"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-[#ef233c] focus:ring-[#ef233c] focus:ring-offset-zinc-950 cursor-pointer accent-[#ef233c]"
                        />
                        <label htmlFor="acceptedTerms" className="text-xs font-bold text-white cursor-pointer select-none leading-tight">
                          I have read, understood and agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-[#ef233c] hover:underline font-black cursor-pointer inline-flex items-center gap-0.5"
                          >
                            Terms & Conditions
                          </button>.
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !acceptedTerms}
                      className="w-full py-3.5 bg-[#ef233c] hover:bg-red-750 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="animate-spin animate-duration-1000" size={16} /> : "Submit Payment & Request Activation"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TERMS & CONDITIONS POPUP MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-[0_0_50px_rgba(239,35,60,0.15)] relative overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[#ef233c]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white font-manrope">Pocket Money Terms & Conditions</h3>
                  <p className="text-[10px] text-zinc-400 font-semibold">Mandatory Platform Usage & Membership Agreement</p>
                </div>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Terms Content */}
            <div className="overflow-y-auto space-y-3.5 pr-2 text-xs text-zinc-300 font-light leading-relaxed custom-scrollbar flex-1">
              {termsParagraphs.map((para, idx) => (
                <p key={idx} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-850/60 leading-relaxed text-zinc-300">
                  {para}
                </p>
              ))}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-zinc-900 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="w-full py-3 bg-[#ef233c] hover:bg-red-750 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> I Accept Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <h3 className="font-extrabold text-lg text-white mb-6 font-manrope flex items-center gap-2">
          <Clock className="text-[#ef233c]" /> Plan Activation Requests History
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-zinc-555 font-semibold py-8 text-center">No payment requests history found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">UTR Reference ID</th>
                  <th className="pb-3">Earning Plan</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Remarks / Details</th>
                  <th className="pb-3">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-350">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 text-xs font-mono text-white font-bold">{item.transactionReference}</td>
                    <td className="py-4 text-xs font-semibold text-zinc-350">{getPackageNameById(item.packageId, item.amount)}</td>
                    <td className="py-4 text-xs font-bold text-white">₹{item.amount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-semibold text-rose-500 max-w-[200px] truncate">
                      {item.remarks || <span className="text-zinc-650">-</span>}
                    </td>
                    <td className="py-4 text-xs text-zinc-500 font-semibold">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
