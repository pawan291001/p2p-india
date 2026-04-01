import { Link } from "react-router-dom";
import { Newspaper, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCryptoNews } from "@/hooks/useCryptoNews";
import { formatDistanceToNow } from "date-fns";

const categoryColors: Record<string, string> = {
  bitcoin: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  ethereum: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  defi: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  regulation: "bg-red-500/10 text-red-500 border-red-500/20",
  market: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  technology: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  nft: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  general: "bg-muted text-muted-foreground border-border",
};

const NewsSection = () => {
  const { articles, isLoading } = useCryptoNews(3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Crypto Daily News</h2>
            <p className="text-sm text-muted-foreground">AI-powered updates every hour</p>
          </div>
        </div>
        <Link to="/news">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="h-4 w-20 rounded bg-muted mb-3" />
              <div className="h-5 w-full rounded bg-muted mb-2" />
              <div className="h-4 w-3/4 rounded bg-muted mb-4" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">News articles are being generated. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/news?article=${article.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <Badge variant="outline" className={`text-[10px] mb-3 ${categoryColors[article.category] || categoryColors.general}`}>
                {article.category.toUpperCase()}
              </Badge>
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {article.summary}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </div>
                {article.source && article.source.startsWith("http") && (
                  <span className="text-primary truncate max-w-[120px]">
                    {(() => { try { return new URL(article.source).hostname.replace("www.", ""); } catch { return "Source"; } })()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default NewsSection;
