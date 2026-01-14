import rateLimit from "express-rate-limit";

// Rate limiter pour les tentatives de connexion
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
