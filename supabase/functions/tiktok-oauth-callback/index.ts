import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, codeVerifier, userId, redirectUri } = await req.json();
    
    console.log('TikTok OAuth callback received');
    console.log('User ID:', userId);
    console.log('Code:', code?.substring(0, 20) + '...');

    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    
    if (!clientKey || !clientSecret) {
      throw new Error('TikTok credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    
    if (tokenData.error) {
      console.error('TikTok token error:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const { access_token, refresh_token, open_id, scope, expires_in } = tokenData;

    if (!access_token || !open_id) {
      console.error('Missing token data:', tokenData);
      throw new Error('Invalid token response from TikTok');
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expires_in || 86400) * 1000).toISOString();

    // Store token in database using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Upsert token (update if exists, insert if not)
    const { error: dbError } = await supabase
      .from('tiktok_oauth_tokens')
      .upsert({
        user_id: userId,
        access_token,
        refresh_token,
        open_id,
        scope,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save TikTok token');
    }

    console.log('TikTok token saved successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true, open_id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('TikTok OAuth callback error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
