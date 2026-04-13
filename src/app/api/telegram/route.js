import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// Send a message back to Telegram
async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

// Get file download URL from Telegram
async function getTelegramFileUrl(fileId) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const data = await res.json();
  if (!data.ok) throw new Error('Failed to get file from Telegram');
  const { file_path, file_size } = data.result;
  const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;
  return { url, file_size };
}

// Download file as ArrayBuffer
async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.status}`);
  return res.arrayBuffer();
}

// Upload video to TikTok using FILE_UPLOAD method
async function uploadToTikTok(accessToken, videoBuffer, videoSize, caption) {
  // Step 1: Initialize upload
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: caption || 'Posted via MyUploader',
        privacy_level: 'SELF_ONLY', // safe default — change to PUBLIC_TO_EVERYONE for production
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initRes.json();

  if (!initRes.ok || initData.error?.code !== 'ok') {
    throw new Error(`TikTok init failed: ${JSON.stringify(initData.error)}`);
  }

  const { upload_url, publish_id } = initData.data;

  // Step 2: Upload the video bytes
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
      'Content-Length': String(videoSize),
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    throw new Error(`TikTok video upload failed: ${uploadRes.status}`);
  }

  return publish_id;
}

// Handle incoming Telegram update
async function handleUpdate(update) {
  const msg = update.message || update.channel_post;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text = msg.text || '';

  // /start or /connect — send the TikTok connect link
  if (text === '/start' || text === '/connect') {
    await sendMessage(
      chatId,
      `👋 Welcome to MyUploader!\n\nClick the link below to connect your TikTok account:\n\n${BASE_URL}/connect?chat_id=${chatId}\n\nOnce connected, just send me any video and I'll upload it to TikTok automatically! 🎵`
    );
    return;
  }

  // /status — check if TikTok is connected
  if (text === '/status') {
    const { data } = await supabase
      .from('tiktok_tokens')
      .select('tiktok_open_id, updated_at')
      .eq('telegram_chat_id', chatId)
      .single();

    if (data) {
      await sendMessage(chatId, `✅ TikTok is connected!\nAccount ID: ${data.tiktok_open_id}\nLast updated: ${new Date(data.updated_at).toLocaleDateString()}`);
    } else {
      await sendMessage(chatId, `❌ No TikTok account connected.\n\nUse /connect to link your TikTok.`);
    }
    return;
  }

  // Detect video (video or document with video mime type)
  const video =
    msg.video ||
    (msg.document?.mime_type?.startsWith('video/') ? msg.document : null);

  if (!video) {
    // Ignore non-video messages silently (except commands handled above)
    if (text && !text.startsWith('/')) return;
    if (text.startsWith('/')) {
      await sendMessage(chatId, `Unknown command. Use:\n/connect — link your TikTok\n/status — check connection\n\nOr just send a video to upload it!`);
    }
    return;
  }

  // Check file size (Telegram limit is 20MB via bot API)
  if (video.file_size && video.file_size > 20 * 1024 * 1024) {
    await sendMessage(chatId, '⚠️ Video is too large. Please send a video under 20MB.');
    return;
  }

  // Look up TikTok token for this chat
  const { data: tokenRow } = await supabase
    .from('tiktok_tokens')
    .select('access_token')
    .eq('telegram_chat_id', chatId)
    .single();

  if (!tokenRow) {
    await sendMessage(
      chatId,
      `❌ No TikTok account connected yet.\n\nConnect here first:\n${BASE_URL}/connect?chat_id=${chatId}`
    );
    return;
  }

  await sendMessage(chatId, '⏳ Downloading your video...');

  try {
    // Get caption from message if any
    const caption = msg.caption || msg.video?.file_name || 'Posted via MyUploader';

    // Download video from Telegram
    const { url: fileUrl, file_size } = await getTelegramFileUrl(video.file_id);
    const videoBuffer = await downloadFile(fileUrl);
    const videoSize = file_size || videoBuffer.byteLength;

    await sendMessage(chatId, '⬆️ Uploading to TikTok...');

    const publishId = await uploadToTikTok(
      tokenRow.access_token,
      videoBuffer,
      videoSize,
      caption
    );

    await sendMessage(
      chatId,
      `✅ Video uploaded to TikTok!\n\nPublish ID: ${publishId}\n\nNote: The video will appear in your TikTok inbox — open TikTok to review and publish it.`
    );
  } catch (err) {
    console.error('Upload error:', err.message);
    await sendMessage(chatId, `❌ Upload failed: ${err.message}\n\nPlease try again or use /connect to re-link your TikTok.`);
  }
}

export async function POST(request) {
  try {
    const update = await request.json();
    await handleUpdate(update);
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }
  // Always return 200 to Telegram so it doesn't retry
  return NextResponse.json({ ok: true });
}
