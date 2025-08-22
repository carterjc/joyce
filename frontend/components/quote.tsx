import { QuoteKeys, quotes } from "../lib/quotes";

interface Props {
  slug: QuoteKeys;
  size?: "small" | "large";
}

export function Quote({ slug, size = "small" }: Props) {
  const quoteItem = quotes[slug];
  if (quoteItem == null) throw new Error("quote not found");

  const { author, quote, work } = quoteItem;
  const textSize = size === "large" ? "text-sm" : "text-xs";
  return (
    <div className={size === "large" ? "epigraph text-muted-foreground max-w-2xl mx-auto mb-6" : ""}>
      <p className={`${textSize} text-muted-foreground italic text-center leading-relaxed`}>&ldquo;{quote}&rdquo;</p>
      <p className={`${textSize} text-muted-foreground text-center mt-1 opacity-75`}>
        - {author}, <em>{work}</em>
      </p>
    </div>
  );
}
