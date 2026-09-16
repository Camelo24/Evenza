import crypto from "crypto";

// Campay client abstraction. In production, replace `authorize` and `refund`
// with real HTTPS calls (POST /api/collect and POST /api/refund). The interface
// here mirrors the aggregator's minimal contract so the escrow module never
// depends on provider details directly.

export type AuthorizeArgs = { amount: number; phoneNumber: string; reference: string; currency?: string };
export type AuthorizeResult = { ok: true; providerReference: string } | { ok: false; message: string };

const CAMPAY_API = process.env.CAMPAY_API_URL;
const CAMPAY_TOKEN = process.env.CAMPAY_TOKEN;

export async function authorize(args: AuthorizeArgs): Promise<AuthorizeResult> {
  if (!/^(\+?237)?[26]\d{8}$/.test(args.phoneNumber)) {
    return { ok: false, message: "Invalid Cameroonian mobile number." };
  }
  if (!CAMPAY_API || !CAMPAY_TOKEN) {
    // Sandbox mode: mimic the aggregator's synchronous authorization.
    return { ok: true, providerReference: `CPY-${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
  }
  try {
    const response = await fetch(`${CAMPAY_API}/collect`, {
      method: "POST",
      headers: { authorization: `Token ${CAMPAY_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ amount: String(args.amount), currency: args.currency ?? "XAF", from: args.phoneNumber, external_reference: args.reference }),
    });
    if (!response.ok) return { ok: false, message: `Payment failed (${response.status}).` };
    const json = (await response.json()) as { reference?: string };
    return { ok: true, providerReference: json.reference ?? args.reference };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function refund(args: { providerReference: string; amount: number }) {
  if (!CAMPAY_API || !CAMPAY_TOKEN) return { ok: true };
  await fetch(`${CAMPAY_API}/refund`, {
    method: "POST",
    headers: { authorization: `Token ${CAMPAY_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ reference: args.providerReference, amount: String(args.amount) }),
  });
  return { ok: true };
}
