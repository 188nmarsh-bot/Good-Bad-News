async function fetchRSS(feed) {
  const proxy = "https://api.codetabs.com/v1/proxy?quest=";

  const response = await fetch(proxy + encodeURIComponent(feed.url));
  const text = await response.text();

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const items = xml.querySelectorAll("item");

  return Array.from(items).slice(0, 8).map(item => {
    const title = item.querySelector("title")?.textContent || "";
    const link = item.querySelector("link")?.textContent || "";
    const pubDate = item.querySelector("pubDate")?.textContent || "";

    return {
      title,
      source: feed.name,
      category: guessCategory(title),
      time: formatRelativeTime(pubDate),
      url: link,
      image: "",
      keywords: extractKeywords(title)
    };
  });
}

async function loadRealNews() {
  const feeds = [
  { name: "Google News Top Stories", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News World", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News U.S.", url: "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News Business", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News Tech", url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "CNN World", url: "https://rss.cnn.com/rss/edition_world.rss" },
  { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml" },
  { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" }
];

  let allArticles = [];
  let hasRenderedOnce = false;

  const renderLiveStories = () => {
    if (allArticles.length === 0) return;

    window.allStories = groupArticlesIntoStories(allArticles);

    renderTopStory(window.allStories);
    renderTrending(window.allStories);
    renderTalkingAbout(window.allStories);
    renderFeed(window.allStories);

    hasRenderedOnce = true;
  };

  const fetchWithTimeout = async (feed, timeoutMs = 8000) => {
    return Promise.race([
      fetchRSS(feed),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timed out")), timeoutMs)
      )
    ]);
  };

  const feedPromises = feeds.map(async (feed) => {
    try {
   const articles = await fetchWithTimeout(feed, 4000);
      allArticles = allArticles.concat(articles);

      // Show stories as soon as enough articles arrive
      if (allArticles.length >= 10) {
        renderLiveStories();
      }
    } catch (e) {
      console.error("Failed or slow feed:", feed.name, feed.url, e);
    }
  });

  // Quick first render after 3 seconds, even if only some feeds loaded
  setTimeout(() => {
    if (!hasRenderedOnce) {
      renderLiveStories();
    }
  }, 3000);

  // Final render after all available feeds finish or timeout
  await Promise.allSettled(feedPromises);

  renderLiveStories();

  if (allArticles.length === 0) {
    console.log("No live articles loaded.");
    renderFeed([]);
  }
}
document.addEventListener("DOMContentLoaded", loadRealNews);


