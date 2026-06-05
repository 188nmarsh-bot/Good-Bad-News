function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getImportantWords(text) {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "if", "then", "than", "to", "for",
    "of", "in", "on", "at", "by", "with", "from", "into", "after", "before",
    "over", "under", "as", "is", "are", "was", "were", "be", "been", "being",
    "this", "that", "these", "those", "it", "its", "their", "his", "her",
    "new", "says", "say", "amid", "during"
  ]);

  return normalizeText(text)
    .split(" ")
    .filter(word => word.length > 2 && !stopWords.has(word));
}

function wordOverlapScore(titleA, titleB) {
  const wordsA = new Set(getImportantWords(titleA));
  const wordsB = new Set(getImportantWords(titleB));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  wordsA.forEach(word => {
    if (wordsB.has(word)) overlap++;
  });

  return overlap;
}

function keywordOverlapScore(articleA, articleB) {
  const a = new Set((articleA.keywords || []).map(k => k.toLowerCase()));
  const b = new Set((articleB.keywords || []).map(k => k.toLowerCase()));

  if (a.size === 0 || b.size === 0) return 0;

  let overlap = 0;
  a.forEach(word => {
    if (b.has(word)) overlap++;
  });

  return overlap;
}
function scoreImpactFromGroup(group) {
  const sourceScore = group.length * 10;

  let timeScore = 0;
  const timeText = (group[0]?.time || "").toLowerCase();

  if (timeText.includes("minutes")) {
    timeScore = 30;
  } else if (timeText.includes("hour")) {
    timeScore = 20;
  } else if (timeText.includes("day")) {
    timeScore = 5;
  } else {
    timeScore = 10;
  }

  return sourceScore + timeScore;
}

function countSignals(words, signals) {
  let count = 0;
  const joined = words.join(" ").toLowerCase();

  signals.forEach((word) => {
    if (joined.includes(word)) count++;
  });

  return count;
}

function articlesBelongTogether(articleA, articleB) {
  const titleA = normalizeText(articleA.title);
  const titleB = normalizeText(articleB.title);

  const titleOverlap = wordOverlapScore(titleA, titleB);
  const keywordOverlap = keywordOverlapScore(articleA, articleB);

  const wordsA = getImportantWords(titleA);
  const wordsB = getImportantWords(titleB);

  const uniqueWords = new Set([...wordsA, ...wordsB]);
  const overlapRatio =
    uniqueWords.size === 0 ? 0 : titleOverlap / uniqueWords.size;

  const sameCategory = articleA.category === articleB.category;

  // Exact-ish match, even if category guessing differs
  if (titleOverlap >= 3 && overlapRatio >= 0.25) return true;

  // Strong keyword match
  if (keywordOverlap >= 3) return true;

  // Same category can group with slightly weaker match
  if (sameCategory && titleOverlap >= 2 && overlapRatio >= 0.2) return true;

  return false;
}

function detectLabel(category, words, impactScore = 0) {
  const badSignals = [
    "flood", "disaster", "evacuation", "evacuations", "stocks", "markets",
    "crash", "loss", "war", "attack", "killed", "dead", "violence",
    "explosion", "fire", "strike", "missile", "bomb", "injured", "death",
    "outbreak", "hostage", "sanctions", "collapse", "drop", "dropped"
  ];

  const goodSignals = [
    "ceasefire", "peace", "breakthrough", "cure", "recovery",
    "agreement", "rescue", "aid", "growth", "improves", "improve",
    "success", "win", "wins", "reduce", "decline", "support",
    "treaty", "help", "helped", "saving", "saved", "advance"
  ];

  let badCount = countSignals(words, badSignals);
  let goodCount = countSignals(words, goodSignals);

  if (category === "Business") badCount += 1;
  if (category === "Politics") badCount += 1;
  if (category === "Health") goodCount += 1;
  if (category === "Tech") goodCount += 1;

  if (impactScore >= 60) {
    badCount += 1;
  }

  if (goodCount > badCount) return "Good";
  if (badCount > goodCount) return "Bad";

  if (category === "Health" || category === "Tech") return "Good";
  return "Bad";
}

