import { NextResponse } from 'next/server';

// Farcaster Frame metadata
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tethradex.vercel.app';

// Generate frame HTML with meta tags
function generateFrameHTML() {
  const imageUrl = `${APP_URL}/api/frame/image?view=main`;
  const postUrl = `${APP_URL}/api/frame`;

  // Simple frame - all buttons link directly to app
  const buttons = [
    { label: '🚀 Launch App', action: 'link', target: `${APP_URL}/trade` },
    { label: '💰 Claim USDC', action: 'link', target: `${APP_URL}/trade` },
    { label: '📊 View Charts', action: 'link', target: `${APP_URL}/trade` },
    { label: 'ℹ️ About', action: 'link', target: `${APP_URL}` },
  ];

  // Generate meta tags untuk Farcaster Frame
  const metaTags = [
    `<meta property="fc:frame" content="vNext" />`,
    `<meta property="fc:frame:image" content="${imageUrl}" />`,
    `<meta property="fc:frame:image:aspect_ratio" content="1.91:1" />`,
    `<meta property="fc:frame:post_url" content="${postUrl}" />`,
    `<meta name="fc:frame" content="vNext" />`,
  ];

  // Add button meta tags (max 4 buttons)
  buttons.slice(0, 4).forEach((button, index) => {
    metaTags.push(`<meta property="fc:frame:button:${index + 1}" content="${button.label}" />`);
    if (button.action) {
      metaTags.push(`<meta property="fc:frame:button:${index + 1}:action" content="${button.action}" />`);
    }
    if (button.target) {
      metaTags.push(`<meta property="fc:frame:button:${index + 1}:target" content="${button.target}" />`);
    }
  });

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TethraDEX - Decentralized Trading Platform</title>

    <!-- Open Graph -->
    <meta property="og:title" content="TethraDEX - Trade Crypto with Ease" />
    <meta property="og:description" content="Professional trading platform with advanced charting and instant USDC claiming" />
    <meta property="og:image" content="${APP_URL}/api/frame/image?view=main" />

    <!-- Farcaster Frame Meta Tags -->
    ${metaTags.join('\n    ')}
  </head>
  <body>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0B1017; color: white; font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #60a5fa;">
        TethraDEX
      </h1>
      <p style="font-size: 1.2rem; color: #94a3b8; margin-bottom: 2rem; text-align: center; max-width: 600px;">
        Professional decentralized trading platform with advanced charting, instant wallet connection, and USDC faucet
      </p>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
        <a href="${APP_URL}/trade" style="padding: 12px 24px; background: #3b82f6; border-radius: 8px; text-decoration: none; color: white; font-weight: 600;">
          🚀 Launch App
        </a>
        <a href="${APP_URL}" style="padding: 12px 24px; background: #64748b; border-radius: 8px; text-decoration: none; color: white; font-weight: 600;">
          ℹ️ About
        </a>
      </div>
    </div>
  </body>
</html>
  `;
}

// GET handler - Initial frame load
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'initial';

  const html = generateFrameHTML(state);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'max-age=10',
    },
  });
}

// POST handler - Frame interactions (not needed for simple frame, but keeping for compatibility)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Frame interaction:', body);

    // Always return same frame since all buttons are links
    const html = generateFrameHTML();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=10',
      },
    });
  } catch (error) {
    console.error('Frame POST error:', error);

    // Return fallback frame on error
    const html = generateFrameHTML();
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
