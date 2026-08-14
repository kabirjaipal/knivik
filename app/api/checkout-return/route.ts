import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Determine if payment/checkout succeeded
  const isSuccess = status === "success" || status === "active";

  // Create clean redirect URL to dashboard billing page
  const redirectUrl = new URL("/dashboard/billing", request.url);
  if (isSuccess) {
    redirectUrl.searchParams.set("status", "success");
  }

  // Perform server-side redirect, cleaning up all other query parameters
  return NextResponse.redirect(redirectUrl);
}
