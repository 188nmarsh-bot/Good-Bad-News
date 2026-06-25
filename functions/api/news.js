export async function onRequest() {
  const feeds = [
  { name: "Google News Top Stories", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News World", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News U.S.", url: "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News Business", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News Tech", url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en" },

  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
  { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "CNN World", url: "https://rss.cnn.com/rss/edition_world.rss" },
  { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "Reuters", url: "https://feeds.reuters.com/reuters/worldNews" },
  { name: "AP News", url: "https://apnews.com/hub/ap-top-news?output=rss" }
];

  const results = await Promise.allSettled(
    feeds.map(feed => fetchRSS(feed))
  );

  const articles = results
    .filter(result => result.status === "fulfilled")
    .flatMap(result => result.value)
    .slice(0, 80);

  return new Response(JSON.stringify(articles), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  });
}

async function fetchRSS(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    console.log("Fetching:", feed.name, feed.url);

    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GoodBadNews/1.0"
      }
    });

    if (!response.ok) {
      console.log("FAILED:", feed.name, response.status, response.statusText);
      return [];
    }

    const text = await response.text();
    const items = [...text.matchAll(/<item>[\s\S]*?<\/item>/g)].slice(0, 15);

    console.log("SUCCESS:", feed.name, "items:", items.length);

    return await Promise.all(
      items.map(async (match) => {
        const item = match[0];

        const title = clean(getTag(item, "title"));
        const description = getTag(item, "description");
        const link = clean(getTag(item, "link"));

        let image = getImage(item, description);

         if (!image && link && !feed.name.includes("Google News")) {
          image = await getImageFromArticle(link);
         }
        return {
          title,
          link,
          pubDate: clean(getTag(item, "pubDate")),
          source: feed.name,
          category: guessCategory(title),
          summary: clean(description),
          image
        };
      })
    );
  } catch (error) {
    console.log("ERROR:", feed.name, error.message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function getImage(item, description = "") {
  description = description || "";

  const mediaMatch = item.match(/<media:content[^>]*url=["']([^"']+)["']/i);
  if (mediaMatch) return cleanImageUrl(mediaMatch[1]);

  const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
  if (enclosureMatch) return cleanImageUrl(enclosureMatch[1]);

  const thumbnailMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
  if (thumbnailMatch) return cleanImageUrl(thumbnailMatch[1]);

  const decodedDescription = description
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

  const imgMatch = decodedDescription.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (imgMatch) return cleanImageUrl(imgMatch[1]);

  return "";
}

async function getImageFromArticle(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GoodBadNews/1.0"
      }
    });

    if (!response.ok) return "";

    const html = await response.text();

    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    if (ogMatch) return cleanImageUrl(ogMatch[1]);

    const twitterMatch = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    );
    if (twitterMatch) return cleanImageUrl(twitterMatch[1]);

    return "";
  } catch (error) {
    return "";
  }
}

function cleanImageUrl(url = "") {
  return String(url)
    .replace(/&amp;/g, "&")
    .trim();
}

function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1] : "";
}

function clean(text = "") {
  return String(text)
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function guessCategory(title) {
  const t = title.toLowerCase();

  if (t.includes("war") || t.includes("ukraine") || t.includes("israel") || t.includes("gaza")) return "World";
  if (t.includes("trump") || t.includes("biden") || t.includes("election") || t.includes("congress")) return "Politics";
  if (t.includes("stock") || t.includes("market") || t.includes("economy")) return "Business";
  if (t.includes("ai") || t.includes("tech") || t.includes("apple") || t.includes("google")) return "Tech";
  if (t.includes("health") || t.includes("virus") || t.includes("hospital")) return "Health";

  return "World";
}