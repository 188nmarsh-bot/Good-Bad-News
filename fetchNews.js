function guessCategory(title) {
  const t = title.toLowerCase();

  if (t.includes("market") || t.includes("stocks") || t.includes("economy") || t.includes("inflation") || t.includes("trade") || t.includes("business") || t.includes("tariff") || t.includes("bank")) {
    return "Business";
  }

  if (t.includes("ai") || t.includes("technology") || t.includes("tech") || t.includes("software") || t.includes("chip") || t.includes("cyber") || t.includes("app") || t.includes("startup")) {
    return "Tech";
  }

  if (t.includes("health") || t.includes("medical") || t.includes("disease") || t.includes("hospital") || t.includes("virus") || t.includes("vaccine") || t.includes("screening")) {
    return "Health";
  }

  if (t.includes("election") || t.includes("government") || t.includes("president") || t.includes("minister") || t.includes("policy") || t.includes("senate") || t.includes("congress") || t.includes("politics")) {
    return "Politics";
  }

  return "World";
}

function extractKeywords(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function formatRelativeTime(pubDateText) {
  if (!pubDateText) return "Just now";

  const published = new Date(pubDateText);
  const now = new Date();

  if (isNaN(published.getTime())) return "Just now";

  const diffMs = now - published;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

async function fetchRSS(feed) {
  const proxy = "https://api.allorigins.win/raw?url=";
  const response = await fetch(proxy + encodeURIComponent(feed.url));
  const text = await response.text();

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const items = xml.querySelectorAll("item");

  return Array.from(items).slice(0, 8).map(item => {
    const title = item.querySelector("title")?.textContent || "";
const link = item.querySelector("link")?.textContent || "";
const pubDate = item.querySelector("pubDate")?.textContent || "";

const mediaContent = item.querySelector("media\\:content, content");
const mediaThumbnail = item.querySelector("media\\:thumbnail, thumbnail");
const enclosure = item.querySelector("enclosure");

const image =
  mediaContent?.getAttribute("url") ||
  mediaThumbnail?.getAttribute("url") ||
  enclosure?.getAttribute("url") ||
  "";
return {
  title,
  source: feed.name,
  category: guessCategory(title),
  time: formatRelativeTime(pubDate),
  url: link,
  image,
  keywords: extractKeywords(title)
};
  });
}

async function loadRealNews() {
  const feeds = [

    // 🔎 GOOGLE NEWS RSS
    { name: "Google News Top Stories", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News World", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News U.S.", url: "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News Business", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News Tech", url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News Health", url: "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News Science", url: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en" },
    
    // BBC 
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
    { name: "BBC Tech", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
    { name: "BBC Health", url: "https://feeds.bbci.co.uk/news/health/rss.xml" },

    // Reuters
    { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews" },

    // Fox News
    { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml" },
    { name: "Fox World", url: "https://moxie.foxnews.com/google-publisher/world.xml" },
    { name: "Fox Politics", url: "https://moxie.foxnews.com/google-publisher/politics.xml" },
    { name: "Fox Health", url: "https://moxie.foxnews.com/google-publisher/health.xml" },

    // CNN
    { name: "CNN", url: "https://rss.cnn.com/rss/edition.rss" },
    { name: "CNN World", url: "https://rss.cnn.com/rss/edition_world.rss" },
    { name: "CNN Politics", url: "https://rss.cnn.com/rss/cnn_allpolitics.rss" },

    // CBS / NBC / ABC
    { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },
    { name: "NBC News", url: "https://feeds.nbcnews.com/nbcnews/public/news" },
    { name: "ABC News", url: "https://abcnews.go.com/abcnews/topstories" },

    // NY Times
    { name: "NY Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
    { name: "NY Times World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
    { name: "NY Times Business", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml" },

    // Sky News
    { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/home.xml" },
    { name: "Sky World", url: "https://feeds.skynews.com/feeds/rss/world.xml" },

    // Business
    { name: "MarketWatch", url: "https://www.marketwatch.com/rss/topstories" },
    { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },

    // International
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
    { name: "France24", url: "https://www.france24.com/en/rss" },

    // Tech
    { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" }
  ];

  let allArticles = [];

  for (const feed of feeds) {
    try {
      const articles = await fetchRSS(feed);
      allArticles = allArticles.concat(articles);
    } catch (e) {
      console.error("Failed to fetch:", feed.name, feed.url, e);
    }
  }

  if (allArticles.length === 0) {
    console.log("No live articles loaded, keeping starter stories.");
    return;
  }

  window.allStories = groupArticlesIntoStories(allArticles);

  renderTopStory(window.allStories);
  renderTrending(window.allStories);
  renderFeed(window.allStories);
}

document.addEventListener("DOMContentLoaded", loadRealNews);