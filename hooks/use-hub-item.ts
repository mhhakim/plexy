import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import qs from "qs";
import { ServerApi } from "@/api";

export const getCoverImage = (url: string) => {
  const token = localStorage.getItem("token");
  const server = localStorage.getItem("server");
  return `${server}/photo/:/transcode?${qs.stringify({
    width: 300,
    height: 168,
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
    width: 300,
    height: 450,
    url: `${url}?X-Plex-Token=${token}`,
    minSize: 1,
    upscale: 1,
    "X-Plex-Token": token,
  })}`;
};

type Item = Plex.Metadata | Plex.HubMetadata;

type IsType = {
  episode: boolean;
  season: boolean;
  show: boolean;
  movie: boolean;
};

const extractIsType = (type: Plex.LibraryType): IsType => {
  const episode = type === "episode";
  const season = type === "season";
  const show = type === "show";
  const movie = type === "movie";
  return { episode, season, show, movie };
};

const extractGuidNumber = (inputString: string) => {
  const match = inputString.match(/plex:\/\/\w+\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const extractProgress = (isType: IsType, item: Item): number => {
  if (isType.movie || isType.episode) {
    if (item.viewOffset)
      return Math.floor((item.viewOffset / item.duration) * 100);
    if ((item.viewCount ?? 0) >= 1) return 100;
  }
  return 0;
};

const extractWatched = (
  isType: IsType,
  item: Item,
  progress: number,
): boolean => {
  if (isType.show || isType.season) {
    return item.leafCount === item.viewedLeafCount;
  }
  if (isType.movie || isType.episode) {
    return progress === 100;
  }
  return false;
};

const extractChildCount = (item: Item): number | null => {
  return item.childCount ?? null;
};

const extractLeafCount = (item: Item): number | null => {
  return item.leafCount ?? null;
};

type ItemDuration = {
  total: number; // total minute
  minutes: number; // minutes without hours
  hours: number; // hours
};

const extractDuration = (isType: IsType, item: Item): ItemDuration | null => {
  if (isType.movie || isType.episode) {
    const total = Math.floor(item.duration / 1000 / 60);
    const hours = Math.floor(total / 60);
    return { total, hours, minutes: total - hours * 60 };
  }
  return null;
};

const extractCoverImage = (isType: IsType, item: Item): string => {
  if (isType.movie || isType.episode) {
    return getCoverImage(item.art);
  }
  return getCoverImage(item.grandparentArt ?? item.art);
};

const extractPosterImage = (isType: IsType, item: Item): string => {
  if (isType.episode) {
    return getPosterImage(
      item.parentThumb ?? item.grandparentThumb ?? item.thumb,
    );
  }
  if (isType.season) {
    return getPosterImage(item.thumb ?? item.parentThumb);
  }
  return getPosterImage(item.thumb);
};

type Playable = {
  season: number | null;
  episode: number | null;
  viewOffset: number | null;
  ratingKey: number | string | null;
};

const extractPlayable = (isType: IsType, item: Item): Playable => {
  let viewOffset = item.viewOffset ?? null;
  let ratingKey = item.ratingKey;
  let episode = null;
  let season = null;
  if ((isType.show || isType.season) && item.OnDeck?.Metadata) {
    if (item.Children?.size) {
      season = item.OnDeck.Metadata.parentIndex ?? null;
    }
    episode = item.OnDeck.Metadata.index ?? null;
    viewOffset = item.OnDeck.Metadata.viewOffset ?? null;
    ratingKey = item.OnDeck.Metadata.ratingKey ?? null;
  }
  return { viewOffset, ratingKey, episode, season };
};

const extractQuality = (isType: IsType, item: Item): string | null => {
  if ((isType.movie || isType.episode) && item.Media && item.Media.length > 0) {
    return item.Media[0].videoResolution;
  }
  return null;
};

export const useHubItem = (item: Item) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isType = extractIsType(item.type);
  const coverImage = extractCoverImage(isType, item);
  const posterImage = extractPosterImage(isType, item);

  const guid = extractGuidNumber(item.guid);
  const progress = extractProgress(isType, item);
  const watched = extractWatched(isType, item, progress);
  const childCount = extractChildCount(item);
  const leafCount = extractLeafCount(item);
  const duration = extractDuration(isType, item);
  const playable = extractPlayable(isType, item);
  const quality = extractQuality(isType, item);

  const open = () => {
    if (searchParams.get("mid") !== item.ratingKey) {
      router.push(`${pathname}?mid=${item.ratingKey}`, {
        scroll: false,
      });
    }
  };

  const play = () => {
    if (!playable.ratingKey) return;

    router.push(
      `${pathname}?watch=${playable.ratingKey}${playable.viewOffset ? `&t=${playable.viewOffset}` : ""}`,
      { scroll: false },
    );
  };

  return {
    isEpisode: isType.episode,
    isSeason: isType.season,
    isShow: isType.show,
    isMovie: isType.movie,
    guid,
    watched,
    progress,
    childCount,
    leafCount,
    duration,
    quality,
    coverImage,
    posterImage,
    play,
    open,
  };
};