function makeWhy(label, category) {
  if (label === "Good" && category === "World") {
    return "This story suggests progress, relief, or reduced harm.";
  }
  if (label === "Good" && category === "Tech") {
    return "This story points to innovation or a potentially beneficial breakthrough.";
  }
  if (label === "Bad" && category === "Business") {
    return "This story signals instability, losses, or economic uncertainty.";
  }
  if (label === "Bad" && category === "World") {
    return "This story involves disruption, danger, or humanitarian harm.";
  }
  if (label === "Bad" && category === "Politics") {
    return "This story points to conflict, instability, or political tension.";
  }
  return "This story was labeled based on its likely overall impact.";
}

function chooseBestHeadline(group) {
  return [...group].sort((a, b) => {
    const aScore = (a.keywords?.length || 0) + (a.title.length > 40 ? 1 : 0);
    const bScore = (b.keywords?.length || 0) + (b.title.length > 40 ? 1 : 0);
    return bScore - aScore;
  })[0].title;
}

function chooseBestTime(group) {
  return group[0].time;
}

function makeSummary(group) {
  const first = group[0];
  const sourceCount = group.length;
  const category = first?.category || "World";

  const words = [
    ...new Set(
      group.flatMap(item => [
        ...getImportantWords(item.title),
        ...(item.keywords || []).map(k => k.toLowerCase())
      ])
    )
  ];

  const joined = words.join(" ");

  let topic = "this story";

  if (joined.includes("ceasefire") || joined.includes("peace") || joined.includes("diplomat")) {
    topic = "ceasefire and diplomatic efforts";
  } else if (joined.includes("market") || joined.includes("stocks") || joined.includes("economy") || joined.includes("inflation")) {
    topic = "economic and market developments";
  } else if (joined.includes("ai") || joined.includes("technology") || joined.includes("software") || joined.includes("chip")) {
    topic = "technology and artificial intelligence developments";
  } else if (joined.includes("flood") || joined.includes("disaster") || joined.includes("evacuation") || joined.includes("rescue")) {
    topic = "emergency response and public safety concerns";
  } else if (joined.includes("election") || joined.includes("government") || joined.includes("president") || joined.includes("senate") || joined.includes("congress")) {
    topic = "political developments";
  } else if (joined.includes("health") || joined.includes("medical") || joined.includes("disease") || joined.includes("hospital")) {
    topic = "health and medical developments";
  }

  let opening = "";

  if (sourceCount >= 5) {
    opening = `Multiple major outlets are tracking ${topic}`;
  } else if (sourceCount >= 2) {
    opening = `Several sources are reporting on ${topic}`;
  } else {
    opening = `A developing report is focused on ${topic}`;
  }

  let ending = "";

  if (category === "Business") {
    ending = "as investors, businesses, and consumers watch for broader economic effects.";
  } else if (category === "Tech") {
    ending = "as the technology sector continues to move quickly and attract public attention.";
  } else if (category === "Health") {
    ending = "with possible implications for public health, treatment, or medical research.";
  } else if (category === "Politics") {
    ending = "as officials, voters, and institutions respond to the latest developments.";
  } else {
    ending = "as the situation continues to develop and draw wider attention.";
  }

  return `${opening}, ${ending}`;
}

