import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to fetch poultry price
  app.get("/api/poultry-price", async (req, res) => {
    try {
      const response = await fetch('https://www.biltafsil.com/poultry/chickens/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await response.text();
      
      // Attempt to find the price using a robust regex
      // Pattern: سعر الفراخ البيضاء اليوم هو [رقم] جنيه
      const match = html.match(/سعر الفراخ البيضاء اليوم هو\s*(\d+)/);
      
      if (match && match[1]) {
        res.json({ price: parseInt(match[1]) });
      } else {
        // Fallback or secondary search
        const secondaryMatch = html.match(/الفراخ البيضاء.*?(\d+)\s*جنيه/);
        if (secondaryMatch && secondaryMatch[1]) {
           res.json({ price: parseInt(secondaryMatch[1]) });
        } else {
          res.status(404).json({ error: "Price not found on page" });
        }
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
