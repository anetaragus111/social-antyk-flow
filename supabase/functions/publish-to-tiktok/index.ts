import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(supabase: any, userId: string, refreshToken: string): Promise<string> {
  const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')!;
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')!;

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }

  // Update token in database
  await supabase
    .from('tiktok_oauth_tokens')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, imageUrl, videoUrl, userId } = await req.json();
    
    console.log('Publish to TikTok request received');
    console.log('User ID:', userId);
    console.log('Has image:', !!imageUrl);
    console.log('Has video:', !!videoUrl);

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!imageUrl && !videoUrl) {
      throw new Error('TikTok requires either an image or video');
    }

    // Get TikTok token from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: tokenData, error: tokenError } = await supabase
      .from('tiktok_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error('Token fetch error:', tokenError);
      throw new Error('TikTok not connected for this user');
    }

    let accessToken = tokenData.access_token;
    const openId = tokenData.open_id;

    // Check if token is expired and refresh if needed
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.log('Token expired, refreshing...');
      if (!tokenData.refresh_token) {
        throw new Error('Token expired and no refresh token available');
      }
      accessToken = await refreshAccessToken(supabase, userId, tokenData.refresh_token);
    }

    // Determine if we're posting a video or photo
    const isVideo = !!videoUrl;
    const mediaUrl = videoUrl || imageUrl;

    console.log('Publishing', isVideo ? 'video' : 'photo', 'to TikTok');

    // Step 1: Initialize upload
    const initEndpoint = isVideo 
      ? 'https://open.tiktokapis.com/v2/post/publish/video/init/'
      : 'https://open.tiktokapis.com/v2/post/publish/content/init/';

    const initBody = isVideo ? {
      post_info: {
        title: text?.substring(0, 150) || 'New post',
        privacy_level: 'SELF_ONLY', // Start with private until app approval
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: mediaUrl,
      }
    } : {
      post_info: {
        title: text?.substring(0, 150) || 'New post',
        privacy_level: 'SELF_ONLY',
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_cover_index: 0,
        photo_images: [mediaUrl],
      },
      post_mode: 'DIRECT_POST',
      media_type: 'PHOTO',
    };

    const initResponse = await fetch(initEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(initBody),
    });

    const initData = await initResponse.json();
    console.log('TikTok init response:', initData);

    if (initData.error?.code) {
      throw new Error(`TikTok error: ${initData.error.message || initData.error.code}`);
    }

    const publishId = initData.data?.publish_id;
    
    if (!publishId) {
      console.log('Full init response:', JSON.stringify(initData, null, 2));
      throw new Error('Failed to get publish ID from TikTok');
    }

    console.log('TikTok publish initiated, publish_id:', publishId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        publishId,
        message: 'Content submitted to TikTok for processing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Publish to TikTok error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
