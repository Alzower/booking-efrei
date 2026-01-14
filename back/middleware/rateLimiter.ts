import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: "Trop de tentatives de connexion, veuillez réessayer dans 1 minute",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const email = req.body?.email || "unknown";
    console.log(`[Rate Limiter] IP: ${ip}, Email: ${email}`);
    return `${ip}-${email}`;
  },
  handler: (req, res) => {
    console.log(`[Rate Limiter] BLOCKED - Too many attempts`);
    res.status(429).json({
      error: "Trop de tentatives de connexion",
      message: "Veuillez réessayer dans 1 minute",
      retryAfter: 60,
    });
  },
});
