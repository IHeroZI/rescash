import { NextResponse } from "next/server";
import { checkPaymentTimeouts } from "@/lib/cron/checkPaymentTimeouts";

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "your-secret-key";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkPaymentTimeouts();
    return NextResponse.json(result);
  } catch (err) {
    console.log("Cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
