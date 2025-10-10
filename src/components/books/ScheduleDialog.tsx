import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScheduleDialogProps {
  book: any;
  onScheduleChange: (bookId: string, scheduledAt: string | null, autoPublishEnabled: boolean) => void;
}

export const ScheduleDialog = ({ book, onScheduleChange }: ScheduleDialogProps) => {
  const [open, setOpen] = useState(false);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(book.auto_publish_enabled || false);
  const [scheduledDateTime, setScheduledDateTime] = useState(() => {
    if (book.scheduled_publish_at) {
      const date = new Date(book.scheduled_publish_at);
      return date.toISOString().slice(0, 16);
    }
    return "";
  });

  const handleSave = () => {
    const scheduledAt = scheduledDateTime && autoPublishEnabled ? new Date(scheduledDateTime).toISOString() : null;
    onScheduleChange(book.id, scheduledAt, autoPublishEnabled);
    setOpen(false);
  };

  const isScheduled = book.auto_publish_enabled && book.scheduled_publish_at;
  const scheduledDate = isScheduled ? new Date(book.scheduled_publish_at) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-1">
          {isScheduled ? (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {scheduledDate?.toLocaleString("pl-PL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              Ustaw
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Harmonogram publikacji</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-publish" className="text-sm font-medium">
              Automatyczna publikacja
            </Label>
            <Switch
              id="auto-publish"
              checked={autoPublishEnabled}
              onCheckedChange={setAutoPublishEnabled}
            />
          </div>

          {autoPublishEnabled && (
            <div className="space-y-2">
              <Label htmlFor="schedule-datetime" className="text-sm font-medium">
                Data i godzina publikacji
              </Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Książka zostanie automatycznie opublikowana o wybranej godzinie
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave}>Zapisz</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};