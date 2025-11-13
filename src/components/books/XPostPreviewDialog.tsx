import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XPostPreview } from "./XPostPreview";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";

interface XPostPreviewDialogProps {
  book: Tables<"books"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const XPostPreviewDialog = ({
  book,
  open,
  onOpenChange,
}: XPostPreviewDialogProps) => {
  if (!book) return null;

  let tweetText = `✨ LIMITOWANA OFERTA ✨\n\n📚 ${book.title}\n\n`;
  
  if (book.sale_price) {
    tweetText += `💰 Tylko ${book.sale_price} zł\n\n`;
  }
  
  // Add truncated description if available
  if (book.description) {
    const maxDescLength = 120;
    const truncatedDesc = book.description.length > maxDescLength 
      ? book.description.substring(0, maxDescLength).trim() + '...'
      : book.description;
    tweetText += `${truncatedDesc}\n\n`;
  }
  
  tweetText += `🔥 Kup teraz:\n👉 ${book.product_url}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-background/95 backdrop-blur-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Podgląd posta na X
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Szablon wizualny
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-120px)] px-6 pb-6">
          <div className="flex justify-center py-4">
            <div className="space-y-4">
              <Card className="max-w-xl bg-card">
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-card-foreground">{tweetText}</pre>
                </CardContent>
              </Card>
              <XPostPreview book={book} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
