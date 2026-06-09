export async function onRequest() {
  return new Response(JSON.stringify({
    message: "News API is working",
    time: new Date().toISOString()
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  });
}