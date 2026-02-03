"use client";

import { useState, useEffect } from "react";
import { Vice } from "@/lib/types";
import { generateId } from "@/lib/finance-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, RotateCcw, Trash2, Target, Trophy } from "lucide-react";

interface VicesTabProps {
  vices: Vice[];
  onAddVice: (vice: Vice) => void;
  onRemoveVice: (id: string) => void;
  onResetVice: (id: string) => void;
}

interface TimeDiff {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeSince(dateString: string): TimeDiff {
  const start = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
}

function ViceTimer({ lastReset }: { lastReset: string }) {
  const [time, setTime] = useState<TimeDiff>(calculateTimeSince(lastReset));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(calculateTimeSince(lastReset));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastReset]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-secondary rounded-lg p-3">
        <p className="text-2xl font-bold text-foreground">{time.days}</p>
        <p className="text-xs text-muted-foreground">Dias</p>
      </div>
      <div className="bg-secondary rounded-lg p-3">
        <p className="text-2xl font-bold text-foreground">
          {time.hours.toString().padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground">Horas</p>
      </div>
      <div className="bg-secondary rounded-lg p-3">
        <p className="text-2xl font-bold text-foreground">
          {time.minutes.toString().padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground">Min</p>
      </div>
      <div className="bg-secondary rounded-lg p-3">
        <p className="text-2xl font-bold text-foreground">
          {time.seconds.toString().padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground">Seg</p>
      </div>
    </div>
  );
}

export function VicesTab({
  vices,
  onAddVice,
  onRemoveVice,
  onResetVice,
}: VicesTabProps) {
  const [newViceName, setNewViceName] = useState("");

  const handleAdd = () => {
    if (!newViceName.trim()) return;

    const now = new Date().toISOString();
    const vice: Vice = {
      id: generateId(),
      name: newViceName.trim(),
      startDate: now,
      lastReset: now,
    };

    onAddVice(vice);
    setNewViceName("");
  };

  const handleReset = (id: string) => {
    if (
      confirm(
        "Tem certeza que deseja resetar o contador? Isso significa que voce recaiu."
      )
    ) {
      onResetVice(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Controle de Vicios</h2>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Acompanhe seu progresso
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre um vicio que deseja abandonar e acompanhe quanto tempo
                voce esta livre dele. O contador mostra o tempo desde o ultimo
                reset.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Vice Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Novo Vicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Vicio</Label>
            <Input
              placeholder="Ex: Cigarro, Acucar, Redes sociais..."
              value={newViceName}
              onChange={(e) => setNewViceName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Vicio
          </Button>
        </CardContent>
      </Card>

      {/* Vices List */}
      {vices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Nenhum vicio cadastrado
              </h3>
              <p className="text-sm text-muted-foreground">
                Adicione um vicio acima para comecar a acompanhar seu progresso
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vices.map((vice) => (
            <Card key={vice.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{vice.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveVice(vice.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ViceTimer lastReset={vice.lastReset} />
                <Button
                  variant="outline"
                  onClick={() => handleReset(vice.id)}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar Contador (Recai)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
