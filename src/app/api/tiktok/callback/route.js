import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // this is the telegram chat_id
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (error) {
    return NextResponse.redirect(`${baseUrl}/connect?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/connect?error=Missing+code+or+state`);
  }

  const chatId = state;

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/tiktok/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error('TikTok token error:', tokenData);
      return NextResponse.redirect(
        `${baseUrl}/connect?error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`
      );
    }

    const { access_token, refresh_token, open_id, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Save token to Supabase, upsert by telegram_chat_id
    const { error: dbError } = await supabase
      .from('tiktok_tokens')
      .upsert(
        {
          telegram_chat_id: parseInt(chatId),
          tiktok_open_id: open_id,
          access_token,
          refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_chat_id' }
      );

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.redirect(`${baseUrl}/connect?error=Database+error`);
    }

    // Notify the user on Telegram
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ TikTok connected successfully! Send me any video and I will upload it to your TikTok automatically.',
        }),
      }
    );

    return NextResponse.redirect(`${baseUrl}/connect?success=1`);
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${baseUrl}/connect?error=Server+error`);
  }
}
