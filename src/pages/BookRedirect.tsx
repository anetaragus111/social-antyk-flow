import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";

export default function BookRedirect() {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const redirectToBook = async () => {
      if (!id) return;

      // Try to find book by code first (short URL), fallback to UUID
      const { data: book } = await supabase
        .from("books")
        .select("product_url")
        .or(`code.eq.${id},id.eq.${id}`)
        .maybeSingle();

      if (book?.product_url) {
        window.location.href = book.product_url;
      }
    };

    redirectToBook();
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Przekierowywanie do księgarni...</p>
      </div>
    </div>
  );
}
