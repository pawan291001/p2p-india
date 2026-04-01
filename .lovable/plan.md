

# Real-Time Crypto News from Live Sources

## Problem
Current system uses AI to generate news, which can hallucinate. You want real, verified news from the last 2-4 hours only, with automatic cleanup of articles older than 4 days.

## Strategy: Free RSS Feeds + AI Processing

We'll scrape **free public RSS feeds** from major crypto news outlets (no API key needed), then use Lovable AI to categorize and summarize them.

### Data Sources (all free, no auth required)
- **CoinDesk** RSS: `https://www.coindesk.com/arc/outboundfeeds/rss/`
- **CoinTelegraph** RSS: `https://cointelegraph.com/rss`
- **Bitcoin Magazine** RSS: `https://bitcoinmagazine.com/feed`
- **Decrypt** RSS: `https://decrypt.co/feed`
- **The Block** RSS: `https://www.theblock.co/rss.xml`

These cover hacks, scams, regulatory actions, market moves, whale activity, and all major crypto events.

## Changes

### 1. Rewrite `generate-crypto-news` Edge Function
- Fetch RSS feeds from 5+ crypto news sources using native `fetch` (RSS is public XML)
- Parse XML to extract articles published in the **last 2 hours only**
- Skip any article older than 2 hours
- Use Lovable AI (Gemini Flash) to categorize each article and generate a clean summary
- Store the **original source URL** as a clickable link
- Deduplicate against existing titles in the database

### 2. Add Auto-Cleanup of Old Articles
- Before inserting new articles, delete all articles with `published_at` older than 4 days
- This keeps the feed fresh and the database clean

### 3. Update News UI
- Show the original source link prominently on each article card
- Add a "freshness" indicator (e.g., "2 hours ago" badge)
- Filter out any article older than 1 day from the frontend display as a safety net

### 4. Update `useCryptoNews` Hook
- Add a date filter to only fetch articles from the last 24 hours
- Keep realtime subscription for instant updates

## Technical Details

```text
Flow:
RSS Feeds (free) → Edge Function fetches XML → Parse articles from last 2h
  → Lovable AI categorizes + summarizes → Insert to crypto_news table
  → Delete articles older than 4 days → Frontend shows fresh news only
```

- RSS parsing: Use a lightweight XML parser (`DOMParser` available in Deno)
- No new API keys needed — RSS feeds are public
- Each article stores the real source URL in the `source` column
- Cron job continues running every hour

### Files to modify:
- `supabase/functions/generate-crypto-news/index.ts` — complete rewrite for RSS scraping
- `src/hooks/useCryptoNews.ts` — add 24h filter
- `src/pages/News.tsx` — add source link buttons
- `src/components/NewsSection.tsx` — minor freshness indicator
- Database migration: cleanup old articles via the edge function (no schema changes needed)

