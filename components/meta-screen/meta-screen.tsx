"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ServerApi } from "@/api";
import { PLEX } from "@/constants";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ReactPlayer from "react-player";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import qs from "qs";
import { Button } from "@/components/ui/button";
import { CircleCheck, Volume2, VolumeX, X } from "lucide-react";
import Image from "next/image";
import { durationToText } from "@/lib/utils";
import { create } from "zustand";
import { VideoItem } from "@/components/video-item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EpisodeView } from "@/components/meta-screen/episode-view";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PreviewPlayerState {
  MetaScreenPlayerMuted: boolean;
  setMetaScreenPlayerMuted: (value: boolean) => void;
}

export const usePreviewPlayer = create<PreviewPlayerState>((set) => ({
  MetaScreenPlayerMuted: true,
  setMetaScreenPlayerMuted: (value) => set({ MetaScreenPlayerMuted: value }),
}));

export const MetaScreen: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mid = searchParams.get("mid");
  const { MetaScreenPlayerMuted, setMetaScreenPlayerMuted } =
    usePreviewPlayer();

  const metadata = useQuery({
    queryKey: ["metadata", mid],
    queryFn: async () => {
      if (!mid) return null;
      return ServerApi.metadata({ id: mid });
    },
  });
  const similar = useQuery({
    queryKey: ["similar", mid],
    queryFn: async () => await ServerApi.similar({ id: mid }),
  });

  const [season, setSeason] = useState<number>(0);
  const [episodes, setEpisodes] = useState<{
    value: Plex.Metadata[];
    count: number;
  } | null>(null);

  const [languages, setLanguages] = useState<string[] | null>(null);
  const [subtitles, setSubtitles] = useState<string[] | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    setEpisodes(null);
    setSeason(0);
    setLanguages(null);
    setSubtitles(null);
    setPreview(null);
    setPlaying(false);
  }, [metadata.data?.ratingKey]);

  useEffect(() => {
    if (!metadata.data) return;
    setSeason(0);

    const extras = metadata.data.Extras?.Metadata;
    if (!extras?.[0] || !extras?.[0]?.Media?.[0]?.Part?.[0]?.key) return;

    setPreview(
      `${PLEX.server}${
        extras?.[0]?.Media?.[0]?.Part?.[0]?.key
      }&X-Plex-Token=${token}`,
    );

    const timeout = setTimeout(() => {
      setPlaying(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [metadata.data]);

  useEffect(() => {
    if (languages || subtitles) return;
    if (!metadata.data) return;

    if (metadata.data.type === "show") {
      if (!episodes) return;

      // get the first episode to get the languages and subtitles
      // you need to request the full metadata for the episode to get the media info
      ServerApi.metadata({ id: episodes.value[0].ratingKey }).then((data) => {
        const streams = data?.Media?.[0]?.Part?.[0]?.Stream || null;
        if (!streams) return;

        setLanguages(
          Array.from(
            new Set(
              streams
                .filter((stream) => stream.language && stream.streamType === 2)
                .map((stream) => stream.language ?? stream.displayTitle),
            ),
          ),
        );
        setSubtitles(
          Array.from(
            new Set(
              streams
                .filter((stream) => stream.language && stream.streamType === 3)
                .map((stream) => stream.language),
            ),
          ),
        );
      });
    } else if (metadata.data.type === "movie") {
      const streams = metadata.data?.Media?.[0]?.Part?.[0]?.Stream || null;
      if (!streams) return;

      setLanguages(
        Array.from(
          new Set(
            streams
              .filter((stream) => stream.language && stream.streamType === 2)
              .map((stream) => stream.language ?? stream.displayTitle),
          ),
        ),
      );
      setSubtitles(
        Array.from(
          new Set(
            streams
              .filter((stream) => stream.language && stream.streamType === 3)
              .map((stream) => stream.language),
          ),
        ),
      );
    }
  }, [metadata.data?.ratingKey, episodes]);

  useEffect(() => {
    setEpisodes(null);
    if (!metadata.data) return;
    if (metadata.data.type !== "show") return;
    if (!metadata.data?.Children?.Metadata[season]?.ratingKey) return;

    ServerApi.children({
      id: metadata.data.Children.Metadata[season].ratingKey,
    }).then((data) => {
      if (data) {
        setEpisodes({
          value: data,
          count: data.reduce((max, e) => {
            if (!e.index) return max;
            const v = e.index === 0 ? 1 : Math.abs(e.index).toString().length;
            return max < v ? v : max;
          }, 0),
        });
      } else {
        setEpisodes(null);
      }
    });
  }, [season, metadata.data?.ratingKey]);

  const duration = useMemo(
    () =>
      metadata.data?.duration &&
      (metadata.data?.type === "episode" || metadata.data?.type === "movie")
        ? durationToText(metadata.data?.duration)
        : "",
    [metadata.data],
  );

  const watched = useMemo(() => {
    if (!metadata.data) return false;

    const meta = metadata.data;

    if (meta.type === "show" && meta.leafCount === meta?.viewedLeafCount) {
      return true;
    }

    if (meta.type === "movie" && meta.viewCount) {
      return true;
    }

    return false;
  }, [metadata.data]);

  const show = useMemo(() => {
    const s =
      metadata.data?.childCount && metadata.data?.childCount > 1
        ? `${metadata.data?.childCount} Seasons`
        : "";
    const e = metadata.data?.leafCount
      ? `${metadata.data?.leafCount} Episode${metadata.data?.leafCount > 1 ? "s" : ""}`
      : "";
    return { episodes: e, seasons: s };
  }, [metadata.data]);

  return (
    <Dialog open={!!mid}>
      <DialogContent className="w-full p-0 max-w-[min(1500px,calc(100%-2rem))] h-full max-h-[calc(100%-2rem)] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Item metadata dialog</DialogTitle>
        </VisuallyHidden>
        {metadata.data && (
          <ScrollArea>
            <div className="max-w-full rounded-lg h-full overflow-auto relative">
              {metadata.data.art ? (
                <div className="absolute top-0 right-0 left-0 z-0 max-w-full">
                  {playing ? (
                    <ReactPlayer
                      url={preview!}
                      controls={false}
                      width="100%"
                      height="100%"
                      autoplay={true}
                      playing={playing}
                      volume={MetaScreenPlayerMuted ? 0 : 0.5}
                      muted={MetaScreenPlayerMuted}
                      onEnded={() => setPlaying(false)}
                      pip={false}
                      config={{
                        file: {
                          attributes: { disablePictureInPicture: true },
                        },
                      }}
                    />
                  ) : (
                    <img
                      className="w-full"
                      src={`${PLEX.server}/photo/:/transcode?${qs.stringify({
                        width: 300 * 4,
                        height: 170 * 4,
                        url: `${metadata.data.art}?X-Plex-Token=${token}`,
                        minSize: 1,
                        upscale: 1,
                        "X-Plex-Token": token,
                      })}`}
                      alt="preview image"
                    />
                  )}
                  <div
                    className="absolute top-0 left-0 right-0 bottom-0"
                    style={{
                      background:
                        "linear-gradient(0, hsl(var(--background)), rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4))",
                    }}
                  />
                  <div className="absolute top-0 right-0 m-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.replace(pathname)}
                      type="button"
                    >
                      <X />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setMetaScreenPlayerMuted(!MetaScreenPlayerMuted);
                      }}
                      type="button"
                    >
                      {MetaScreenPlayerMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="absolute top-0 right-0 m-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.replace(pathname)}
                    type="button"
                  >
                    <X />
                  </Button>
                </div>
              )}
              <div className="relative md:mt-96 mt-56 z-50">
                <div className="px-20 pt-0 pb-20 flex flex-col gap-6">
                  <div className="flex flex-row gap-6 items-center justify-start">
                    <img
                      className="hidden [@media(min-width:1200px)]:block rounded w-[300px] h-[450px] object-cover"
                      src={`${PLEX.server}/photo/:/transcode?${qs.stringify({
                        width: 300,
                        height: 450,
                        url: `${metadata.data.thumb}?X-Plex-Token=${token}`,
                        minSize: 1,
                        upscale: 1,
                        "X-Plex-Token": token,
                      })}`}
                      alt="element poster"
                    />
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-row items-center justify-start gap-2">
                          <Image
                            src="/plexicon.png"
                            alt="plex icon"
                            width={35}
                            height={35}
                          />
                          <p className="text-plex text-2xl font-bold drop-shadow-md uppercase tracking-wider">
                            {metadata.data.type}
                          </p>
                        </div>
                        <p className="font-bold text-5xl">
                          {metadata.data.title}
                        </p>
                        <p className="font-bold text-muted-foreground max-w-4xl line-clamp-3 flex flex-row items-center gap-4">
                          {metadata.data?.contentRating && (
                            <span className="border-2 border-muted-foreground rounded-sm px-1 py-0.5 font-bold text-sm">
                              {metadata.data?.contentRating}
                            </span>
                          )}
                          <span>{metadata.data.year}</span>
                          {duration && <span>{duration}</span>}
                          {(show.seasons || show.episodes) && (
                            <span>{show.seasons || show.episodes}</span>
                          )}
                        </p>
                      </div>
                      {watched && (
                        <p className="text-plex uppercase flex flex-row items-center gap-2 font-bold">
                          <CircleCheck />
                          <span>watched</span>
                        </p>
                      )}
                      <p className="font-bold text-muted-foreground max-w-4xl line-clamp-3">
                        {metadata.data.summary}
                      </p>
                      <div>
                        {metadata.data.Genre &&
                          metadata.data.Genre.length > 0 && (
                            <div className="font-bold line-clamp-1">
                              <span className="text-muted-foreground pr-4">
                                Genre
                              </span>
                              {metadata.data.Genre.map((genre, i, arr) => (
                                <span key={genre.tag}>
                                  {genre.tag}
                                  {i !== arr.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        {languages && languages.length > 0 && (
                          <div className="font-bold line-clamp-2">
                            <span className="text-muted-foreground pr-4">
                              Audio
                            </span>
                            {languages?.map((lang, i, arr) => (
                              <span key={lang}>
                                {lang}
                                {i !== arr.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        {subtitles && subtitles.length > 0 && (
                          <div className="font-bold line-clamp-2">
                            <span className="text-muted-foreground pr-4">
                              Subtitle
                            </span>
                            {subtitles?.map((lang, i, arr) => (
                              <span key={lang}>
                                {lang}
                                {i !== arr.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {metadata.data.type === "movie" && (
                    <div className="flex flex-col gap-6">
                      <p className="font-bold text-2xl">Similar Movies</p>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {similar.status === "pending" &&
                          Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-video" />
                          ))}
                        {similar.status === "success" &&
                          similar.data.slice(0, 20).map((item, i) => (
                            <VideoItem
                              key={i}
                              item={{
                                ...item,
                                image: `${PLEX.server}/photo/:/transcode?${qs.stringify(
                                  {
                                    width: 300 * 2,
                                    height: 170 * 2,
                                    url: `${item.art}?X-Plex-Token=${token}`,
                                    minSize: 1,
                                    upscale: 1,
                                    "X-Plex-Token": token,
                                  },
                                )}`,
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                  {metadata.data.type === "show" && (
                    <div className="flex flex-col gap-6">
                      {metadata.data.Children && (
                        <div className="flex flex-row items-center w-full">
                          <p className="text-2xl font-bold">
                            {metadata.data.Children.size > 1
                              ? metadata.data.Children.Metadata[season].title
                              : show.episodes}
                          </p>
                          <div className="flex-1" />
                          {metadata.data.Children.size > 1 && (
                            <Select
                              onValueChange={(value) =>
                                setSeason(Number(value))
                              }
                              value={season.toString()}
                            >
                              <Button
                                asChild
                                variant="secondary"
                                className="w-min"
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a season" />
                                </SelectTrigger>
                              </Button>
                              <SelectContent>
                                {metadata.data.Children.Metadata.map(
                                  (season, i) => (
                                    <SelectItem
                                      className="text-left"
                                      key={i}
                                      value={i.toString()}
                                    >
                                      {season.title}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}
                      {!episodes && (
                        <div className="flex flex-col w-fu;;">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex flex-row items-center p-4 group transition hover:bg-secondary w-full border-b-2 justify-start text-left"
                            >
                              <Skeleton className="w-[8px] h-[28px] mr-4" />
                              <div className="pr-4 min-w-[150px] w-[150px] sm:min-w-[200px] sm:w-[200px] md:min-w-[250px] md:w-[250px] relative">
                                <Skeleton className="aspect-video w-full" />
                              </div>
                              <div className="w-full">
                                <Skeleton className="w-full sm:w-[200px] h-[22px] mb-1" />
                                <Skeleton className="h-[22px] w-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {episodes && (
                        <div className="flex flex-col w-full">
                          {episodes.value.map((item, i) => (
                            <EpisodeView
                              key={i}
                              count={episodes.count}
                              item={{
                                ...item,
                                image: `${PLEX.server}/photo/:/transcode?${qs.stringify(
                                  {
                                    width: 16 * 20,
                                    height: 9 * 20,
                                    url: `${item.thumb}?X-Plex-Token=${token}`,
                                    minSize: 1,
                                    upscale: 1,
                                    "X-Plex-Token": token,
                                  },
                                )}`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
