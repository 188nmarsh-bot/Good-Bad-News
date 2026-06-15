async function loadRealNews() {
  try {
    const response = await fetch("/api/news");
    const articlesFromApi = await response.json();

    const allArticles = articlesFromApi.map(article => {
      return {
        title: article.title || "",
        source: article.source || "",
        category: article.category || "World",
        time: article.pubDate || "",
        url: article.link || article.url || "",
        image: article.image || article.thumbnail || article.media || "",
        keywords: (article.title || "").toLowerCase().split(" ").slice(0, 5),
        summary: article.summary || ""
      };
    });

    window.rawArticles = allArticles;
    window.allStories = groupArticlesIntoStories(allArticles);

    renderTopStory(window.allStories);
    renderTrending(window.allStories);
    renderTalkingAbout(window.allStories);
    renderFeed(window.allStories);

    console.log("Loaded stories from /api/news:", allArticles.length);
  } catch (error) {
    console.error("Failed to load news from /api/news:", error);
    renderFeed([]);
  }
}

document.addEventListener("DOMContentLoaded", loadRealNews);