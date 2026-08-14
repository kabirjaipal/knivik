import DodoPayments from "dodopayments";
import config from "./config";

export const dodo = new DodoPayments({
  bearerToken: config.DODO_PAYMENTS_API_KEY || "",
  webhookKey: config.DODO_PAYMENTS_WEBHOOK_KEY || "",
  environment: config.NODE_ENV === "production" ? "live_mode" : "test_mode",
});
