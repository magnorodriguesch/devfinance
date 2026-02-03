"use client";

import { TabType } from "@/lib/types";
import {
  Home,
  Calendar,
  Bell,
  Target,
  Settings,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "inicio", label: "Inicio", icon: <Home className="h-5 w-5" /> },
  { id: "calendario", label: "Calendario", icon: <Calendar className="h-5 w-5" /> },
  { id: "lembretes", label: "Lembretes", icon: <Bell className="h-5 w-5" /> },
  { id: "vicios", label: "Vicios", icon: <Target className="h-5 w-5" /> },
  { id: "ajustes", label: "Ajustes", icon: <Settings className="h-5 w-5" /> },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card min-h-screen">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">DevFinance</h1>
              <p className="text-xs text-muted-foreground">Pro</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Dados salvos localmente
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <ul className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  activeTab === item.id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
