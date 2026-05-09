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
        'https://www.biltafsil.com/poultry/chickens/',
        'https://misr365.com/price/chickens-price-today/',
        'https://sarery.com/bourse-poultry/',
        'https://www.elwatannews.com/category/37',
        'https://www.masrawy.com/news/news_economy/',
        'https://www.cairo24.com/section/167/Economy',
        'https://vetogate.com/section/168/Economy',
        'https://www.elbalad.news/category/168'
      ];
      
      const patterns = [
        /البيضاء.*?<td>(\d+)/i,
        /اللحم الأبيض.*?<td>(\d+)/i,
        /البيضاء اليوم.*?(\d+)/,
        /سعر الفراخ البيضاء اليوم.*?(\d+)/,
        /لحم الفراخ البيضاء\s*<\/td>\s*<td>\s*(\d+)/i,
        /الفراخ البيضاء\s*<\/td>\s*<td>\s*(\d+)/i,
        /اللحم الأبيض\s*<\/td>\s*<td>\s*(\d+)/i,
        /الفراخ البيضاء\s*:\s*(\d+)/,
        /البيضاء\s*:\s*(\d+)/,
        /الفراخ البيضاء [^<]{0,100}? (\d+)/i,
        /(\d+)\s*جنيه\s*<\/td>/,
        /(\d+)\s*<\/span>\s*جنيه/,
        /بلغ سعر.*?(\d+)\s*جنيه/,
        /<td>(\d+)<\/td>\s*<td>لحم فني/,
        /"price":\s*"?(\d+)"?/,
        /value">(\d+)<\/span>/,
        /(\d+)\s*جنيه/ 
      ];

      let price: number | null = null;
      let sourceUsed = "";
      let matchedPatternIndex = -1;

      for (const url of sources) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
              'Cache-Control': 'no-cache',
              'Referer': 'https://www.google.com/'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (response.ok) {
            const html = await response.text();
            
            for (let i = 0; i < patterns.length; i++) {
              const match = html.match(patterns[i]);
              if (match && match[1]) {
                const parsed = parseInt(match[1]);
                if (parsed >= 50 && parsed <= 150) { 
                  price = parsed;
                  sourceUsed = url;
                  matchedPatternIndex = i;
                  break;
                }
              }
            }
          }
          if (price) break;
        } catch (e) {
          console.warn(`Poultry fetch failed for ${url}`);
        }
      }

      if (price) {
        res.json({ price, source: sourceUsed });
      } else {
        res.status(404).json({ error: "Poultry price not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API Route to fetch gold price (Egypt focus)
  app.get("/api/gold-price", async (req, res) => {
    try {
      const sources = [
        'https://isagha.com/ar/gold-prices/egypt',
        'https://isagha.com/en/gold-prices/egypt',
        'https://isagha.com/ar/',
        'https://isagha.com/',
        'https://goldpricesegypt.com/',
        'https://www.goldpricesegypt.com/',
        'https://misr365.com/price/gold-price-today/'
      ];

      // Patterns for 21k gold in Egypt (most common)
      const patterns21k = [
        /عيار 21.*?(\d{3,4})/,
        /21k.*?(\d{3,4})/,
        /Gold 21K.*?(\d{4})/,
        /<span>21<\/span>.*?<span>(\d{4})<\/span>/,
        /سعر عيار 21 اليوم\s*:\s*(\d{4})/,
        /(\d{4})\s*جنيه لعيار 21/,
        /(\d{4})\s*جنيه لـ١ جرام ذهب عيار ٢١/,
        /"(21k|gold_21)":\s*"?(\d{4})"?/,
        /price-21">(\d{4})/,
        /price_21k">(\d{4})/,
        /class="gold-price">(\d{4})/,
        /<td>21k<\/td>.*?<td>(\d{4})<\/td>/i,
        /<td>(\d{4})<\/td>.*?<td>21k<\/td>/i
      ];

      let prices = {
        '21k': 0,
        '24k': 0,
        '18k': 0
      };
      let sourceUsed = "";

      for (const url of sources) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"macOS"',
              'Referer': 'https://www.google.com/'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (response.ok) {
            const html = await response.text();
            
            for (const pattern of patterns21k) {
              const match = html.match(pattern);
              if (match && match[1]) {
                const p21 = parseInt(match[1]);
                // Sanity check for EGP gold prices (currently around 2500-4000)
                if (p21 >= 2500 && p21 <= 5500) {
                  prices['21k'] = p21;
                  // Derive others accurately for Cairo market
                  prices['24k'] = Math.round(p21 * (24/21));
                  prices['18k'] = Math.round(p21 * (18/21));
                  sourceUsed = url;
                  break;
                }
              }
            }
          }
          if (prices['21k'] > 0) break;
        } catch (e) {
          // Only warn if it's a primary source or if we're debugging
          if (url.includes('isagha.com')) {
            console.warn(`Gold fetch failed for primary source ${url}: ${e instanceof Error ? e.message : 'Error'}`);
          }
        }
      }

      if (prices['21k'] > 0) {
        res.json({ prices, source: sourceUsed });
      } else {
        // Fallback to a hardcoded recent price if everything fails (Egyptian market is volatile)
        res.json({ 
          prices: { '21k': 3650, '24k': 4171, '18k': 3129 }, 
          source: "fallback",
          warning: "Real-time data unavailable"
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gold prices" });
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
