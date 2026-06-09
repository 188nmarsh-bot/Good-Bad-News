async function loadRealNews() {
  const feeds = [
    { name: "Google News Top Stories", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News World", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News U.S.", url: "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News Business", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en" },
    { name: "Google News Tech", url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en" },
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
    { name: "BBC Tech", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
    { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml" },
    { name: "Fox World", url: "https://moxie.foxnews.com/google-publisher/world.xml" },
    { name: "CNN", url: "https://rss.cnn.com/rss/edition.rss" },
    { name: "CNN World", url: "https://rss.cnn.com/rss/edition_world.rss" },
    { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },
    { name: "NBC News", url: "https://feeds.nbcnews.com/nbcnews/public/news" },
    { name: "ABC News", url: "https://abcnews.go.com/abcnews/topstories" },
    { name: "NY Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
    { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/home.xml" },
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" }
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
      const articles = await fetchWithTimeout(feed, 8000);
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