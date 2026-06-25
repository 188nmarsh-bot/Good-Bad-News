export async function onRequest() {
  const siteUrl = "https://thegoodbadnews.com";

 const newsUrl = `${siteUrl}/api/news`;

const response = await fetch(newsUrl);
const articles = await response.json();

const topArticles = articles
  .filter(article => article.title && article.image)
  .map(article => ({
    ...article,
    socialScore: scoreArticle(article)
  }))
  .sort((a, b) => b.socialScore - a.socialScore)
  .slice(0, 3);

  const items = topArticles.map(article => {
  const title = cleanSocialText(article.title);
  const summary = cleanSocialText(article.summary || article.title);
  const guid = escapeXml(article.link);
  const pubDate = article.pubDate;

  const imageUrl =
  `${siteUrl}/api/social-image?title=${encodeURIComponent(title)}&img=${encodeURIComponent(upgradeSocialImage(article.image || ""))}`;

 return `
  <item>
    <title><![CDATA[${safeCdata(title)}]]></title>
    <link>${siteUrl}</link>
    <guid isPermaLink="false">${guid}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${safeCdata(summary)}

Vote now: Good • Mixed • Bad
${siteUrl}

IMAGE:
${imageUrl}]]></description>
    <media:content url="${escapeXml(imageUrl)}" medium="image" />
  </item>
`;
}).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Good Bad News Social Feed</title>
    <link>${siteUrl}</link>
    <description>Top Good Bad News stories for social posting</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function escapeXml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeCdata(text = "") {
  return String(text).replace(/\]\]>/g, "]]]]><![CDATA[>");
}

function cleanSocialText(text = "") {
  return String(text)
    .replace(/&lt;[^&]*?&gt;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function scoreArticle(article) {
  const title = (article.title || "").toLowerCase();
  const source = (article.source || "").toLowerCase();
  const category = (article.category || "").toLowerCase();

  let score = 0;

  // Source quality / broad coverage
  if (source.includes("google news top stories")) score += 50;
  if (source.includes("google news world")) score += 45;
  if (source.includes("ap")) score += 40;
  if (source.includes("reuters")) score += 40;
  if (source.includes("bbc")) score += 35;
  if (source.includes("cnn")) score += 30;
  if (source.includes("fox")) score += 30;
  if (source.includes("al jazeera")) score += 30;
  if (source.includes("guardian")) score += 25;
  if (source.includes("npr")) score += 25;
  if (source.includes("cbs")) score += 25;

  // Big-news keywords
  const hotWords = [
    "breaking",
    "war",
    "ceasefire",
    "attack",
    "strike",
    "earthquake",
    "hurricane",
    "flood",
    "wildfire",
    "election",
    "president",
    "trump",
    "supreme court",
    "congress",
    "iran",
    "israel",
    "gaza",
    "ukraine",
    "russia",
    "china",
    "nato",
    "stock market",
    "inflation",
    "ai",
    "crash",
    "dead",
    "killed",
    "major",
    "historic"
  ];

  hotWords.forEach(word => {
    if (title.includes(word)) score += 15;
  });

  // Prefer core categories
  if (category === "world") score += 25;
  if (category === "politics") score += 20;
  if (category === "business") score += 15;
  if (category === "tech") score += 12;
  if (category === "health") score += 10;

  // Avoid weak/soft stories for social auto-posting
  const weakWords = [
    "opinion",
    "review",
    "recipe",
    "celebrity",
    "horoscope",
    "shopping",
    "streaming",
    "watch",
    "photos"
  ];

  weakWords.forEach(word => {
    if (title.includes(word)) score -= 30;
  });

  return score;
}

function upgradeSocialImage(url = "") {
  return String(url)
    .replace(/&amp;/g, "&")
    .replace("/standard/240/", "/standard/1024/")
    .trim();
}