export async function onRequest() {
  const siteUrl = "https://thegoodbadnews.com";
  const newsUrl = `${siteUrl}/api/news`;

  const response = await fetch(newsUrl);
  const articles = await response.json();

  const topArticles = articles
    .filter(article => article.title && article.link)
    .slice(0, 10);

  const items = topArticles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteUrl}</link>
      <guid>${article.link}</guid>
      <description><![CDATA[
        ${article.summary || article.title}
        <br><br>
        Read more at ${siteUrl}
      ]]></description>
      <pubDate>${article.pubDate || new Date().toUTCString()}</pubDate>
    </item>
  `).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
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
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=300"
    }
  });
}