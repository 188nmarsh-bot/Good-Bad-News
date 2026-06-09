export async function onRequest() {
  const feeds = [
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
    { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },
    { name: "The Guardian", url: "https://www.theguardian.com/world/rss" }
  ];

  const results = await Promise.allSettled(
    feeds.map(feed => fetchRSS(feed))
  );

  const articles = results
    .filter(result => result.status === "fulfilled")
    .flatMap(result => result.value)
    .slice(0, 40);

  return new Response(JSON.stringify(articles), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  });
}

async function fetchRSS(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GoodBadNews/1.0"
      }
    });

    const text = await response.text();

    const items = [...text.matchAll(/<item>[\s\S]*?<\/item>/g)].slice(0, 10);

    return items.map(match => {
      const item = match[0];

      return {
        title: clean(getTag(item, "title")),
        link: clean(getTag(item, "link")),
        pubDate: clean(getTag(item, "pubDate")),
        source: feed.name,
        category: guessCategory(clean(getTag(item, "title"))),
        summary: clean(getTag(item, "description"))
      };
    });
  } catch (error) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1] : "";
}

function clean(text) {
  return text
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