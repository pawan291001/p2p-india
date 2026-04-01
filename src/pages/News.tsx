import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Newspaper, Clock, ArrowLeft, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCryptoNews } from "@/hooks/useCryptoNews";
import { formatDistanceToNow, format } from "date-fns";

const CATEGORIES = ["all", "bitcoin", "ethereum", "defi", "regulation", "market", "technology", "nft", "general"];

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

const News = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedArticleId = searchParams.get("article");
  const [category, setCategory] = useState("all");
  const { articles, isLoading } = useCryptoNews(50);

  const filtered = useMemo(() => {
    if (category === "all") return articles;
    return articles.filter((a) => a.category === category);
  }, [articles, category]);

  const selectedArticle = useMemo(() => {
    if (!selectedArticleId) return null;
    return articles.find((a) => a.id === selectedArticleId) || null;
  }, [articles, selectedArticleId]);

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground" onClick={() => setSearchParams({})}>
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Button>

          <Badge variant="outline" className={`text-xs mb-4 ${categoryColors[selectedArticle.category] || categoryColors.general}`}>
            {selectedArticle.category.toUpperCase()}
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
            {selectedArticle.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(selectedArticle.published_at), "MMM d, yyyy · h:mm a")}
            </div>
            <span>·</span>
            <span>{selectedArticle.source}</span>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
            {selectedArticle.content.split("\n").map((p, i) => (
              <p key={i} className="mb-4">{p}</p>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // News list view
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Crypto News</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            AI-powered crypto news updated every hour
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
              className="capitalize text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No articles found for this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((article) => (
              <button
                key={article.id}
                onClick={() => setSearchParams({ article: article.id })}
                className="w-full text-left rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-[10px] ${categoryColors[article.category] || categoryColors.general}`}>
                        {article.category.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default News;
