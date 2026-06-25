export async function onRequest({ request }) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "Breaking story on Good / Bad News";

  const safeTitle = escapeXml(title).slice(0, 140);
  const lines = wrapText(safeTitle, 34).slice(0, 4);

  const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#050505"/>

  <rect x="45" y="45" width="1110" height="540" rx="34" fill="#0d0d0d" stroke="#facc15" stroke-width="6"/>

  <text x="85" y="115" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="#ffffff">
    GOOD /
  </text>
  <text x="250" y="115" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="#facc15">
    BAD NEWS
  </text>

  <rect x="85" y="145" width="250" height="42" rx="21" fill="#facc15"/>
  <text x="110" y="174" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800" fill="#050505">
    THE VOTE IS LIVE
  </text>

  ${lines.map((line, i) => `
    <text x="85" y="${265 + i * 68}" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="900" fill="#ffffff">
      ${line}
    </text>
  `).join("")}

  <text x="85" y="515" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#facc15">
    Good • Mixed • Bad
  </text>

  <text x="85" y="555" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff">
    thegoodbadnews.com
  </text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }

  if (line) lines.push(line);
  return lines;
}