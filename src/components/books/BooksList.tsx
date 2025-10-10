import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const BooksList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  
  const { data: books, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ bookId, bookIds }: { bookId?: string; bookIds?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('publish-to-x', {
        body: { bookId, bookIds }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      
      const { summary } = data;
      if (summary.successful > 0) {
        toast({
          title: "Opublikowano pomyślnie",
          description: `${summary.successful} książek opublikowano na X`,
        });
      }
      if (summary.failed > 0) {
        toast({
          title: "Błąd publikacji",
          description: `${summary.failed} książek nie udało się opublikować`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Publish error:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się opublikować",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPublishingIds(new Set());
    }
  });

  const handlePublishSingle = async (bookId: string) => {
    setPublishingIds(prev => new Set(prev).add(bookId));
    publishMutation.mutate({ bookId });
  };

  const handlePublishAll = async () => {
    const unpublishedBooks = books?.filter(book => !book.published) || [];
    if (unpublishedBooks.length === 0) {
      toast({
        title: "Brak książek",
        description: "Wszystkie książki są już opublikowane",
      });
      return;
    }
    
    const bookIds = unpublishedBooks.map(book => book.id);
    setPublishingIds(new Set(bookIds));
    publishMutation.mutate({ bookIds });
  };

  const unpublishedCount = books?.filter(book => !book.published).length || 0;


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lista książek</CardTitle>
        {unpublishedCount > 0 && (
          <Button 
            onClick={handlePublishAll}
            disabled={publishMutation.isPending}
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" />
            Opublikuj wszystkie ({unpublishedCount})
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cena</TableHead>
                  <TableHead>Publikacja</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books && books.length > 0 ? (
                  books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.code}</TableCell>
                      <TableCell className="max-w-md truncate">{book.title}</TableCell>
                      <TableCell>{book.stock_status || "-"}</TableCell>
                      <TableCell>
                        {book.sale_price ? `${book.sale_price} zł` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={book.published ? "default" : "secondary"}>
                          {book.published ? "Opublikowano" : "Nieopublikowano"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!book.published && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublishSingle(book.id)}
                            disabled={publishingIds.has(book.id)}
                          >
                            {publishingIds.has(book.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Opublikuj
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Brak książek w bazie
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
