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
      const sources = [
        'https://www.biltafsil.com/poultry/',
        'https://misr365.com/price/chickens-price-today/',
        'https://www.elwatannews.com/category/37',
        'https://www.masrawy.com/news/news_economy/',
        'https://www.cairo24.com/section/167/Economy',
        'https://vetogate.com/section/168/Economy',
        'https://sarery.com/bourse-poultry/',
        'https://www.elbalad.news/category/168'
      ];
      
      const patterns = [
        /البيضاء اليوم.*?>\s*(\d+)/,
        /سعر الفراخ البيضاء اليوم.*?>\s*(\d+)/,
        /الفراخ البيضاء [^<]{0,50} (\d+)/i,
        /اللحم الأبيض [^<]{0,50} (\d+)/i,
        /سعر كيلو الفراخ البيضاء المعلن (\d+)/,
        /البيضاء\s*:\s*(\d+)/,
        /(\d+)\s*جنيه\s*<\/td>/,
        /(\d+)\s*<\/span>\s*جنيه/,
        /بلغ سعر.*?(\d+)\s*جنيه/,
        /<td>(\d+)<\/td>\s*<td>لحم فني/,
        /"price":\s*"?(\d+)"?/,
        /value">(\d+)<\/span>/,
        /الفراخ البيضاء <\/td>\s*<td>(\d+)/, // Specific for table structures
        /(\d+)\s*جنيه/ 
      ];

      let price: number | null = null;
      let sourceUsed = "";
      let matchedPatternIndex = -1;

      for (const url of sources) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache',
              'Referer': 'https://www.google.com/'
            },
            signal: AbortSignal.timeout(20000)
          });
          
          if (response.ok) {
            const html = await response.text();
            
            for (let i = 0; i < patterns.length; i++) {
              const match = html.match(patterns[i]);
              if (match && match[1]) {
                const parsed = parseInt(match[1]);
                // Poultry prices in EGP for farmgate are typically 65-120 range now.
                // Sanity range between 50 and 150.
                if (parsed >= 50 && parsed <= 150) { 
                  price = parsed;
                  sourceUsed = url;
                  matchedPatternIndex = i;
                  break;
                }
              }
            }
          } else {
            console.warn(`Source ${url} returned status: ${response.status}`);
          }
          if (price) break;
        } catch (e) {
          console.warn(`Attempt failed for ${url}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      if (price) {
        console.log(`Successfully fetched price: ${price} from ${sourceUsed} using pattern ${matchedPatternIndex}`);
        res.json({ price, source: sourceUsed });
      } else {
        res.status(404).json({ error: "Price not found on page", sourcesAttempted: sources.length });
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
