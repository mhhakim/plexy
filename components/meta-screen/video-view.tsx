import { FC, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { VideoItemInterface } from "@/type";
import { Progress } from "@/components/ui/progress";
import { ServerApi } from "@/api";

export const VideoView: FC<{ item: VideoItemInterface }> = ({ item }) => {
  const router = useRouter();
  const pathname = usePathname();

  const mid = item.ratingKey.toString();

  const title = useMemo(() => {
    if (item.type === "movie" || item.type === "show") {
      return item.title;
    }

    if (item.type === "season") {
      return item.parentTitle ?? item.title;
    }

    if (item.type === "episode") {
      return item.grandparentTitle ?? item.parentTitle ?? item.title;
    }

    return item.title;
  }, [item]);

  const handlePlay = () => {
    if (item.type === "movie") {
      router.push(
        `${pathname}?watch=${item.ratingKey}${item.viewOffset ? `&t=${item.viewOffset}` : ""}`,
        { scroll: false },
      );
      return;
    }

    if (item.type === "episode") {
      router.push(
        `${pathname}?watch=${item.ratingKey.toString()}${item.viewOffset ? `&t=${item.viewOffset}` : ""}`,
        { scroll: false },
      );
      return;
    }

    if (item.type === "show" || item.type === "season") {
      if (item.OnDeck && item.OnDeck.Metadata) {
        router.push(
          `${pathname}?watch=${item.OnDeck.Metadata.ratingKey}${
            item.OnDeck.Metadata.viewOffset
              ? `&t=${item.OnDeck.Metadata.viewOffset}`
              : ""
          }`,
          { scroll: false },
        );
        return;
      }

      const season =
        item.type === "season"
          ? item
          : item.Children?.Metadata.find((s) => s.title !== "Specials");
      if (!season) return;

      ServerApi.children({
        id: season.ratingKey as string,
      }).then((eps) => {
        if (!eps) return;

        router.push(`${pathname}?watch=${eps[0].ratingKey}`, {
          scroll: false,
        });
        return;
      });
    }
  };

  return (
    <button
      className="group rounded w-full h-full flex flex-col"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (item.type === "episode" || item.type === "movie") {
          handlePlay();
        } else {
          router.push(`${pathname}?mid=${mid}`, { scroll: false });
        }
      }}
    >
      <div
        className="relative aspect-video w-full flex flex-col rounded-t"
        style={{
          background: `url(${item.image}) center center / cover no-repeat`,
        }}
      >
        {(item.viewOffset || (item.viewCount && item.viewCount >= 1)) && (
          <Progress
            className="absolute rounded-t-none rounded-b bottom-0 left-0 h-[4px]"
            value={
              item.viewOffset
                ? Math.floor((item.viewOffset / item.duration) * 100)
                : 100
            }
          />
        )}
      </div>
      <div className="bg-secondary/40 rounded-b w-full p-4 text-left text-muted-foreground font-semibold flex-1 flex flex-col gap-1.5">
        <p className="uppercase text-sm text-plex font-semibold">
          {item.type} {item.type === "season" && item.index}
          {item.type === "episode" && item.index}
        </p>
        <p className="font-semibold truncate lg:text-lg text-normal">{title}</p>
        {item.type === "episode" && (
          <>
            <p className="text-xs">Season {item.parentIndex}</p>
            <p className="text-sm">{item.title}</p>
          </>
        )}
        {item.type === "season" && item.leafCount !== undefined && (
          <p className="text-xs">
            {item.leafCount} Episode{item.leafCount > 0 ? "s" : ""}
          </p>
        )}
        <p className="line-clamp-6 text-sm sm:text-md">{item.summary}</p>
        <div className="flex-1" />
        {(item.contentRating || item.year) && (
          <p className="w-full max-w-full font-semibold t-sm truncate text-md text-muted-foreground flex flex-row items-center gap-2">
            {item.contentRating && (
              <span className="border border-muted-foreground rounded-sm px-1 font-bold text-sm">
                {item.contentRating}
              </span>
            )}
            <span className="flex-1" />
            <span>{item.year}</span>
          </p>
        )}
      </div>
    </button>
  );
};
