import { FC, useMemo } from "react";
import { durationToText } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { VideoItemInterface } from "@/type";
import { PlayIcon } from "@/components/icons/play-icon";

export const VideoItem: FC<{ item: VideoItemInterface }> = ({ item }) => {
  const router = useRouter();
  const pathname = usePathname();

  const watched =
    (item.type === "show" && item.leafCount === item.viewedLeafCount) ||
    (item.type === "movie" && item?.viewCount && item.viewCount > 0);
  const duration =
    item.duration && (item.type === "episode" || item.type === "movie")
      ? durationToText(item.duration)
      : "";
  const mid =
    item.grandparentRatingKey && item.type === "episode"
      ? item.grandparentRatingKey
      : item.ratingKey.toString();

  const show = useMemo(() => {
    const s =
      item.childCount && item.childCount > 1
        ? `${item.childCount} Seasons`
        : "";
    const e = item.leafCount
      ? `${item.leafCount} Episode${item.leafCount > 1 ? "s" : ""}`
      : "";
    return { episodes: e, seasons: s };
  }, [item]);

  return (
    <button
      className="group rounded w-full h-full flex flex-col"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        router.push(`${pathname}?mid=${mid}`, { scroll: false });
      }}
    >
      <div
        className="relative aspect-video w-full flex flex-col rounded-t"
        style={{
          background: `linear-gradient(0, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), url(${item.image}) center center / cover no-repeat`,
        }}
      >
        {watched && (
          <div className="absolute top-0 px-4 pt-4 w-full max-w-full font-bold flex flex-row items-center justify-end gap-2">
            {(show.episodes || show.seasons) && (
              <span>{show.seasons || show.episodes}</span>
            )}
            {duration && <span>{duration}</span>}
          </div>
        )}
        <div className="absolute bottom-0 px-4 py-2 w-full max-w-full text-left">
          <p className="font-bold truncate lg:text-lg text-normal">
            {item.title}
          </p>
        </div>
      </div>
      <div className="bg-secondary/40 rounded-b p-4 text-left text-muted-foreground font-semibold flex-1 flex flex-col gap-4">
        <p className="w-full max-w-full font-semibold t-sm truncate text-md text-muted-foreground flex flex-row items-center gap-2">
          {item.contentRating && (
            <span className="border border-muted-foreground rounded-sm px-1 font-bold text-sm">
              {item.contentRating}
            </span>
          )}
          <span className="flex-1" />
          <span>{item.year}</span>
        </p>
        <p className="line-clamp-6 text-sm sm:text-md">{item.summary}</p>
      </div>
    </button>
  );
};
