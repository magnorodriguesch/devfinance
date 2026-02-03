"use client";

import { useState } from "react";
import { Reminder } from "@/lib/types";
import { generateId, formatDateBR } from "@/lib/finance-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, MapPin, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface RemindersTabProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Reminder) => void;
  onRemoveReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
}

export function RemindersTab({
  reminders,
  onAddReminder,
  onRemoveReminder,
  onToggleReminder,
}: RemindersTabProps) {
  const [newReminder, setNewReminder] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
  });

  const handleAdd = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) return;

    const reminder: Reminder = {
      id: generateId(),
      title: newReminder.title,
      date: newReminder.date,
      time: newReminder.time,
      location: newReminder.location || undefined,
      completed: false,
    };

    onAddReminder(reminder);
    setNewReminder({ title: "", date: "", time: "", location: "" });
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingReminders = sortedReminders.filter((r) => {
    const reminderDate = new Date(`${r.date}T${r.time}`);
    return reminderDate >= new Date() && !r.completed;
  });

  const pastReminders = sortedReminders.filter((r) => {
    const reminderDate = new Date(`${r.date}T${r.time}`);
    return reminderDate < new Date() || r.completed;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Lembretes</h2>

      {/* Add Reminder Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Novo Lembrete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Titulo do Evento</Label>
              <Input
                placeholder="Ex: Reuniao de trabalho"
                value={newReminder.title}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Horario</Label>
              <Input
                type="time"
                value={newReminder.time}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, time: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Local (opcional)</Label>
              <Input
                placeholder="Ex: Escritorio central"
                value={newReminder.location}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, location: e.target.value })
                }
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lembrete
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Proximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingReminders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum evento agendado
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border border-border transition-colors",
                    reminder.completed && "opacity-60"
                  )}
                >
                  <Checkbox
                    checked={reminder.completed}
                    onCheckedChange={() => onToggleReminder(reminder.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        reminder.completed && "line-through"
                      )}
                    >
                      {reminder.title}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateBR(reminder.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {reminder.time}
                      </span>
                      {reminder.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {reminder.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveReminder(reminder.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Past Reminders */}
      {pastReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              Eventos Passados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {pastReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border opacity-60"
                >
                  <Checkbox
                    checked={reminder.completed}
                    onCheckedChange={() => onToggleReminder(reminder.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        reminder.completed && "line-through"
                      )}
                    >
                      {reminder.title}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateBR(reminder.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {reminder.time}
                      </span>
                      {reminder.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {reminder.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveReminder(reminder.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
