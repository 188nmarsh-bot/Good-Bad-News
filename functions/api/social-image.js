export async function onRequest({ request }) {
  const url = new URL(request.url);

  const title = url.searchParams.get("title") || "Breaking story on Good Bad News";
  const img = url.searchParams.get("img") || "";

  const safeTitle = escapeXml(title).slice(0, 170);
  const safeImg = escapeXml(img);

  const lines = wrapText(safeTitle, 24).slice(0, 5);

  const backgroundImage = safeImg
    ? `
      <image
        href="${safeImg}"
        x="0"
        y="0"
        width="1080"
        height="1080"
        preserveAspectRatio="xMidYMid slice"
      />
    `
    : `<rect width="1080" height="1080" fill="#111111"/>`;

  const svg = `
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  ${backgroundImage}

  <rect width="1080" height="1080" fill="rgba(0,0,0,0.62)"/>
  <rect x="36" y="36" width="1008" height="1008" rx="34" fill="none" stroke="#facc15" stroke-width="10"/>

  <rect x="62" y="62" width="956" height="118" rx="26" fill="#050505" opacity="0.94"/>
  <text x="92" y="136" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="#ffffff">
    GOOD /
  </text>
  <text x="270" y="136" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="#facc15">
    BAD NEWS
  </text>

  <rect x="92" y="222" width="280" height="54" rx="27" fill="#facc15"/>
  <text x="122" y="258" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#050505">
    THE VOTE IS LIVE
  </text>

  <rect x="62" y="330" width="956" height="420" rx="30" fill="#050505" opacity="0.72"/>

  ${lines.map((line, i) => `
    <text x="92" y="${410 + i * 68}" font-family="Arial, Helvetica, sans-serif" font-size="55" font-weight="900" fill="#ffffff">
      ${line}
    </text>
  `).join("")}

  <rect x="62" y="810" width="956" height="176" rx="30" fill="#050505" opacity="0.94"/>
  <text x="92" y="874" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="#facc15">
    Good • Mixed • Bad
  </text>
  <text x="92" y="932" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" fill="#ffffff">
    Cast your vote now
  </text>
  <text x="92" y="970" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff">
    thegoodbadnews.com
  </text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

function escapeXml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(text, maxChars) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }

  if (line) lines.push(line);
  return lines;
}