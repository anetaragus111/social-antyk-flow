import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { PlatformConnectionStatus } from "@/components/platforms/PlatformConnectionStatus";
import { PlatformStats } from "@/components/platforms/PlatformStats";
import { PlatformAnalytics } from "@/components/platforms/PlatformAnalytics";
import { PlatformBooksList } from "@/components/platforms/PlatformBooksList";

const PlatformGab = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-700/20 to-green-800/20 rounded-lg">
              <MessageCircle className="h-8 w-8 text-green-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent">
                Gab
              </h1>
              <p className="text-muted-foreground">
                Zarządzaj publikacjami na Gab
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              Powrót
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlatformConnectionStatus platform="gab" />
          <PlatformStats platform="gab" />
        </div>

        <PlatformAnalytics platform="gab" />

        <PlatformBooksList
          platform="gab"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
    </div>
  );
};

export default PlatformGab;
