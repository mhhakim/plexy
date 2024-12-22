import { FC } from "react";
import { durationToText } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { VideoItemInterface } from "@/type";

export const VideoItem: FC<{ item: VideoItemInterface }> = ({ item }) => {
  const router = useRouter();
  const pathname = usePathname();

  const watched =
    (item.type === "show" && item.leafCount === item.viewedLeafCount) ||
    (item.type === "movie" && item?.viewCount && item.viewCount > 0);
  const seasons =
    item.childCount && item.childCount > 1 ? `${item.childCount} Seasons` : "";
  const episodes = item.leafCount
    ? `${item.leafCount} Episode${item.leafCount > 1 ? "s" : ""}`
    : "";
  const rating = item.contentRating ?? "";
  const duration =
    item.duration && (item.type === "episode" || item.type === "movie")
      ? durationToText(item.duration)
      : "";
  const mid =
    item.grandparentRatingKey && item.type === "episode"
      ? item.grandparentRatingKey
      : item.ratingKey.toString();

  return (
    <button
      className="group aspect-video rounded"
      style={{
        background: `linear-gradient(0, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.5)), url(${item.image}) center center / cover no-repeat`,
      }}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        router.push(`${pathname}?mid=${mid}`);
      }}
    >
      <div className="relative w-full h-full flex flex-col">
        {watched && (
          <div className="absolute top-0 px-4 pt-4 w-full max-w-full flex flex-row items-center justify-end gap-2">
            <span className="lg:group-hover:opacity-100 opacity-0 font-bold uppercase duration-300 ease-in-out transition text-xs">
              watched
            </span>
            <CircleCheck />
          </div>
        )}
        <div className="flex-1"></div>
        <div className="absolute bottom-0 px-4 py-2 w-full max-w-full text-left">
          <p className="font-bold truncate lg:text-lg text-sm text-plex flex flex-row items-center gap-2 uppercase">
            {item.type}
          </p>
          <p className="font-bold truncate lg:text-lg text-normal">
            {item.title}
          </p>
          <p className="w-full max-w-full truncate lg:text-lg text-sm text-muted-foreground flex flex-row items-center gap-2">
            {(episodes || seasons) && (
              <span className="font-bold">{seasons || episodes}</span>
            )}
            {duration && <span className="font-bold">{duration}</span>}
            {rating && (
              <span className="lg:block hidden border-2 border-muted-foreground rounded-sm px-1 py-0.5 font-bold text-sm">
                {rating}
              </span>
            )}
            <span className="flex-1" />
            <span className="text-xs font-bold">{item.year}</span>
          </p>
        </div>
      </div>
    </button>
  );
};
