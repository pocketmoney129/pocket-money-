import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface AuthRequest extends Request {
  user?: any; // Dynamic Firestore user object
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "super_secret_pocket_money_jwt_token_key_12345"
      ) as { id: string };

      const userDocRef = doc(db, "users", decoded.id);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        res.status(401).json({ success: false, message: "Not authorized, user not found" });
        return;
      }

      const user = userSnap.data();

      if (user.status === "suspended") {
        res.status(403).json({ success: false, message: "Account is suspended. Contact support." });
        return;
      }

      req.user = { _id: userDocRef.id, ...user };
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({ success: false, message: "Not authorized, token verification failed" });
      return;
    }
  } else {
    res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    return;
  }
};
