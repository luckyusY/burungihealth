import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chat_id');

  if (!chatId) {
    return NextResponse.json({ error: 'Missing chat_id' }, { status: 400 });
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tiktok/callback`;
  const scope = 'user.info.basic,video.upload';

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    scope,
    redirect_uri: redirectUri,
    state: chatId, // we use state to carry chat_id through OAuth
  });

  const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

  return NextResponse.redirect(tiktokAuthUrl);
}
