"use client";

import { useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Transaction, Reminder, Vice, TabType, FinanceData } from "@/lib/types";
import { Sidebar } from "@/components/sidebar";
import { FinanceTab } from "@/components/tabs/finance-tab";
import { CalendarTab } from "@/components/tabs/calendar-tab";
import { RemindersTab } from "@/components/tabs/reminders-tab";
import { VicesTab } from "@/components/tabs/vices-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";

const INITIAL_FINANCE_DATA: FinanceData = {
  transactions: [],
  previousBalance: 0,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("inicio");

  const {
    value: financeData,
    setValue: setFinanceData,
    isLoaded: financeLoaded,
  } = useLocalStorage<FinanceData>("devfinance-data", INITIAL_FINANCE_DATA);

  const {
    value: reminders,
    setValue: setReminders,
    isLoaded: remindersLoaded,
  } = useLocalStorage<Reminder[]>("devfinance-reminders", []);

  const {
    value: vices,
    setValue: setVices,
    isLoaded: vicesLoaded,
  } = useLocalStorage<Vice[]>("devfinance-vices", []);

  // Finance handlers
  const handleAddTransaction = useCallback(
    (transaction: Transaction) => {
      setFinanceData((prev) => ({
        ...prev,
        transactions: [...prev.transactions, transaction],
      }));
    },
    [setFinanceData]
  );

  const handleRemoveTransaction = useCallback(
    (id: string) => {
      setFinanceData((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
    },
    [setFinanceData]
  );

  const handleUpdatePreviousBalance = useCallback(
    (value: number) => {
      setFinanceData((prev) => ({
        ...prev,
        previousBalance: value,
      }));
    },
    [setFinanceData]
  );

  // Reminder handlers
  const handleAddReminder = useCallback(
    (reminder: Reminder) => {
      setReminders((prev) => [...prev, reminder]);
    },
    [setReminders]
  );

  const handleRemoveReminder = useCallback(
    (id: string) => {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    },
    [setReminders]
  );

  const handleToggleReminder = useCallback(
    (id: string) => {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
      );
    },
    [setReminders]
  );

  // Vice handlers
  const handleAddVice = useCallback(
    (vice: Vice) => {
      setVices((prev) => [...prev, vice]);
    },
    [setVices]
  );

  const handleRemoveVice = useCallback(
    (id: string) => {
      setVices((prev) => prev.filter((v) => v.id !== id));
    },
    [setVices]
  );

  const handleResetVice = useCallback(
    (id: string) => {
      setVices((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, lastReset: new Date().toISOString() } : v
        )
      );
    },
    [setVices]
  );

  // Clear all data
  const handleClearAll = useCallback(() => {
    setFinanceData(INITIAL_FINANCE_DATA);
    setReminders([]);
    setVices([]);
  }, [setFinanceData, setReminders, setVices]);

  const isLoading = !financeLoaded || !remindersLoaded || !vicesLoaded;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 lg:ml-0 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
          {activeTab === "inicio" && (
            <FinanceTab
              transactions={financeData.transactions}
              previousBalance={financeData.previousBalance}
              onAddTransaction={handleAddTransaction}
              onRemoveTransaction={handleRemoveTransaction}
              onUpdatePreviousBalance={handleUpdatePreviousBalance}
            />
          )}

          {activeTab === "calendario" && (
            <CalendarTab transactions={financeData.transactions} />
          )}

          {activeTab === "lembretes" && (
            <RemindersTab
              reminders={reminders}
              onAddReminder={handleAddReminder}
              onRemoveReminder={handleRemoveReminder}
              onToggleReminder={handleToggleReminder}
            />
          )}

          {activeTab === "vicios" && (
            <VicesTab
              vices={vices}
              onAddVice={handleAddVice}
              onRemoveVice={handleRemoveVice}
              onResetVice={handleResetVice}
            />
          )}

          {activeTab === "ajustes" && (
            <SettingsTab onClearAll={handleClearAll} />
          )}
        </div>
      </main>
    </div>
  );
}
