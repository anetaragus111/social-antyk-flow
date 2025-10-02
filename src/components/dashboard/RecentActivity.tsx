import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export const RecentActivity = () => {
  const activities = [
    {
      type: "info",
      message: "Witaj w SocialFlow! Połącz swoją bazę danych Supabase, aby rozpocząć.",
      time: "Przed chwilą",
      platform: "System"
    }
  ];

  return (
    <Card className="p-6 bg-gradient-card border-border/50 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Ostatnia aktywność</h2>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Na żywo
        </Badge>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm text-foreground">{activity.message}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">{activity.platform}</Badge>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
