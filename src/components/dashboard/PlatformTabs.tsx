import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getAllPlatforms, PlatformId } from "@/config/platforms";

interface PlatformTabsProps {
  selectedPlatform: PlatformId;
  onPlatformChange: (platform: PlatformId) => void;
}

export const PlatformTabs = ({ selectedPlatform, onPlatformChange }: PlatformTabsProps) => {
  const platforms = getAllPlatforms();

  return (
    <Tabs value={selectedPlatform} onValueChange={(value) => onPlatformChange(value as PlatformId)} className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList className="inline-flex h-auto bg-muted/50 gap-1 p-1">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3 px-4"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{platform.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
};
