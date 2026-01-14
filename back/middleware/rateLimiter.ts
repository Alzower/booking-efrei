import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp = forwardedFor ? forwardedFor.toString().split(",")[0] : ip;
    return clientIp;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Trop de tentatives de connexion",
      message: "Veuillez réessayer dans 1 minute",
      retryAfter: 60,
    });
  },
});
