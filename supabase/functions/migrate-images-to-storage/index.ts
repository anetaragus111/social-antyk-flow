import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Book {
  id: string;
  title: string;
  image_url: string | null;
  storage_path: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting migration of book images to storage...');
    
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all books that have image_url but no storage_path
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, title, image_url, storage_path')
      .not('image_url', 'is', null)
      .is('storage_path', null);

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${books?.length || 0} books to migrate`);

    if (!books || books.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No books to migrate',
          stats: { total: 0, succeeded: 0, failed: 0 }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const results = {
      total: books.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each book
    for (const book of books as Book[]) {
      try {
        console.log(`Processing book: ${book.title} (${book.id})`);
        
        if (!book.image_url) {
          console.log('No image_url, skipping...');
          continue;
        }

        // Download the image
        console.log(`Downloading image from: ${book.image_url}`);
        const imageResponse = await fetch(book.image_url);
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.statusText}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        console.log(`Downloaded image: ${imageBuffer.byteLength} bytes, type: ${contentType}`);

        // Generate filename from book ID and original URL
        const urlParts = book.image_url.split('/');
        const originalFilename = urlParts[urlParts.length - 1];
        const extension = originalFilename.split('.').pop() || 'jpg';
        const filename = `${book.id}.${extension}`;
        const storagePath = `books/${filename}`;

        // Upload to storage
        console.log(`Uploading to storage: ${storagePath}`);
        const { error: uploadError } = await supabase.storage
          .from('ObrazkiKsiazek')
          .upload(storagePath, imageBuffer, {
            contentType: contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${book.title}:`, uploadError);
          throw uploadError;
        }

        console.log(`Successfully uploaded to storage: ${storagePath}`);

        // Update book record with storage_path
        const { error: updateError } = await supabase
          .from('books')
          .update({ storage_path: storagePath })
          .eq('id', book.id);

        if (updateError) {
          console.error(`Update error for ${book.title}:`, updateError);
          throw updateError;
        }

        console.log(`Successfully updated book record with storage_path`);
        results.succeeded++;

      } catch (error) {
        console.error(`Error processing book ${book.title}:`, error);
        results.failed++;
        results.errors.push(
          `${book.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    console.log('Migration completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migracja zakończona: ${results.succeeded} sukces, ${results.failed} błędów`,
        stats: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in migrate-images-to-storage:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
