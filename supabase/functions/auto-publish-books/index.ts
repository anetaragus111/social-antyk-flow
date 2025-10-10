import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Book {
  id: string;
  code: string;
  title: string;
  image_url: string | null;
  sale_price: number | null;
  promotional_price: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== Starting Auto-Publish Books Job ===');
    console.log('Current time:', new Date().toISOString());

    // Get books that are ready to be published
    const { data: booksToPublish, error: fetchError } = await supabase
      .from('books')
      .select('*')
      .eq('published', false)
      .eq('auto_publish_enabled', true)
      .lte('scheduled_publish_at', new Date().toISOString())
      .order('scheduled_publish_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${booksToPublish?.length || 0} books ready to publish`);

    if (!booksToPublish || booksToPublish.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No books scheduled for publication',
          published: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Publish each book
    for (const book of booksToPublish) {
      console.log(`Publishing book: ${book.title} (${book.code})`);
      
      try {
        // Call the publish-to-x function
        const { data, error: publishError } = await supabase.functions.invoke('publish-to-x', {
          body: { bookId: book.id }
        });

        if (publishError) {
          console.error(`Failed to publish book ${book.id}:`, publishError);
          results.push({
            bookId: book.id,
            title: book.title,
            success: false,
            error: publishError.message
          });
          failCount++;
        } else {
          console.log(`Successfully published book ${book.id}`);
          results.push({
            bookId: book.id,
            title: book.title,
            success: true
          });
          successCount++;
        }
      } catch (error: any) {
        console.error(`Error publishing book ${book.id}:`, error);
        results.push({
          bookId: book.id,
          title: book.title,
          success: false,
          error: error.message
        });
        failCount++;
      }
    }

    console.log(`=== Auto-Publish Complete ===`);
    console.log(`Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        published: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in auto-publish-books function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});