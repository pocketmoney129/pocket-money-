import jwt from "jsonwebtoken";

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "super_secret_pocket_money_jwt_token_key_12345", {
    expiresIn: "30d"
  });
};