function getStoryId(story) {
  return normalizeText(story.title || "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function getVotes(story) {
  const storyId = getStoryId(story);
  const saved = localStorage.getItem(`votes-${storyId}`);

  if (saved) return JSON.parse(saved);

  return {
    good: 0,
    mixed: 0,
    bad: 0,
    userVote: null
  };
}

function saveVotes(story, votes) {
  const storyId = getStoryId(story);
  localStorage.setItem(`votes-${storyId}`, JSON.stringify(votes));
}

function voteStory(storyId, voteType) {
  const story = window.allStories.find(s => getStoryId(s) === storyId);
  if (!story) return;

  const votes = getVotes(story);

  if (votes.userVote) {
    votes[votes.userVote] = Math.max(0, votes[votes.userVote] - 1);
  }

  votes[voteType] += 1;
  votes.userVote = voteType;

  saveVotes(story, votes);

  renderTopStory(window.allStories);
  renderTrending(window.allStories);
  renderFeed(window.allStories);

  const openVoteBox = document.getElementById("story-vote-box");

  if (openVoteBox) {
    openVoteBox.innerHTML = renderVoteBox(story);
  }
}

function getVotePercentages(votes) {
  const total = votes.good + votes.mixed + votes.bad;

  if (total === 0) {
    return { good: 0, mixed: 0, bad: 0 };
  }

  return {
    good: Math.round((votes.good / total) * 100),
    mixed: Math.round((votes.mixed / total) * 100),
    bad: Math.round((votes.bad / total) * 100)
  };
}

function renderVoteBox(story) {
  const storyId = getStoryId(story);
  const votes = getVotes(story);
  const percentages = getVotePercentages(votes);

  return `
    <div class="vote-box">
      <div class="vote-title">How do readers see this story?</div>

      <div class="vote-row">
        <span>👍 Good</span>
        <strong>${percentages.good}%</strong>
      </div>
      <div class="vote-bar">
        <div class="vote-fill good-fill" style="width:${percentages.good}%"></div>
      </div>

      <div class="vote-row">
        <span>😐 Mixed</span>
        <strong>${percentages.mixed}%</strong>
      </div>
      <div class="vote-bar">
        <div class="vote-fill mixed-fill" style="width:${percentages.mixed}%"></div>
      </div>

      <div class="vote-row">
        <span>👎 Bad</span>
        <strong>${percentages.bad}%</strong>
      </div>
      <div class="vote-bar">
        <div class="vote-fill bad-fill" style="width:${percentages.bad}%"></div>
      </div>

      <div class="vote-buttons">
        <button class="${votes.userVote === "good" ? "selected" : ""}" onclick="event.stopPropagation(); voteStory('${storyId}', 'good')">👍 Good</button>
        <button class="${votes.userVote === "mixed" ? "selected" : ""}" onclick="event.stopPropagation(); voteStory('${storyId}', 'mixed')">😐 Mixed</button>
        <button class="${votes.userVote === "bad" ? "selected" : ""}" onclick="event.stopPropagation(); voteStory('${storyId}', 'bad')">👎 Bad</button>
      </div>
    </div>
  `;
}

function scrollTalking(direction) {
  const container =
    document.getElementById("talkingAboutContainer");

  if (!container) return;

  container.scrollBy({
    left: direction * 340,
    behavior: "smooth"
  });
}

function openStoryById(storyId) {
  const story =
    window.allStories.find(
      s => getStoryId(s) === storyId
    );

  if (!story) {
    console.warn("Story not found:", storyId);
    return;
  }

  currentOpenStoryId = storyId;

  openStory(story);

  renderComments(currentOpenStoryId);
}

function groupArticlesIntoStories(rawArticles) {
  const groups = [];

  rawArticles.forEach((article) => {
    let matchedGroup = null;

    for (const group of groups) {
      const matchesExisting = group.some(existing =>
        articlesBelongTogether(article, existing)
      );

      if (matchesExisting) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.push(article);
    } else {
      groups.push([article]);
    }
  });

  return groups.map((group) => {
    const first = group[0];

    const allWords = [
      ...new Set(
        group.flatMap(item => [
          ...getImportantWords(item.title),
          ...(item.keywords || []).map(k => k.toLowerCase())
        ])
      )
    ];

   const impactScore = scoreImpactFromGroup(group);

return {
  title: chooseBestHeadline(group),
  label: "Vote",
  category: first.category,
  time: chooseBestTime(group),
  impactScore: impactScore,
  summary: makeSummary(group),
  why: "Readers vote on whether this story feels good, bad, or mixed.",
  image: group.find(item => item.image)?.image || "",
  sources: group.map((item) => ({
  name: item.source,
  headline: item.title,
  url: item.url,
  image: item.image || ""
}))
    };
  });
}

/* ONE shared story list for the whole app */
window.allStories = groupArticlesIntoStories(window.rawArticles || []);

console.log("RAW ARTICLES:", window.rawArticles);
console.log("STORIES CREATED:", window.allStories);

/* COMMENTS SYSTEM */

let currentOpenStoryId = null;

function getComments(storyId) {
  const saved = localStorage.getItem(`comments-${storyId}`);
  return saved ? JSON.parse(saved) : [];
}

function saveComments(storyId, comments) {
  localStorage.setItem(`comments-${storyId}`, JSON.stringify(comments));
}

function renderComments(storyId) {
  const list = document.getElementById("comments-list");
  const title = document.getElementById("comments-title");

  if (!list) return;

  const comments = getComments(storyId);

  // Update comment count
  if (title) {
    title.innerText =
      `Community Comments (${comments.length})`;
  }

  if (comments.length === 0) {
    list.innerHTML = `
      <p class="no-comments">
        No comments yet. Be the first.
      </p>
    `;
    return;
  }

  list.innerHTML = comments
    .map((comment, index) => `
      <div class="comment-card">

        <div class="comment-header">
          <strong>${comment.name}</strong>
          <span>${comment.time}</span>
        </div>

        <p>${comment.text}</p>

        <div class="comment-footer">
          <button
            type="button"
            class="comment-like-button"
            onclick="event.preventDefault();
                     event.stopPropagation();
                     likeComment('${storyId}', ${index})">
            👍 ${comment.likes}
          </button>
        </div>
      </div>
    `)
    .join("");
}

function addComment(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!currentOpenStoryId) return;

  const input = document.getElementById("comment-input");
  const nameInput = document.getElementById("comment-name");

  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const userName =
    nameInput?.value.trim() || "Anonymous";

  localStorage.setItem(
    "goodbad-comment-name",
    userName
  );

  const comments =
    getComments(currentOpenStoryId);

  comments.unshift({
    id: Date.now(),
    name: userName,
    text: text,
    likes: 0,
    time: new Date().toLocaleString()
  });

  saveComments(
    currentOpenStoryId,
    comments
  );

  input.value = "";

  if (nameInput) {
    nameInput.value = userName;
  }

  renderComments(currentOpenStoryId);
}

function likeComment(storyId, index) {
  const comments = getComments(storyId);

  if (!comments[index]) return;

  comments[index].likes += 1;

  saveComments(storyId, comments);
  renderComments(storyId);
}

/* AUTO REFRESH LIVE NEWS */
const NEWS_REFRESH_MINUTES = 10;

async function refreshNewsFeed() {
  console.log("Refreshing news feed...");

  try {
    if (typeof loadRSSFeeds === "function") {
      await loadRSSFeeds();
    } else if (typeof loadNews === "function") {
      await loadNews();
    } else if (typeof fetchNews === "function") {
      await fetchNews();
    } else {
      console.warn("No RSS refresh function found.");
      return;
    }

    window.allStories = groupArticlesIntoStories(window.rawArticles || []);

    renderTopStory(window.allStories);
    renderTrending(window.allStories);
    renderFeed(window.allStories);

    console.log("News feed refreshed.");
  } catch (error) {
    console.error("Auto-refresh failed:", error);
  }
}

setInterval(refreshNewsFeed, NEWS_REFRESH_MINUTES * 60 * 1000);