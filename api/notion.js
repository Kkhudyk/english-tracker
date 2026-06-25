const VOCAB_DB = "54062d676a5044fdbf626ca6c1dbf6ab";
const GOALS_DB = "a5502e630cb742d9ae0206a8a4d1ecfb";
const LOG_DB   = "38a0f369dc668024b628f3983d221cf9";

async function queryDatabase(dbId, token) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Notion API error");
  return data.results;
}

function getProp(props, name, type) {
  const p = props[name];
  if (!p) return null;
  if (type === "title") return p.title?.map(t => t.plain_text).join("") || "";
  if (type === "select") return p.select?.name || "";
  if (type === "date") return p.date?.start?.slice(0, 10) || "";
  if (type === "created_time") return p.created_time?.slice(0, 10) || "";
  if (type === "rich_text") return p.rich_text?.map(t => t.plain_text).join("") || "";
  if (type === "number") return p.number ?? 0;
  return null;
}

export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: "NOTION_TOKEN not configured" });

  try {
    const [vocabPages, goalPages, logPages] = await Promise.all([
      queryDatabase(VOCAB_DB, token),
      queryDatabase(GOALS_DB, token),
      queryDatabase(LOG_DB, token),
    ]);

    const words = vocabPages.map(p => {
      const props = p.properties;
      return {
        word: getProp(props, "Word", "title"),
        translation: getProp(props, "Translation", "rich_text"),
        category: getProp(props, "Category", "select"),
        dateAdded: getProp(props, "Date Added", "created_time"),
        example: getProp(props, "Example Sentence", "rich_text"),
        phrase: getProp(props, "Memory Phrase", "rich_text"),
      };
    });

    const goals = goalPages.map(p => {
      const props = p.properties;
      return {
        month: getProp(props, "Month", "title"),
        wordsTarget: getProp(props, "Words Target", "number"),
        hoursTarget: getProp(props, "Study Hours Target", "number"),
        daysTarget: getProp(props, "Days Target", "number"),
      };
    });

    const sessions = logPages.map(p => {
      const props = p.properties;
      return {
        date: getProp(props, "Date", "date"),
        duration: getProp(props, "Duration", "number"),
      };
    }).filter(s => s.date);

    const currentMonth = new Date().toISOString().slice(0, 7);

    return res.status(200).json({ words, goals, sessions, currentMonth });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
