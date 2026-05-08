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
    // In production, these would be real OAuth redirect URLs
    authUrl = `/auth/callback?platform=${platform}&code=demo_code_${Math.random().toString(36).substring(7)}`;
  }

  res.json({ url: authUrl });
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

export default app;

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
} else if (!process.env.VERCEL) {
  // Only serve static files via Express if NOT on Vercel
  // Vercel handles static file serving automatically from the 'dist' directory
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = 3000;
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
