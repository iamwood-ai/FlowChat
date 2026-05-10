import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Pull platform from query or params (Vercel rewrite maps :platform to query)
  const platform = req.query.platform as string;
  
  // Use origin header if available, otherwise fallback
  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000');
  const redirectUri = `${origin}/auth/callback`;

  let authUrl = "";
  
  if (platform === "facebook") {
    const clientId = process.env.FB_CLIENT_ID || "PASTE_YOUR_FB_CLIENT_ID_HERE";
    authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=pages_messaging,pages_read_engagement,pages_show_list&response_type=code`;
  } else if (platform === "instagram") {
    const clientId = process.env.IG_CLIENT_ID || "PASTE_YOUR_IG_CLIENT_ID_HERE";
    authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=instagram_basic,instagram_manage_messages&response_type=code`;
  } else {
    // Mock URLs for other platforms for demo purposes
    authUrl = `/auth/callback?platform=${platform}&code=demo_code_${Math.random().toString(36).substring(7)}`;
  }

  res.status(200).json({ url: authUrl });
}
