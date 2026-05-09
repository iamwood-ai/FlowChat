import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

// --- Platforms Mock Data ---
const MOCK_POSTS = [
  { id: '1', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop', caption: 'Summer Vibes ☀️ #holidays' },
  { id: '2', type: 'reel', thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100&h=100&fit=crop', caption: 'How to build flows in 60s 🚀' },
  { id: '3', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop', caption: 'New features alert! ⚡️' },
];

// API Route: Get OAuth URL
app.get("/api/auth/:platform/url", (req, res) => {
  const { platform } = req.params;
  const origin = req.headers.origin || "http://localhost:3000";
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

  res.json({ url: authUrl });
});

// API Route: Get IG Posts (Mock)
app.get("/api/instagram/posts", (req, res) => {
  res.json({ posts: MOCK_POSTS });
});

/**
 * WEBHOOK VERIFICATION (GET)
 * Meta sends a GET request to verify your endpoint when you set it up
 */
app.get("/api/webhooks/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook Verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * WEBHOOK LISTENER (POST)
 * This is where Meta/TikTok sends notifications when a comment/DM happens
 */
app.post("/api/webhooks/instagram", async (req, res) => {
  const data = req.body;
  
  // 1. Verify the signature (Security)
  // 2. Identify the user/post
  // 3. Find the matching Flow in Firestore
  // 4. Trigger the first "Message" node
  
  console.log("Received IG Webhook:", data);
  res.status(200).send("EVENT_RECEIVED");
});

// OAuth Callback Handler
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  const { code } = req.query;
  
  // In a real app, you would exchange the code for an access token here.
  // For this demo, we'll just send a success message to the parent window.
  
  res.send(`
    <html>
      <head>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; }
          .card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          h1 { color: #059669; margin-bottom: 0.5rem; }
          p { color: #6b7280; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Success!</h1>
          <p>Your account has been connected securely. You can close this window now.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: '${code}' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  };
  startVite();
} else {
  // Production static file serving
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // SPA Fallback for production
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
