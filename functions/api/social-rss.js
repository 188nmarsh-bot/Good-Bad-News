export async function onRequest() {
  const siteUrl = "https://thegoodbadnews.com";
  const newsUrl = `${siteUrl}/api/news`;

  const response = await fetch(newsUrl);
  const articles = await response.json();

  const topArticles = articles
    .filter(article => article.title)
    .slice(0, 10);

  const items = topArticles.map(article => {
    const title = safeCdata(cleanSocialText(article.title));
    const summary = safeCdata(cleanSocialText(article.summary || article.title));
    const guid = escapeXml(article.link || `${siteUrl}/#${article.title}`);
    const pubDate = article.pubDate || new Date().toUTCString();

    return `
      <item>
        <title><![CDATA[${title}]]></title>
        <link>${siteUrl}</link>
        <guid>${guid}</guid>
        <description><![CDATA[${summary}

Read more at ${siteUrl}]]></description>
        <pubDate>${escapeXml(pubDate)}</pubDate>
      </item>
    `;
  }).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Good Bad News Social Feed</title>
    <link>${siteUrl}</link>
    <description>Top stories from Good Bad News</description>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=UTF-8",
      "Cache-Control": "public, max-age=300"
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