"use client";

import { useState } from "react";
import { Transaction, PeriodFilter } from "@/lib/types";
import {
  formatCurrency,
  filterTransactionsByPeriod,
  calculateTotals,
  generateId,
  formatDate,
  formatDateBR,
} from "@/lib/finance-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  X,
  Receipt,
  ShoppingBag,
  Sparkles,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceTabProps {
  transactions: Transaction[];
  previousBalance: number;
  onAddTransaction: (transaction: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  onUpdatePreviousBalance: (value: number) => void;
}

const categoryInfo = {
  fixas: { label: "Contas Fixas", icon: Receipt, color: "text-blue-500" },
  lazer: { label: "Lazer", icon: Sparkles, color: "text-yellow-500" },
  compras: { label: "Compras", icon: ShoppingBag, color: "text-purple-500" },
  extras: { label: "Ganhos Extras", icon: Banknote, color: "text-primary" },
  salario: { label: "Salario", icon: Wallet, color: "text-primary" },
};

export function FinanceTab({
  transactions,
  previousBalance,
  onAddTransaction,
  onRemoveTransaction,
  onUpdatePreviousBalance,
}: FinanceTabProps) {
  const [period, setPeriod] = useState<PeriodFilter>("mensal");
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "fixas" as Transaction["category"],
    installments: "",
  });

  const filteredTransactions = filterTransactionsByPeriod(transactions, period);
  const totals = calculateTotals(filteredTransactions);
  const totalWithPrevious = totals.balance + previousBalance;

  const handleAddTransaction = (type: "income" | "expense") => {
    if (!newTransaction.description || !newTransaction.amount) return;

    const transaction: Transaction = {
      id: generateId(),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      type,
      category: type === "income" ? "extras" : newTransaction.category,
      date: formatDate(new Date()),
      installments: newTransaction.installments
        ? parseInt(newTransaction.installments)
        : undefined,
    };

    onAddTransaction(transaction);
    setNewTransaction({
      description: "",
      amount: "",
      category: "fixas",
      installments: "",
    });
  };

  const groupedExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      },
      {} as Record<string, Transaction[]>
    );

  const incomeTransactions = filteredTransactions.filter(
    (t) => t.type === "income"
  );

  return (
    <div className="space-y-6">
      {/* Period Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Visao Geral</h2>
        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
          {(["mensal", "semanal", "quinzenal"] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
                period === p
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    totalWithPrevious >= 0 ? "text-primary" : "text-destructive"
                  )}
                >
                  {formatCurrency(totalWithPrevious)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {formatCurrency(totals.income + previousBalance)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saidas</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totals.expenses)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previous Balance Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">
              Saldo do mes anterior:
            </Label>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-muted-foreground">R$</span>
              <Input
                type="number"
                value={previousBalance || ""}
                onChange={(e) =>
                  onUpdatePreviousBalance(parseFloat(e.target.value) || 0)
                }
                placeholder="0,00"
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nova Transacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Input
                placeholder="Ex: Aluguel"
                value={newTransaction.description}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={newTransaction.amount}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    amount: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={newTransaction.category}
                onValueChange={(v: Transaction["category"]) =>
                  setNewTransaction({ ...newTransaction, category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixas">Contas Fixas</SelectItem>
                  <SelectItem value="lazer">Lazer</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Parcelas (opcional)</Label>
              <Input
                type="number"
                placeholder="Meses"
                value={newTransaction.installments}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    installments: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleAddTransaction("expense")}
              variant="destructive"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Despesa
            </Button>
            <Button
              onClick={() => handleAddTransaction("income")}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Receita
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        {(["fixas", "lazer", "compras"] as const).map((cat) => {
          const items = groupedExpenses[cat] || [];
          const total = items.reduce((sum, t) => sum + t.amount, 0);
          const info = categoryInfo[cat];
          const Icon = info.icon;

          return (
            <Card key={cat}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", info.color)} />
                    <CardTitle className="text-base">{info.label}</CardTitle>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma transacao
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {items.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.description}
                            {t.installments && (
                              <span className="text-muted-foreground ml-1">
                                ({t.installments}x)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateBR(t.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-destructive">
                            {formatCurrency(t.amount)}
                          </span>
                          <button
                            onClick={() => onRemoveTransaction(t.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Income */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Ganhos Extras</CardTitle>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {formatCurrency(
                  incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
                )}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {incomeTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma transacao
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {incomeTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBR(t.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => onRemoveTransaction(t.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
