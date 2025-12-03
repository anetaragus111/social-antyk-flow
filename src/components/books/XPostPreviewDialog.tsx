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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, FileText } from "lucide-react";

interface XPostPreviewDialogProps {
  book: Tables<"books"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiGeneratedText?: string | null;
}

export const XPostPreviewDialog = ({
  book,
  open,
  onOpenChange,
  aiGeneratedText,
}: XPostPreviewDialogProps) => {
  if (!book) return null;

  // Default template text (used when no AI text)
  let templateText = `✨ LIMITOWANA OFERTA ✨\n\n📚 ${book.title}\n\n`;
  
  if (book.sale_price) {
    templateText += `💰 Tylko ${book.sale_price} zł\n\n`;
  }
  
  if (book.description) {
    const maxDescLength = 120;
    const truncatedDesc = book.description.length > maxDescLength 
      ? book.description.substring(0, maxDescLength).trim() + '...'
      : book.description;
    templateText += `${truncatedDesc}\n\n`;
  }
  
  templateText += `🔥 Kup teraz:\n👉 ${book.product_url}`;

  const displayText = aiGeneratedText || templateText;
  const isAiText = !!aiGeneratedText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-background/95 backdrop-blur-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Podgląd posta na X
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isAiText ? "Tekst wygenerowany przez AI" : "Domyślny szablon"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-120px)] px-6 pb-6 [&>div>div[style]]:!block [&_[data-radix-scroll-area-scrollbar]]:bg-muted [&_[data-radix-scroll-area-thumb]]:bg-primary/60">
          <div className="py-4 space-y-6">
            {/* Main text section */}
            <Card className="bg-card border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {isAiText ? (
                    <>
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-primary">Tekst AI</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Szablon domyślny</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans text-card-foreground text-base leading-relaxed">
                  {displayText}
                </pre>
              </CardContent>
            </Card>
            
            {/* Book card preview */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Podgląd karty książki</h4>
              <div className="flex justify-center">
                <XPostPreview book={book} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
