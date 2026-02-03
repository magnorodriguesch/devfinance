"use client";

import { useState, useMemo } from "react";
import { Transaction } from "@/lib/types";
import { formatCurrency, getTransactionsByDate, formatDateBR } from "@/lib/finance-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarTabProps {
  transactions: Transaction[];
}

export function CalendarTab({ transactions }: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      result.push(null);
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      result.push(day);
    }
    
    return result;
  }, [daysInMonth, firstDayOfMonth]);

  const getDateString = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split("T")[0];
  };

  const getTransactionsForDay = (day: number) => {
    const dateStr = getDateString(day);
    return getTransactionsByDate(transactions, dateStr);
  };

  const getDayTotal = (day: number) => {
    const dayTransactions = getTransactionsForDay(day);
    return dayTransactions.reduce((sum, t) => {
      return sum + (t.type === "expense" ? -t.amount : t.amount);
    }, 0);
  };

  const selectedTransactions = selectedDate
    ? getTransactionsByDate(transactions, selectedDate)
    : [];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Calendario</h2>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg capitalize">{monthName}</CardTitle>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = getDateString(day);
              const dayTransactions = getTransactionsForDay(day);
              const hasTransactions = dayTransactions.length > 0;
              const isSelected = selectedDate === dateStr;
              const isToday =
                new Date().toISOString().split("T")[0] === dateStr;
              const dayTotal = getDayTotal(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative p-1",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "hover:bg-accent",
                    hasTransactions && !isSelected && "font-medium"
                  )}
                >
                  <span>{day}</span>
                  {hasTransactions && (
                    <span
                      className={cn(
                        "text-[10px] leading-none mt-0.5",
                        isSelected
                          ? "text-primary-foreground/80"
                          : dayTotal >= 0
                            ? "text-primary"
                            : "text-destructive"
                      )}
                    >
                      {dayTotal >= 0 ? "+" : ""}
                      {formatCurrency(dayTotal).replace("R$", "").trim()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Transacoes de {formatDateBR(selectedDate)}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma transacao neste dia
              </p>
            ) : (
              <ul className="space-y-3">
                {selectedTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {t.category}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        t.type === "income" ? "text-primary" : "text-destructive"
                      )}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
