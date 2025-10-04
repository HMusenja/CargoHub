import dotenv from "dotenv";
dotenv.config();

function requireEnv(key, fallback = undefined) {
  const val = process.env[key] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required env: ${key}`);
  }
  return val;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  appUrl: requireEnv("APP_URL", "http://localhost:5000"),
  frontendUrl: requireEnv("FRONTEND_URL", "http://localhost:5173"),
  currency: process.env.CURRENCY || "EUR",

  // dummy stripe values; not used for real verification in this step
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "sk_test_dummy",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy",
};
