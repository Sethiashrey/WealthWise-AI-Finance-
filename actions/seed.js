"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";

const ACCOUNT_ID = "952e0082-6627-42fa-973f-5f96d35db8c0";
const USER_ID = "b7344968-ccce-4832-8a71-3820e270216e";

// Categories with INR ranges
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [50000, 80000] },       // ~50k–80k INR
    { name: "freelance", range: [10000, 30000] },    // ~10k–30k INR
    { name: "investments", range: [5000, 20000] },   // ~5k–20k INR
    { name: "other-income", range: [1000, 10000] },  // ~1k–10k INR
  ],
  EXPENSE: [
    { name: "housing", range: [10000, 25000] },      // Rent/EMI
    { name: "transportation", range: [2000, 6000] }, // Cab, fuel
    { name: "groceries", range: [4000, 12000] },     // Family groceries
    { name: "utilities", range: [2000, 6000] },      // Electricity, internet
    { name: "entertainment", range: [1000, 5000] },  // OTT, outings
    { name: "food", range: [1000, 4000] },           // Dining out
    { name: "shopping", range: [2000, 15000] },      // Clothes, gadgets
    { name: "healthcare", range: [2000, 15000] },    // Medicines, checkups
    { name: "education", range: [5000, 25000] },     // Fees, courses
    { name: "travel", range: [10000, 50000] },       // Trips
  ],
};

// Helper to generate random amount within a range
function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to get random category with amount
function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    // Generate 90 days of transactions
    const transactions = [];
    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // Generate 1-3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        // 40% chance of income, 60% chance of expense
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        const transaction = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${
            type === "INCOME" ? "Received" : "Paid for"
          } ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance += type === "INCOME" ? amount : -amount;
        transactions.push(transaction);
      }
    }

    // Insert transactions in batches and update account balance
    await db.$transaction(async (tx) => {
      // Clear existing transactions
      await tx.transaction.deleteMany({
        where: { accountId: ACCOUNT_ID },
      });

      // Insert new transactions
      await tx.transaction.createMany({
        data: transactions,
      });

      // Update account balance
      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}
