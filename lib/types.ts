export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: "fixas" | "lazer" | "compras" | "extras" | "salario";
  date: string;
  installments?: number;
}

export interface FinanceData {
  transactions: Transaction[];
  previousBalance: number;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  completed: boolean;
}

export interface Vice {
  id: string;
  name: string;
  startDate: string;
  lastReset: string;
}

export type TabType = "inicio" | "calendario" | "lembretes" | "vicios" | "ajustes";

export type PeriodFilter = "mensal" | "semanal" | "quinzenal";
