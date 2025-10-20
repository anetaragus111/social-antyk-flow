import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookData {
  code: string;
  title: string;
  image_url: string;
  stock_status: string;
  sale_price: number;
  product_url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting XML sync from sklep.antyk.org.pl');
    
    // Fetch XML from external source
    const xmlResponse = await fetch('https://sklep.antyk.org.pl/eksport/HX/meta.xml');
    if (!xmlResponse.ok) {
      throw new Error(`Failed to fetch XML: ${xmlResponse.statusText}`);
    }
    
    const xmlText = await xmlResponse.text();
    console.log('XML fetched successfully, length:', xmlText.length);
    
    // Parse XML to extract book data
    const books: BookData[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      const codeMatch = itemXml.match(/<g:id>(.*?)<\/g:id>/);
      const titleMatch = itemXml.match(/<g:title>(?:<!--\[CDATA\[)?(.*?)(?:\]\]-->)?<\/g:title>/);
      const imageMatch = itemXml.match(/<g:image_link>(?:<!--\[CDATA\[)?(.*?)(?:\]\]-->)?<\/g:image_link>/);
      const linkMatch = itemXml.match(/<g:link>(?:<!--\[CDATA\[)?(.*?)(?:\]\]-->)?<\/g:link>/);
      const availabilityMatch = itemXml.match(/<g:availability>(.*?)<\/g:availability>/);
      const priceMatch = itemXml.match(/<g:price>(.*?) PLN<\/g:price>/);
      
      if (codeMatch && titleMatch) {
        const title = titleMatch[1].trim();
        console.log(`Parsed XML title: "${title}"`);
        
        books.push({
          code: codeMatch[1],
          title: title,
          image_url: imageMatch ? imageMatch[1] : '',
          product_url: linkMatch ? linkMatch[1] : '',
          stock_status: availabilityMatch ? availabilityMatch[1] : 'unknown',
          sale_price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        });
      }
    }
    
    console.log(`Parsed ${books.length} books from XML`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all books from database
    const { data: dbBooks, error: fetchError } = await supabase
      .from('books')
      .select('id, code, title');
    
    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      throw fetchError;
    }
    
    console.log(`Found ${dbBooks?.length || 0} books in database`);
    
    // Helper functions to normalize and shorten titles
    const normalizeTitle = (title: string) => {
      return title
        .toLowerCase()
        .normalize('NFD') // split accents
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[-–—]/g, ' ') // unify dashes to space
        .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation, keep letters/digits
        .replace(/\s+/g, ' ') // normalize spaces
        .trim();
    };

    const shortTitle = (title: string) => {
      const t = title.split(/[:\-–—\(\[]/)[0]; // take part before colon/dash/paren/bracket
      return normalizeTitle(t);
    };
    
    console.log('Sample XML titles:', books.slice(0, 3).map(b => `"${b.title}"`));
    console.log('Sample DB titles:', dbBooks?.slice(0, 3).map(b => `"${b.title}"`));
    
    // Update each book by matching titles
    let updatedCount = 0;
    let notFoundCount = 0;
    let matchedPairs: string[] = [];
    
    for (const dbBook of dbBooks || []) {
      const normalizedDbTitle = normalizeTitle(dbBook.title);
      const normalizedDbShort = shortTitle(dbBook.title);
      console.log(`Looking for DB title: "${dbBook.title}" -> normalized: "${normalizedDbTitle}" | short: "${normalizedDbShort}"`);
      
      // 1) Exact match on full normalized title
      let xmlBook = books.find(b => normalizeTitle(b.title) === normalizedDbTitle);

      // 2) Exact match on short normalized title (before dash/colon)
      if (!xmlBook) {
        xmlBook = books.find(b => shortTitle(b.title) === normalizedDbShort);
      }

      // 3) Includes match (one contains the other)
      if (!xmlBook) {
        xmlBook = books.find(b => {
          const x = normalizeTitle(b.title);
          const xs = shortTitle(b.title);
          return x.includes(normalizedDbShort) || normalizedDbShort.includes(x) ||
                 xs.includes(normalizedDbShort) || normalizedDbShort.includes(xs) ||
                 x.includes(normalizedDbTitle) || normalizedDbTitle.includes(x);
        });
      }

      // 4) Fuzzy match by overlapping words (>= 50%, at least 2)
      if (!xmlBook) {
        const dbWords = normalizedDbShort.split(' ').filter(w => w.length > 2);
        xmlBook = books.find(b => {
          const xmlWords = shortTitle(b.title).split(' ').filter(w => w.length > 2);
          const matchingWords = dbWords.filter(word => xmlWords.some(xmlWord => xmlWord.includes(word) || word.includes(xmlWord)));
          const threshold = Math.max(2, Math.ceil(dbWords.length * 0.5));
          return matchingWords.length >= threshold;
        });
      }
      
      if (xmlBook) {
        const { error: updateError } = await supabase
          .from('books')
          .update({
            code: xmlBook.code,
            title: xmlBook.title,
            image_url: xmlBook.image_url,
            product_url: xmlBook.product_url,
            stock_status: xmlBook.stock_status,
            sale_price: xmlBook.sale_price,
          })
          .eq('id', dbBook.id);
        
        if (updateError) {
          console.error(`Error updating book "${dbBook.title}":`, updateError);
        } else {
          updatedCount++;
          matchedPairs.push(`"${dbBook.title}" -> "${xmlBook.title}"`);
          console.log(`✅ Matched: "${dbBook.title}" -> "${xmlBook.title}"`);
        }
      } else {
        notFoundCount++;
        console.log(`❌ No match for: "${dbBook.title}"`);
      }
    }
    
    console.log('=== SYNC SUMMARY ===');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Not found: ${notFoundCount}`);
    console.log('Sample matches:', matchedPairs.slice(0, 5));
    
    const result = {
      success: true,
      message: `Synchronizacja zakończona`,
      stats: {
        xmlBooksFound: books.length,
        dbBooksTotal: dbBooks?.length || 0,
        updated: updatedCount,
        notFoundInXml: notFoundCount,
      }
    };
    
    console.log('Sync completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Error in sync-books-from-xml:', error);
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
