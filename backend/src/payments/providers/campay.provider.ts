import crypto from "crypto";

// CamPay collects funds; the application records those funds in its own escrow
// ledger after this provider call succeeds.

export type AuthorizeArgs = { amount: number; phoneNumber: string; reference: string; currency?: string };
export type AuthorizeResult = { ok: true; providerReference: string } | { ok: false; message: string };

const CAMPAY_API = process.env.CAMPAY_API_URL ?? "https://demo.campay.net";
const CAMPAY_TOKEN = process.env.CAMPAY_TOKEN;
const CAMPAY_APP_USERNAME = process.env.CAMPAY_APP_USERNAME;
const CAMPAY_APP_PASSWORD = process.env.CAMPAY_APP_PASSWORD;

function campayEndpoint(path: string) {
  const base = CAMPAY_API!.replace(/\/+$/, "");
  return `${base}${base.endsWith("/api") ? "" : "/api"}/${path.replace(/^\/+/, "")}`;
}

async function getCampayToken() {
  if (CAMPAY_APP_USERNAME && CAMPAY_APP_PASSWORD) {
    const response = await fetch(campayEndpoint("token/"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: CAMPAY_APP_USERNAME, password: CAMPAY_APP_PASSWORD }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { token?: string };
    return json.token ?? null;
  }
  if (CAMPAY_TOKEN) return CAMPAY_TOKEN;
  return null;
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForPayment(reference: string, token: string, initialStatus?: string) {
  let status = initialStatus?.toUpperCase();
  for (let attempt = 0; attempt < 10 && (!status || status === "PENDING"); attempt += 1) {
    if (attempt > 0 || !status) await wait(3000);
    const response = await fetch(campayEndpoint(`transaction/${encodeURIComponent(reference)}/`), {
      headers: { authorization: `Token ${token}` },
    });
    if (!response.ok) return { ok: false as const, message: `Could not verify CamPay payment (${response.status}).` };
    const json = (await response.json()) as { status?: string };
    status = json.status?.toUpperCase();
  }
  if (status === "SUCCESSFUL") return { ok: true as const };
  if (status === "FAILED") return { ok: false as const, message: "CamPay reported that the payment failed." };
  return { ok: false as const, message: "CamPay payment is still pending. Check the phone prompt and try again shortly." };
}

export async function authorize(args: AuthorizeArgs): Promise<AuthorizeResult> {
  if (!/^(\+?237)?[26]\d{8}$/.test(args.phoneNumber)) {
    return { ok: false, message: "Invalid Cameroonian mobile number." };
  }
  if (!CAMPAY_TOKEN && !CAMPAY_APP_USERNAME && !CAMPAY_APP_PASSWORD) {
    // Sandbox mode: mimic the aggregator's synchronous authorization.
    return { ok: true, providerReference: `CPY-${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
  }
  try {
    if (CAMPAY_API.includes("demo.campay.net") && args.amount > 25) {
      return { ok: false, message: "CamPay demo payments are limited to 25 XAF. Lower the service or ticket amount to test." };
    }
    const token = await getCampayToken();
    if (!token) return { ok: false, message: "Could not authenticate with CamPay. Check the demo app username and password in backend/.env." };
    const phone = args.phoneNumber.replace(/\D/g, "");
    const from = phone.startsWith("237") ? phone : `237${phone}`;
    const response = await fetch(campayEndpoint("collect/"), {
      method: "POST",
      headers: { authorization: `Token ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ amount: String(args.amount), currency: args.currency ?? "XAF", from, description: `Evenza payment ${args.reference}`, external_reference: args.reference }),
    });
    if (!response.ok) {
      const detail = response.status === 401
        ? "CamPay rejected the API token. Verify the demo application username/password and remove any stale CAMPAY_TOKEN."
        : `CamPay payment request failed (${response.status}).`;
      return { ok: false, message: detail };
    }
    const json = (await response.json()) as { reference?: string; status?: string; message?: string };
    if (json.status?.toUpperCase() === "FAILED") return { ok: false, message: json.message ?? "CamPay declined the payment." };
    if (!json.reference) return { ok: false, message: "CamPay did not return a payment reference." };
    const paymentResult = await waitForPayment(json.reference, token, json.status);
    if (!paymentResult.ok) return paymentResult;
    return { ok: true, providerReference: json.reference ?? args.reference };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function refund(args: { providerReference: string; amount: number }) {
  if (!CAMPAY_TOKEN && !CAMPAY_APP_USERNAME && !CAMPAY_APP_PASSWORD) return { ok: true };
  const token = await getCampayToken();
  if (!token) return { ok: false };
  await fetch(campayEndpoint("refund/"), {
    method: "POST",
    headers: { authorization: `Token ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ reference: args.providerReference, amount: String(args.amount) }),
  });
  return { ok: true };
}
