import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded && typeof decoded === "object" && "userId" in decoded) {
      req.userId = decoded.userId;
    }
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export { authMiddleware };
