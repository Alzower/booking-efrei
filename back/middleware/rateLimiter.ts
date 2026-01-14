import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp = forwardedFor ? forwardedFor.toString().split(",")[0] : ip;
    console.log(`[Rate Limiter] Request from IP: ${clientIp}`);
    return clientIp;
  },
  handler: (req, res) => {
    console.log(`[Rate Limiter] ❌ BLOCKED - Too many requests from this IP`);
    res.status(429).json({
      error: "Trop de tentatives de connexion",
      message: "Veuillez réessayer dans 1 minute",
      retryAfter: 60,
    });
  },
});
