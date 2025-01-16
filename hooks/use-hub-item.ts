import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { durationToText } from "@/lib/utils";
import qs from "qs";
import { ServerApi } from "@/api";

export const getCoverImage = (url: string) => {
  const token = localStorage.getItem("token");
  const server = localStorage.getItem("server");
  return `${server}/photo/:/transcode?${qs.stringify({
    width: 300 * 2,
    height: 170 * 2,
    url: `${url}?X-Plex-Token=${token}`,
    minSize: 1,
    upscale: 1,
    "X-Plex-Token": token,
  })}`;
};

export const getPosterImage = (url: string) => {
  const token = localStorage.getItem("token");
  const server = localStorage.getItem("server");
  return `${server}/photo/:/transcode?${qs.stringify({
    width: 300 * 2,
    height: 450 * 2,
    url: `${url}?X-Plex-Token=${token}`,
    minSize: 1,
    upscale: 1,
    "X-Plex-Token": token,
  })}`;
};

export const useHubItem = (item: Plex.HubMetadata) => {
  const router = useRouter();
  const pathname = usePathname();

  const info = useMemo(() => {
    const isEpisode = item.type === "episode";
    const isSeason = item.type === "season";
    const isShow = item.type === "show";
    const isMovie = item.type === "movie";

    const watched =
      (item.type === "show" && item.leafCount === item.viewedLeafCount) ||
      (item.type === "movie" && item?.viewCount && item.viewCount > 0);
    const seasons =
      item.childCount && item.childCount > 1
        ? `${item.childCount} Seasons`
        : "";
    const episodes = item.leafCount
      ? `${item.leafCount} Episode${item.leafCount > 1 ? "s" : ""}`
      : "";
    const duration =
      item.duration && (isEpisode || isMovie)
        ? durationToText(item.duration)
        : null;
    const mid = item.ratingKey.toString();
    const coverImage = (() => {
      if (item.type === "movie" || item.type === "episode") {
        return getCoverImage(item.art);
      }

      return getCoverImage(item.grandparentArt ?? item.art);
    })();
    const thumbImage = (() => {
      if (item.type === "episode") {
        return getPosterImage(
          item.parentThumb ?? item.grandparentThumb ?? item.thumb,
        );
      }

      if (item.type === "season") {
        return getPosterImage(item.thumb ?? item.parentThumb);
      }

      return getCoverImage(item.thumb);
    })();
    const progress =
      (item.type === "episode" || item.type === "movie") &&
      (item.viewOffset || (item.viewCount && item.viewCount >= 1))
        ? item.viewOffset
          ? Math.floor((item.viewOffset / item.duration) * 100)
          : 100
        : 0;

    return {
      mid,
      duration,
      episodes,
      seasons,
      watched,
      thumbImage,
      progress,
      coverImage,
      isEpisode,
      isSeason,
      isShow,
      isMovie,
    };
  }, [item]);

  const open = useCallback(() => {
    router.push(`${pathname}?mid=${item.ratingKey}`, {
      scroll: false,
    });
  }, [item]);

  const play = useCallback(() => {
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
  }, [item]);

  return {
    info,
    play,
    open,
  };
};
