import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    const email = req.body?.email || "unknown";
    console.log(`[Rate Limiter] Tracking: ${email}`);
    return email;
  },
  handler: (req, res) => {
    const email = req.body?.email || "unknown";
    console.log(`[Rate Limiter] ❌ BLOCKED - Email: ${email}`);
    return res.status(429).json({
      error: "Trop de tentatives de connexion",
      message: "Veuillez réessayer dans 1 minute",
      retryAfter: 60,
    });
  },
});
