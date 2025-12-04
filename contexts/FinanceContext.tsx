import { useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";

export type TransactionType = "income" | "expense" | "investment" | "savings";
export type WealthCategory = "emergency" | "retirement" | "investment" | "general";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description?: string;
  createdAt: string;
};

export type WealthGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: WealthCategory;
  deadline?: string;
  createdAt: string;
};

export type FinancialStats = {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalInvestments: number;
  netWorth: number;
};

const TRANSACTIONS_KEY = "@finance_transactions";
const WEALTH_GOALS_KEY = "@wealth_goals";

export const [FinanceProvider, useFinance] = createContextHook(() => {
  const {
    data: transactions,
    saveData: saveTransactions,
    isLoading: isTransactionsLoading
  } = usePersistentStorage<Transaction[]>({
    key: TRANSACTIONS_KEY,
    initialValue: [],
    encryption: true,
  });

  const {
    data: wealthGoals,
    saveData: saveWealthGoals,
    isLoading: isGoalsLoading
  } = usePersistentStorage<WealthGoal[]>({
    key: WEALTH_GOALS_KEY,
    initialValue: [],
    encryption: true,
  });

  const isLoading = isTransactionsLoading || isGoalsLoading;

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id" | "createdAt">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `transaction_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedTransactions = [...transactions, newTransaction];
    await saveTransactions(updatedTransactions);
    console.log("Transaction added:", newTransaction);
    return newTransaction;
  }, [transactions, saveTransactions]);

  const updateTransaction = useCallback(async (transactionId: string, updates: Partial<Transaction>) => {
    const updatedTransactions = transactions.map((transaction) =>
      transaction.id === transactionId ? { ...transaction, ...updates } : transaction
    );
    await saveTransactions(updatedTransactions);
    console.log("Transaction updated:", transactionId);
  }, [transactions, saveTransactions]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    const updatedTransactions = transactions.filter((transaction) => transaction.id !== transactionId);
    await saveTransactions(updatedTransactions);
    console.log("Transaction deleted:", transactionId);
  }, [transactions, saveTransactions]);

  const addWealthGoal = useCallback(async (goal: Omit<WealthGoal, "id" | "createdAt">) => {
    const newGoal: WealthGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedGoals = [...wealthGoals, newGoal];
    await saveWealthGoals(updatedGoals);
    console.log("Wealth goal added:", newGoal);
    return newGoal;
  }, [wealthGoals, saveWealthGoals]);

  const updateWealthGoal = useCallback(async (goalId: string, updates: Partial<WealthGoal>) => {
    const updatedGoals = wealthGoals.map((goal) =>
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    await saveWealthGoals(updatedGoals);
    console.log("Wealth goal updated:", goalId);
  }, [wealthGoals, saveWealthGoals]);

  const deleteWealthGoal = useCallback(async (goalId: string) => {
    const updatedGoals = wealthGoals.filter((goal) => goal.id !== goalId);
    await saveWealthGoals(updatedGoals);
    console.log("Wealth goal deleted:", goalId);
  }, [wealthGoals, saveWealthGoals]);

  const financialStats = useMemo<FinancialStats>(() => {
    const stats = transactions.reduce(
      (acc, transaction) => {
        switch (transaction.type) {
          case "income":
            acc.totalIncome += transaction.amount;
            break;
          case "expense":
            acc.totalExpenses += transaction.amount;
            break;
          case "savings":
            acc.totalSavings += transaction.amount;
            break;
          case "investment":
            acc.totalInvestments += transaction.amount;
            break;
        }
        return acc;
      },
      {
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        totalInvestments: 0,
        netWorth: 0,
      }
    );

    stats.netWorth = stats.totalIncome - stats.totalExpenses + stats.totalSavings + stats.totalInvestments;
    return stats;
  }, [transactions]);

  return useMemo(
    () => ({
      transactions,
      wealthGoals,
      financialStats,
      isLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addWealthGoal,
      updateWealthGoal,
      deleteWealthGoal,
    }),
    [
      transactions,
      wealthGoals,
      financialStats,
      isLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addWealthGoal,
      updateWealthGoal,
      deleteWealthGoal,
    ]
  );
});
