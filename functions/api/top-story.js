export async function onRequest(context) {
  const origin = new URL(context.request.url).origin;

  const response = await fetch(`${origin}/api/news`);
  const articles = await response.json();

  const top = articles?.[0];

  if (!top) {
    return Response.json({ error: "No top story found" }, { status: 404 });
  }

  const postText = `📰 Top story on Good Bad News:\n\n${top.title}\n\nRead more: ${top.link || top.url}`;

  return Response.json({
    title: top.title || "",
    source: top.source || "",
    url: top.link || top.url || "",
    pubDate: top.pubDate || "",
    summary: top.summary || "",
    postText
  }, {
    headers: {
      "Cache-Control": "public, max-age=300"
    }
  });
}