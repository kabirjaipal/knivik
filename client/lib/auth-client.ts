import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

// Ensure baseURL is absolute - Better Auth requires full URL
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }
  return `${process.env.BACKEND_URL}/api/auth`;
};

const baseURL = getBaseURL();

// Create Better Auth client with your backend URL
export const authClient = createAuthClient({
  baseURL,
  plugins: [usernameClient()],
  user: {
    additionalFields: {
      role: { type: "string" },
      plan: { type: "string" },
      subscriptionStatus: { type: "string" },
      lemonSqueezyCustomerId: { type: "string" },
      isScanning: { type: "boolean" },
      lastScanStatus: { type: "string" },
    }
  }
});

// Export typed helpers for convenience
export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Re-export for use in components
export default authClient;
