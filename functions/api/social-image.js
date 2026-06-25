export async function onRequest({ request }) {
  const url = new URL(request.url);
  const img = url.searchParams.get("img");

  if (!img) {
    return new Response("Missing image URL", { status: 400 });
  }

  const imageResponse = await fetch(img, {
    headers: {
      "User-Agent": "GoodBadNewsBot/1.0"
    }
  });

  if (!imageResponse.ok) {
    return new Response("Could not fetch image", { status: 500 });
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  return new Response(imageResponse.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600"
    }
  });
}