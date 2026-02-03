"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Monitor, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTabProps {
  onClearAll: () => void;
}

export function SettingsTab({ onClearAll }: SettingsTabProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleClearAll = () => {
    if (
      confirm(
        "ATENCAO: Isso vai apagar TODOS os seus dados (financas, lembretes, vicios). Esta acao nao pode ser desfeita. Tem certeza?"
      )
    ) {
      onClearAll();
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Ajustes</h2>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aparencia</CardTitle>
          <CardDescription>
            Personalize a aparencia do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Tema</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Armazenamento</CardTitle>
          <CardDescription>
            Todos os dados sao salvos localmente no seu navegador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Monitor className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">LocalStorage</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Seus dados sao armazenados apenas neste dispositivo e navegador.
                Limpar os dados do navegador ou usar outro dispositivo resultara
                em perda dos dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">
              Zona de Perigo
            </CardTitle>
          </div>
          <CardDescription>
            Acoes irreversiveis que afetam seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <h4 className="font-medium text-foreground mb-2">
              Excluir todos os dados
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Remove permanentemente todas as transacoes, lembretes e vicios
              cadastrados. Esta acao nao pode ser desfeita.
            </p>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Tudo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">DevFinance Pro</span>{" "}
              - Versao 7.0
            </p>
            <p>
              Aplicativo de gerenciamento financeiro pessoal com controle de
              lembretes e vicios.
            </p>
            <p>Desenvolvido com Next.js, React e Tailwind CSS.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
