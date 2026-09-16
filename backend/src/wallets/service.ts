import { db } from "@db/client";
import { walletTransactions, wallets } from "@db/schema";
import { and, eq } from "drizzle-orm";

/** Credits a service provider once per released booking. This ledger is the wallet source of truth. */
export async function creditServiceProviderWallet(args: { vendorId: string; bookingId: string; amount: number; reference: string }) {
  if (args.amount <= 0) return;
  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: walletTransactions.id }).from(walletTransactions).where(and(eq(walletTransactions.bookingId, args.bookingId), eq(walletTransactions.type, "escrow_release"))).limit(1);
    if (existing.length) return;
    const [wallet] = await tx.insert(wallets).values({ vendorId: args.vendorId }).onConflictDoNothing({ target: wallets.vendorId }).returning();
    const current = wallet ?? (await tx.select().from(wallets).where(eq(wallets.vendorId, args.vendorId)).limit(1))[0];
    const balanceAfter = current.balance + args.amount;
    await tx.update(wallets).set({ balance: balanceAfter, updatedAt: new Date() }).where(eq(wallets.id, current.id));
    await tx.insert(walletTransactions).values({ walletId: current.id, bookingId: args.bookingId, type: "escrow_release", amount: args.amount, balanceAfter, description: `Escrow released for ${args.reference}` });
  });
}

export async function getServiceProviderWallet(vendorId: string) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.vendorId, vendorId)).limit(1);
  const transactions = wallet ? await db.select().from(walletTransactions).where(eq(walletTransactions.walletId, wallet.id)).orderBy(walletTransactions.createdAt) : [];
  return { wallet: wallet ?? { balance: 0, currency: "XAF" }, transactions };
}
