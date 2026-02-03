import { Transaction, PeriodFilter } from "./types";

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: PeriodFilter
): Transaction[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startDate: Date;

  switch (period) {
    case "semanal":
      const dayOfWeek = startOfDay.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(startOfDay);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      break;
    case "quinzenal":
      startDate = new Date(startOfDay);
      startDate.setDate(startDate.getDate() - 14);
      break;
    case "mensal":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= now;
  });
}

export function calculateTotals(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}

export function getTransactionsByDate(
  transactions: Transaction[],
  date: string
): Transaction[] {
  return transactions.filter((t) => t.date === date);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDateBR(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
