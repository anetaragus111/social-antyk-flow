import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract book code from URL path (e.g., /r/000026)
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const bookCode = pathParts[pathParts.length - 1];

    if (!bookCode) {
      return new Response('Book code not provided', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find book by code
    const { data: book, error } = await supabase
      .from('books')
      .select('product_url')
      .eq('code', bookCode)
      .maybeSingle();

    if (error || !book?.product_url) {
      console.error('Book not found:', bookCode, error);
      return new Response('Book not found', { status: 404 });
    }

    // Redirect to product URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': book.product_url,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error in redirect function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
