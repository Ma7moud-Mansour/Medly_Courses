import { Star } from "lucide-react";

export function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);

  return (
    <span className="inline-flex items-center gap-1 text-[#f2b84b]" aria-label={`تقييم ${rating}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={index < rounded ? "h-4 w-4 fill-current" : "h-4 w-4 text-[#d8e0de]"}
        />
      ))}
    </span>
  );
}
