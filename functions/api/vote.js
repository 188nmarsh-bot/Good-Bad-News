
const VALID_VOTES = ["good", "mixed", "bad"];

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

async function getResults(db, storyId) {
  const result = await db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(vote_type = 'good'), 0) AS good,
      COALESCE(SUM(vote_type = 'mixed'), 0) AS mixed,
      COALESCE(SUM(vote_type = 'bad'), 0) AS bad
    FROM individual_votes
    WHERE story_id = ?
  `).bind(storyId).first();

  return {
    storyId,
    good: result.good,
    mixed: result.mixed,
    bad: result.bad,
    total: result.total
  };
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return json({ error: "Database not connected." }, 500);
    }

    const url = new URL(request.url);
    const storyId = url.searchParams.get("storyId")?.trim();

    if (!storyId || storyId.length > 200) {
      return json({ error: "Invalid storyId." }, 400);
    }

    const results = await getResults(env.DB, storyId);

    return json(results);
  } catch (error) {
    console.error("GET votes error:", error);
    return json({ error: "Unable to load votes." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return json({ error: "Database not connected." }, 500);
    }

    const body = await request.json();

    const storyId = body.storyId?.trim();
    const voterId = body.voterId?.trim();
    const voteType = body.voteType?.trim().toLowerCase();

    if (
      !storyId || storyId.length > 200 ||
      !voterId || voterId.length > 100 ||
      !VALID_VOTES.includes(voteType)
    ) {
      return json({ error: "Invalid vote information." }, 400);
    }

    await env.DB.prepare(`
      INSERT INTO individual_votes
        (story_id, voter_id, vote_type)
      VALUES (?, ?, ?)
      ON CONFLICT(story_id, voter_id)
      DO UPDATE SET
        vote_type = excluded.vote_type,
        updated_at = CURRENT_TIMESTAMP
    `).bind(storyId, voterId, voteType).run();

    const results = await getResults(env.DB, storyId);

    return json({ success: true, ...results });
  } catch (error) {
    console.error("POST votes error:", error);
    return json({ error: "Unable to save vote." }, 500);
  }
}
