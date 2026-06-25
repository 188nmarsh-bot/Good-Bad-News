export async function onRequest() {
  const siteUrl = "https://thegoodbadnews.com";
  const newsUrl = `${siteUrl}/api/news`;

  try {
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
      const guid = escapeXml(article.link || `${siteUrl}/#${article.title}`);
      const pubDate = article.pubDate || new Date().toUTCString();

      const imageUrl =
        `${siteUrl}/api/social-image?title=${encodeURIComponent(title)}&img=${encodeURIComponent(article.image)}`;

      return `
        <item>
          <title><![CDATA[${safeCdata(title)}]]></title>
          <link>${siteUrl}</link>
          <guid isPermaLink="false">${guid}</guid>
          <pubDate>${pubDate}</pubDate>
          <description><![CDATA[${safeCdata(summary)}

Vote now: Good • Mixed • Bad
${siteUrl}]]></description>
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
        "Cache-Control": "public, max-age=300"
      }
    });

  } catch (error) {
    return new Response(`RSS error: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }
}

function scoreArticle(article) {
  const title = (article.title || "").toLowerCase();

  let score = 0;

  const strongWords = [
    "breaking", "urgent", "war", "ceasefire", "trump", "biden",
    "iran", "israel", "russia", "china", "ukraine",
    "supreme court", "election", "attack", "crisis",
    "dead", "killed", "ai", "stock", "market"
  ];

  strongWords.forEach(word => {
    if (title.includes(word)) score += 10;
  });

  if (article.image) score += 25;
  if (article.summary) score += 10;
  if (article.pubDate) score += 5;

  return score;
}

function cleanSocialText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function safeCdata(text) {
  return String(text || "").replace(/\]\]>/g, "]]]]><![CDATA[>");
}

function escapeXml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}