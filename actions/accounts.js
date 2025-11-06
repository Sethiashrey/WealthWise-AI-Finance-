"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeAccount = (obj) => {
  if (!obj) return null;
  const serialized = { ...obj };
  if (obj.balance) serialized.balance = obj.balance.toNumber();
  if (obj.amount) serialized.amount = obj.amount.toNumber();
  return serialized;
};

const serializeTransaction = (obj) => {
  if (!obj) return null;
  const serialized = { ...obj };
  if (obj.amount) serialized.amount = obj.amount.toNumber();
  if (obj.balance) serialized.balance = obj.balance.toNumber();
  return serialized;
};

export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Reset all existing default accounts
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Update the requested account
    const account = await db.account.update({
      where: { id: accountId },
      data: { isDefault: true },
    });

    // Ensure the account belongs to the user
    if (account.userId !== user.id) {
      throw new Error("Unauthorized: Account does not belong to user");
    }

    revalidatePath("/dashboard");

    return { success: true, data: serializeAccount(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAccountWithTransaction(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: { id: accountId, userId: user.id },
      include: {
        transactions: {
          orderBy: { date: "desc" },
        },
        _count: {
          select: { transactions: true }, // plural
        },
      },
    });

    if (!account) return null;

    return {
      ...serializeAccount(account),
      transactions: account.transactions.map(serializeTransaction),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Get all transactions for the user
    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    if (!transactions.length) {
      throw new Error("No transactions found for deletion");
    }

    // Calculate balance changes for each account
    const accountBalanceChanges = transactions.reduce((acc, tx) => {
      const amount = Number(tx.amount); // convert Decimal → number
      const change = tx.type === "EXPENSE" ? amount : -amount; // reverse the effect
      acc[tx.accountId] = (acc[tx.accountId] || 0) + change;
      return acc;
    }, {});

    // Delete and update inside a Prisma transaction
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return { success: true };
  } catch (error) {
    console.error("Error in bulkDeleteTransactions:", error);
    return { success: false, error: error.message };
  }
}


