import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { db } from "../config/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("Seeding Firestore collections...");

    // 1. Seed global settings
    const settingsSnap = await getDocs(collection(db, "settings"));
    if (settingsSnap.empty) {
      const settingsId = doc(collection(db, "settings")).id;
      await setDoc(doc(db, "settings", settingsId), {
        siteName: "Pocket Money",
        siteEmail: "pocketmoneyhelp129@gmail.com",
        sitePhone: "+1234567890",
        minDeposit: 100,
        maxDeposit: 100000,
        minWithdraw: 200,
        maxWithdraw: 50000,
        withdrawalFeePercent: 5,
        upiId: "pocketmoneyhelp129@okaxis",
        bankTransferDetails: {
          bankName: "Pocket Money Bank",
          accountNumber: "1234567890",
          ifsc: "PMB0001234",
          holderName: "Pocket Money Systems"
        },
        qrCodeImage: "",
        allowMultipleActivePackages: false
      });
      console.log("✅ Seeded default settings in settings collection.");
    } else {
      console.log("Settings already exist in Firestore. Skipping settings seeding.");
    }

    // 2. Seed packages
    console.log("Cleaning old MLM packages...");
    const packagesSnap = await getDocs(collection(db, "packages"));
    const { deleteDoc } = await import("firebase/firestore");
    for (const docSnap of packagesSnap.docs) {
      await deleteDoc(doc(db, "packages", docSnap.id));
    }
    console.log("Seeding new MLM packages...");
    const defaultPackages = [
      {
        name: "Basic",
        price: 499,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "Entry level membership to start earning daily.",
        status: "active"
      },
      {
        name: "Medium",
        price: 999,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "Stepping stone to boost your daily passive earnings.",
        status: "active"
      },
      {
        name: "Advance",
        price: 1999,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "Most popular tier for standard network members.",
        status: "active"
      },
      {
        name: "Bronze",
        price: 3999,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "High returns package with solid profitability ratios.",
        status: "active"
      },
      {
        name: "Silver",
        price: 7999,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "Premium yield package for active network nodes.",
        status: "active"
      },
      {
        name: "Gold",
        price: 14999,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "VIP plan with massive daily return rates.",
        status: "active"
      },
      {
        name: "Diamond",
        price: 29999,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "Ultimate package for major network team leaders.",
        status: "active"
      },
      {
        name: "Platinum",
        price: 49999,
        directCommission: 10,
        levelCommissions: [5, 3, 2, 1, 1],
        description: "Highest passive income return tier available.",
        status: "active"
      }
    ];

    for (const pkg of defaultPackages) {
      const pkgId = doc(collection(db, "packages")).id;
      await setDoc(doc(db, "packages", pkgId), {
        _id: pkgId,
        ...pkg,
        createdAt: new Date().toISOString()
      });
    }
    console.log("✅ Seeded default MLM packages in packages collection.");

    // 3. Seed default admin
    const usersRef = collection(db, "users");
    const qAdmin = query(usersRef, where("role", "==", "admin"));
    const adminSnap = await getDocs(qAdmin);

    if (adminSnap.empty) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      const adminId = doc(collection(db, "users")).id;

      await setDoc(doc(db, "users", adminId), {
        _id: adminId,
        name: "Pocket Money Admin",
        email: "admin@pocketmoney.com",
        username: "admin",
        password: hashedPassword,
        phone: "+0000000000",
        role: "admin",
        status: "active",
        sponsor: null,
        referralCode: "admin",
        walletBalance: 100000,
        totalIncome: 0,
        emailVerified: true,
        kyc: {
          status: "approved",
          submittedAt: new Date().toISOString()
        },
        bankDetails: {},
        activePackage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log("✅ Seeded default admin account (username: admin, password: admin123).");
    } else {
      console.log("Admin account already exists in Firestore. Skipping admin seeding.");
    }

    // 4. Initialize referral code counter (PM5001, PM5002...)
    const counterRef = doc(db, "counters", "referralCode");
    const counterSnap = await getDoc(counterRef);
    if (!counterSnap.exists()) {
      await setDoc(counterRef, { seq: 5000 });
      console.log("✅ Initialized referral code counter at PM5000 (next user gets PM5001).");
    } else {
      console.log("Referral code counter already exists. Skipping.");
    }

    console.log("Database seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
