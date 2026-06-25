export async function onRequest() {
  const siteUrl = "https://thegoodbadnews.com";
  const newsUrl = `${siteUrl}/api/news`;

  const response = await fetch(newsUrl);
  const articles = await response.json();

  const testArticle = {
  title: "TEST POST - Good Bad News Instagram check",
  summary: "This is a temporary test post to verify the branded Instagram image and caption formatting.",
  link: `${siteUrl}/test-post-${Date.now()}`,
  pubDate: new Date().toUTCString(),
  source: "Good Bad News",
  image: "https://ichef.bbci.co.uk/ace/standard/1024/cpsprodpb/e1c3/live/249bb360-6fba-11f1-8546-8f19e4fe30f4.jpg"
};

   const topArticles = [testArticle];
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