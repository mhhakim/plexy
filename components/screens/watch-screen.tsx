"use client";

import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { ServerApi, streamprops } from "@/api";
import qs from "qs";
import { createPortal } from "react-dom";
import { clearAllBodyScrollLocks, disableBodyScroll } from "body-scroll-lock";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  LoaderCircle,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  SkipForward,
  SlidersHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoSeekSlider } from "react-video-seek-slider";
import "react-video-seek-slider/styles.css";
import { getFormatedTime } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { getCoverImage } from "@/hooks/use-hub-item";

export const WatchScreen: FC<{ watch: string | undefined }> = ({ watch }) => {
  const router = useRouter();
  const pathname = usePathname();
  const container = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const [metadata, setMetadata] = useState<Plex.Metadata | null>(null);
  const [playQueue, setPlayQueue] = useState<Plex.Metadata[] | null>(null); // [current, ...next]
  const player = useRef<ReactPlayer | null>(null);
  const [quality, setQuality] = useState<{
    bitrate?: number;
    auto?: boolean;
  }>({
    ...(localStorage.getItem("quality") && {
      bitrate: parseInt(localStorage.getItem("quality") ?? "10000"),
    }),
    auto: false,
  });
  const [volume, setVolume] = useState<number>(
    parseInt(localStorage.getItem("volume") ?? "100"),
  );
  const lastAppliedTime = useRef<number>(0);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const seekToAfterLoad = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isMuted, setIsMuted] = useState(
    localStorage.getItem("is_watch_muted") === "true",
  );
  const [buffering, setBuffering] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [pendingRefresh, setPendingRefresh] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [nextUrl, setNextUrl] = useState<string>("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [isPipAvailable, setIsPipAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (!url && !!nextUrl) {
      setUrl(nextUrl);
      setNextUrl("");
    }
  }, [url, nextUrl]);

  const video = useMemo(() => {
    if (!ready) return null;

    return document.querySelector("video");
  }, [ready]);

  const loaded = () =>
    `${localStorage.getItem("server")}/video/:/transcode/universal/start.mpd?${qs.stringify(
      {
        ...streamprops({
          id: watch ?? "",
          limitation: {
            ...(quality.bitrate && {
              maxVideoBitrate: quality
                ? quality.bitrate
                : parseInt(localStorage.getItem("quality") ?? "10000"),
            }),
          },
        }),
      },
    )}`;

  const loadMetadata = async (id: string) => {
    setIsLoadingMetadata(true);
    let Metadata: Plex.Metadata | null = null;
    await ServerApi.metadata({ id }).then((metadata) => {
      if (!metadata) return;

      Metadata = metadata;
      if (metadata.type === "movie" || metadata.type === "episode") {
        setMetadata(metadata);
        if (metadata.type === "episode") {
          ServerApi.metadata({
            id: metadata.grandparentRatingKey as string,
          });
        }
      } else {
        console.error("Invalid metadata type");
      }
    });

    if (!Metadata) return;

    await ServerApi.decision({
      id,
      limitation: {
        maxVideoBitrate: quality.bitrate,
        autoAdjustQuality: quality.auto,
      },
    });

    const serverPreferences = await ServerApi.preferences();

    if (serverPreferences) {
      ServerApi.queue({
        uri: `server://${
          serverPreferences.machineIdentifier
        }/com.plexapp.plugins.library/library/metadata/${
          (Metadata as Plex.Metadata).ratingKey
        }`,
      }).then((queue) => {
        setPlayQueue(queue);
      });
    }

    setIsLoadingMetadata(false);
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const move = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    const exit = () => {
      clearTimeout(timeout);
      setShowControls(false);
    };

    document.addEventListener("mouseleave", exit);
    document.addEventListener("mousemove", move);
    return () => {
      document.removeEventListener("mouseleave", exit);
      document.removeEventListener("mousemove", move);
    };
  }, []);

  const timeline = (state: "playing" | "stopped" | "paused" | "buffering") => {
    if (player.current && watch) {
      ServerApi.timeline({
        id: parseInt(watch),
        duration: Math.floor(player.current.getDuration()) * 1000,
        state: state,
        time: Math.floor(progress) * 1000,
      }).then();
    }
  };

  useEffect(() => {
    if (!watch) return;

    const updateTimeline = async () => {
      if (!player.current) return;
      const timelineUpdateData = await ServerApi.timeline({
        id: parseInt(watch),
        duration: Math.floor(player.current.getDuration()) * 1000,
        state: buffering ? "buffering" : playing ? "playing" : "paused",
        time: Math.floor(progress) * 1000,
      });

      if (!timelineUpdateData) return;

      const { terminationCode } = timelineUpdateData.MediaContainer;
      if (terminationCode) {
        setPlaying(false);
      }
    };

    const updateInterval = setInterval(updateTimeline, 10000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [buffering, watch, playing]);

  useEffect(() => {
    if (!watch) {
      setUrl("");
      setMetadata(null);
      setPlayQueue(null);
      setPlaying(false);
      setReady(false);
    }

    (async () => {
      setReady(false);

      if (!watch) return;

      await loadMetadata(watch);
      setUrl(loaded());
      setShowError(false);
    })();
  }, [watch]);

  useEffect(() => {
    if (!video) return;

    if (
      "pictureInPictureEnabled" in document &&
      // @ts-ignore
      video.requestPictureInPicture
    ) {
      setIsPipAvailable(true);
    } else {
      setIsPipAvailable(false);
    }

    if (ready && !playing) {
      setPlaying(true);
      timeline("playing");
    }

    return () => {
      setIsPipAvailable(false);
    };
  }, [video]);

  const next = useMemo(() => (playQueue && playQueue[1]) ?? null, [playQueue]);

  const handleNext = useCallback(() => {
    if (next) {
      router.replace(`${pathname}?watch=${next.ratingKey}`, {
        scroll: false,
      });
    }
  }, [next]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handleNext();
      });
    }
  }, [handleNext]);

  // playback controll buttons
  // SPACE: play/pause
  // LEFT: seek back 10 seconds
  // RIGHT: seek forward 10 seconds
  // UP: increase volume
  // DOWN: decrease volume
  // , (comma): Back 1 frame
  // . (period): Forward 1 frame
  // F: Maximize/Minimize
  // M: Mute/Unmute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (e.key === " " && player.current) {
        setPlaying((state) => !state);
      }
      if (e.key === "ArrowLeft" && player.current) {
        player.current.seekTo(player.current.getCurrentTime() - 10);
      }
      if (e.key === "ArrowRight" && player.current) {
        player.current.seekTo(player.current.getCurrentTime() + 10);
      }
      if (e.key === "ArrowUp" && player.current) {
        setVolume((state) => {
          const value = Math.min(state + 5, 100);
          localStorage.setItem("volume", value.toString());
          return value;
        });
        setIsMuted(() => {
          localStorage.setItem("is_watch_muted", "false");
          return false;
        });
      }
      if (e.key === "ArrowDown" && player.current) {
        setVolume((state) => {
          const value = Math.max(state - 5, 0);
          localStorage.setItem("volume", value.toString());
          return value;
        });
        setIsMuted(() => {
          localStorage.setItem("is_watch_muted", "false");
          return false;
        });
      }
      if (e.key === "," && player.current) {
        player.current.seekTo(player.current.getCurrentTime() - 0.04);
      }
      if (e.key === "." && player.current) {
        player.current.seekTo(player.current.getCurrentTime() + 0.04);
      }
      if (e.key === "f" && player.current) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().then();
        } else {
          document.exitFullscreen().then();
        }
      }
      if (e.key === "m") {
        setIsMuted((prev) => {
          localStorage.setItem("is_watch_muted", prev ? "false" : "true");
          return !prev;
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (watch !== undefined && player.current !== null) {
        timeline("stopped");
      }
    };
  }, []);

  // Disable body scroll
  useEffect(() => {
    if (watch && container.current) {
      disableBodyScroll(container.current);
    } else {
      clearAllBodyScrollLocks();
    }
    return () => {
      clearAllBodyScrollLocks();
      lastAppliedTime.current = 0;
    };
  }, [container, watch]);

  const back = () => {
    timeline("stopped");
    router.back();
  };

  const videoOptions = useMemo(
    () =>
      metadata?.Media && metadata.Media.length > 0
        ? getCurrentVideoLevels(metadata.Media[0].videoResolution).filter(
            (opt) => opt.bitrate,
          )
        : [],
    [metadata?.Media],
  );
  const audioOptions = useMemo(
    () =>
      metadata?.Media && metadata.Media.length > 0
        ? metadata?.Media[0].Part[0].Stream.filter(
            (stream) => stream.streamType === 2,
          )
        : [],
    [metadata?.Media],
  );
  const subtitleOptions = useMemo(
    () =>
      metadata?.Media && metadata.Media.length > 0
        ? metadata?.Media[0].Part[0].Stream.filter(
            (stream) => stream.streamType === 3,
          )
        : [],
    [metadata?.Media],
  );

  const showSkip =
    metadata?.Marker &&
    metadata?.Marker.filter(
      (marker) =>
        marker.startTimeOffset / 1000 <= progress &&
        marker.endTimeOffset / 1000 >= progress &&
        marker.type === "intro",
    ).length > 0;

  const showCredit =
    metadata?.Marker &&
    metadata?.Marker.filter(
      (marker) =>
        marker.startTimeOffset / 1000 <= progress &&
        marker.endTimeOffset / 1000 >= progress &&
        marker.type === "credits" &&
        !marker.final,
    ).length > 0;

  const token = localStorage.getItem("token");

  if (!watch) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black" ref={container}>
      {metadata && !isLoadingMetadata ? (
        <>
          <div
            className={`absolute inset-0 ${showControls ? "" : "cursor-none"}`}
          >
            <ReactPlayer
              ref={player}
              playing={playing}
              volume={(isMuted ? 0 : volume) / 100}
              onClick={(e: MouseEvent) => {
                e.preventDefault();

                switch (e.detail) {
                  case 1:
                    setPlaying((state) => {
                      timeline(state ? "paused" : "playing");
                      return !state;
                    });
                    break;
                  case 2:
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen();
                    } else {
                      document.exitFullscreen();
                    }
                    break;
                  default:
                    break;
                }
              }}
              onSeek={(seconds) => {
                if (player.current !== null) {
                  setProgress(seconds);
                  ServerApi.timeline({
                    id: parseInt(watch),
                    duration: Math.floor(player.current.getDuration()) * 1000,
                    state: buffering
                      ? "buffering"
                      : playing
                        ? "playing"
                        : "paused",
                    time: Math.floor(seconds) * 1000,
                  });
                }
              }}
              onReady={() => {
                if (!player.current) return;
                setReady(true);
                setShowError(false);

                if (seekToAfterLoad.current !== null) {
                  player.current.seekTo(seekToAfterLoad.current);
                  seekToAfterLoad.current = null;
                }

                if (!searchParams.has("t")) return;
                const t = parseInt(searchParams.get("t") ?? "0");

                if (lastAppliedTime.current === t) {
                  return;
                }

                player.current.seekTo(t / 1000);
                lastAppliedTime.current = t;
              }}
              onProgress={(progress) => {
                setProgress(progress.playedSeconds);
                setBuffered(progress.loadedSeconds);
              }}
              onPause={() => {
                setPlaying(false);
                if (playing) {
                  timeline("paused");
                }
              }}
              onPlay={() => {
                setPlaying(true);
                if (!playing) {
                  timeline("playing");
                }
              }}
              onBuffer={() => {
                setBuffering(true);
              }}
              onBufferEnd={() => {
                setBuffering(false);
              }}
              onError={(err) => {
                console.error(err);
                if (err?.error?.message) {
                  if (
                    (err.error.message.includes("/header") ||
                      err.error.message.includes(".m4s")) &&
                    err.error.message.includes("is not available") &&
                    !isLoadingMetadata
                  ) {
                    setShowError(true);
                  }
                }

                setPlaying(false);
              }}
              onEnded={() => {
                if (!playQueue) {
                  // TODO: maybe call back
                  return console.log("No play queue");
                }

                if (metadata.type !== "episode") {
                  router.push(
                    `/browse/${metadata.librarySectionID}?${qs.stringify({
                      mid: metadata.ratingKey,
                    })}`,
                    { scroll: false },
                  );
                  return;
                }

                const next = playQueue[1];
                if (!next) {
                  router.push(
                    `/browse/${metadata.librarySectionID}?${qs.stringify({
                      mid: metadata.grandparentRatingKey,
                      pid: metadata.parentRatingKey,
                      iid: metadata.ratingKey,
                    })}`,
                    { scroll: false },
                  );
                  return;
                }

                router.replace(`${pathname}?watch=${next.ratingKey}`, {
                  scroll: false,
                });
              }}
              config={{
                file: {
                  forceDisableHls: true,
                  forceDASH: true,
                  dashVersion: "4.7.0",
                  attributes: {
                    controlsList: "nodownload",
                    disablePictureInPicture: false,
                    disableRemotePlayback: true,
                    autoPlay: true,
                    poster: getCoverImage(metadata.art, true),
                    crossorigin: "anonymous",
                  },
                },
              }}
              controls={false}
              stopOnUnmount={false}
              url={url}
              width="100%"
              height="100%"
              pip
            />
          </div>
          <div
            className={`sticky top-0 w-full flex flex-col gap-6 p-6 bg-background/80 ${showControls || !playing ? "" : "-translate-y-full"} transition`}
          >
            <button
              onClick={() => back()}
              className="group w-fit without-ring"
              id="button-back"
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                }
              }}
            >
              <ArrowLeft className="w-8 h-8 text-muted-foreground group-hover:scale-125 hover:text-primary transition duration-75" />
            </button>
          </div>
          <div className="flex-1" />
          <div
            className={`flex flex-row p-6 justify-end z-50 ${showSkip ? "" : "hidden"} transition`}
            autoFocus
          >
            {showSkip && (
              <Button
                type="button"
                variant="outline"
                id="button-skipintro"
                autoFocus
                onClick={() => {
                  if (!player.current || !metadata?.Marker) return;
                  const time =
                    metadata.Marker?.filter(
                      (marker) =>
                        marker.startTimeOffset / 1000 <= progress &&
                        marker.endTimeOffset / 1000 >= progress &&
                        marker.type === "intro",
                    )[0].endTimeOffset / 1000;
                  player.current.seekTo(time + 1);
                }}
              >
                <SkipForward /> Skip Intro
              </Button>
            )}
          </div>
          <div
            className={`flex flex-row p-6 justify-end z-50 ${showCredit ? "" : "hidden"} transition`}
            autoFocus
          >
            {showCredit && (
              <Button
                type="button"
                variant="outline"
                id="button-skipcredit"
                autoFocus
                onClick={() => {
                  if (!player.current || !metadata?.Marker) return;
                  const time =
                    metadata.Marker?.filter(
                      (marker) =>
                        marker.startTimeOffset / 1000 <= progress &&
                        marker.endTimeOffset / 1000 >= progress &&
                        marker.type === "credits" &&
                        !marker.final,
                    )[0].endTimeOffset / 1000;
                  player.current.seekTo(time + 1);
                }}
              >
                <SkipForward /> Skip Credit
              </Button>
            )}
          </div>
          <div
            className={`sticky bottom-0 w-full flex flex-col gap-6 p-6 bg-background/80 ${showControls || !playing ? "" : "translate-y-full"} transition`}
          >
            <div className="h-4 flex flex-row gap-4">
              {metadata && (
                <div className="flex-1">
                  <VideoSeekSlider
                    max={(player.current?.getDuration() ?? 0) * 1000}
                    currentTime={progress * 1000}
                    bufferTime={buffered * 1000}
                    onChange={(value) => {
                      player.current?.seekTo(value / 1000);
                    }}
                    limitTimeTooltipBySides={true}
                    secondsPrefix="00:"
                    minutesPrefix="0:"
                    getPreviewScreenUrl={(value) => {
                      if (!metadata.Media || !metadata.Media[0].Part[0].indexes)
                        return "";
                      return `${localStorage.getItem(
                        "server",
                      )}/photo/:/transcode?${qs.stringify({
                        width: "240",
                        height: "135",
                        minSize: "1",
                        upscale: "1",
                        url: `/library/parts/${
                          metadata.Media[0].Part[0].id
                        }/indexes/sd/${value}?X-Plex-Token=${
                          localStorage.getItem("token") as string
                        }`,
                        "X-Plex-Token": localStorage.getItem("token") as string,
                      })}`;
                    }}
                  />
                </div>
              )}
              <p className="font-bold -mt-1 select-none">
                {getFormatedTime(
                  (player.current?.getDuration() ?? 0) - progress,
                )}
              </p>
            </div>
            <div
              aria-label="controls"
              className="flex flex-row gap-4 items-center"
            >
              <button
                id="button-play"
                className="without-ring"
                onKeyDown={(event) => {
                  if (event.key === " ") {
                    event.preventDefault();
                  }
                }}
                onClick={() => {
                  setPlaying(!playing);
                  if (playing) {
                    timeline("paused");
                  } else {
                    timeline("playing");
                  }
                }}
              >
                {playing ? (
                  <Pause
                    className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75"
                    fill="currentColor"
                  />
                ) : (
                  <Play
                    className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75"
                    fill="currentColor"
                  />
                )}
              </button>
              <div className="flex group items-center">
                <button
                  id="button-volume"
                  className="without-ring"
                  onKeyDown={(event) => {
                    if (event.key === " ") {
                      event.preventDefault();
                    }
                  }}
                  onClick={() => {
                    localStorage.setItem(
                      "is_watch_muted",
                      isMuted ? "false" : "true",
                    );
                    setIsMuted(!isMuted);
                  }}
                >
                  {volume === 0 || isMuted ? (
                    <VolumeX className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                  ) : volume < 45 ? (
                    <Volume1 className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                  ) : (
                    <Volume2 className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                  )}
                </button>
                <div className="overflow-visible group-hover:opacity-100 opacity-0 pl-0 group-hover:pl-4 transition-all duration-200">
                  <Slider
                    className="group-hover:max-w-none max-w-[0px] w-[200px] h-full transition-all duration-200"
                    value={[isMuted ? 0 : volume]}
                    defaultValue={[isMuted ? 0 : volume]}
                    max={100}
                    min={0}
                    step={1}
                    onValueChange={(value) => {
                      localStorage.setItem("volume", value[0].toString());
                      setVolume(value[0]);
                      localStorage.setItem("is_watch_muted", "false");
                      setIsMuted(false);
                    }}
                  />
                </div>
              </div>
              <div className="flex-1" />
              <p className="font-bold select-none text-center line-clamp-1">
                {metadata.type === "movie" && metadata.title}
                {metadata.type === "episode" && (
                  <span>
                    <button
                      id="button-grandparent"
                      className="without-ring"
                      onKeyDown={(event) => {
                        if (event.key === " ") {
                          event.preventDefault();
                        }
                      }}
                      onClick={() =>
                        router.push(
                          `${pathname}?mid=${metadata.grandparentRatingKey}`,
                          { scroll: false },
                        )
                      }
                    >
                      {metadata.grandparentTitle}
                    </button>
                    {" - "}
                    <button
                      id="button-parent"
                      className="without-ring"
                      onKeyDown={(event) => {
                        if (event.key === " ") {
                          event.preventDefault();
                        }
                      }}
                      onClick={() =>
                        router.push(
                          `${pathname}?mid=${metadata.parentRatingKey}`,
                          { scroll: false },
                        )
                      }
                    >
                      S{metadata.parentIndex?.toString().padStart(2, "0")}
                    </button>
                    E{metadata.index?.toString().padStart(2, "0")}
                    {" - "}
                    {metadata.title}
                  </span>
                )}
              </p>
              <div className="flex-1" />
              {next && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild id="button-next">
                      <button
                        className="without-ring"
                        onKeyDown={(event) => {
                          if (event.key === " ") {
                            event.preventDefault();
                          }
                        }}
                        onClick={() => handleNext()}
                      >
                        <SkipForward className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      className={`p-0 m-4 ${showControls ? "" : "hidden"} flex flex-row bg-background max-w-[600px] max-h-[${9 * 20}px]`}
                    >
                      <img
                        loading="lazy"
                        width={16 * 20}
                        height={9 * 20}
                        className="aspect-video"
                        src={`${localStorage.getItem("server")}/photo/:/transcode?${qs.stringify(
                          {
                            width: 16 * 20,
                            height: 9 * 20,
                            url: `${next.thumb}?X-Plex-Token=${token}`,
                            minSize: 1,
                            upscale: 1,
                            "X-Plex-Token": token,
                          },
                        )}`}
                        alt="preview poster"
                      />
                      <div className="p-4 text-primary">
                        <p className="text-xl line-clamp-1 font-bold">
                          {next.title}
                        </p>
                        <p className="text-normal font-bold text-muted-foreground">
                          S{next.parentIndex?.toString().padStart(2, "0")}E
                          {next.index?.toString().padStart(2, "0")}
                        </p>
                        <p className="text-md line-clamp-6">{next.summary}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isPipAvailable && (
                <button
                  className="without-ring"
                  onClick={async () => {
                    try {
                      if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                      } else if (video) {
                        await video.requestPictureInPicture();
                      }
                    } catch (error) {
                      console.error("PiP error:", error);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === " ") {
                      event.preventDefault();
                    }
                  }}
                  id="button-pip"
                >
                  <PictureInPicture className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                </button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="without-ring"
                    onKeyDown={(event) => {
                      if (event.key === " ") {
                        event.preventDefault();
                      }
                    }}
                    id="button-settings"
                  >
                    <SlidersHorizontal className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                  </button>
                </DialogTrigger>
                <DialogContent className="m-4 flex flex-col gap-2">
                  <VisuallyHidden>
                    <DialogTitle>Playback Settings</DialogTitle>
                  </VisuallyHidden>
                  {videoOptions.length > 0 && (
                    <>
                      <Label>Video</Label>
                      <Select
                        value={quality.bitrate?.toString()}
                        defaultValue={quality.bitrate?.toString()}
                        onValueChange={async (bitrate) => {
                          const selected = videoOptions.find(
                            (q) => q.bitrate?.toString() === bitrate,
                          )!;

                          await loadMetadata(watch);
                          setIsLoadingMetadata(true);
                          await ServerApi.decision({
                            id: watch,
                            limitation: {
                              maxVideoBitrate: selected.bitrate,
                              autoAdjustQuality: quality.auto,
                            },
                          });
                          setIsLoadingMetadata(false);

                          setQuality({
                            bitrate: selected.original
                              ? undefined
                              : selected.bitrate,
                            auto: undefined,
                          });

                          if (selected.original) {
                            localStorage.removeItem("quality");
                          } else if (selected.bitrate) {
                            localStorage.setItem(
                              "quality",
                              selected.bitrate.toString(),
                            );
                          }

                          const progress =
                            player.current?.getCurrentTime() ?? 0;

                          if (!seekToAfterLoad.current) {
                            seekToAfterLoad.current = progress;
                          }
                          setUrl("");
                          setNextUrl(loaded());
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a video quality" />
                        </SelectTrigger>
                        <SelectContent>
                          {videoOptions.map((option) => (
                            <SelectItem
                              value={option.bitrate!.toString()}
                              key={option.bitrate!}
                            >
                              {option.title}{" "}
                              <span className="font-bold">{option.extra}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {audioOptions.length > 0 && (
                    <>
                      <Label>Audio</Label>
                      <Select
                        value={
                          audioOptions
                            .find((opt) => opt.selected)
                            ?.id?.toString() ?? ""
                        }
                        defaultValue={
                          audioOptions
                            .find((opt) => opt.selected)
                            ?.id?.toString() ?? ""
                        }
                        onValueChange={async (stream) => {
                          await ServerApi.audio({
                            part: metadata?.Media
                              ? metadata?.Media[0].Part[0].id.toString()
                              : "",
                            stream: stream,
                          });
                          await loadMetadata(watch);
                          await ServerApi.decision({
                            id: watch,
                            limitation: {
                              maxVideoBitrate: quality.bitrate,
                              autoAdjustQuality: quality.auto,
                            },
                          });

                          const progress =
                            player.current?.getCurrentTime() ?? 0;

                          if (!seekToAfterLoad.current) {
                            seekToAfterLoad.current = progress;
                          }
                          setUrl("");
                          setNextUrl(loaded());
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose an audio" />
                        </SelectTrigger>
                        <SelectContent>
                          {audioOptions.map((option) => (
                            <SelectItem
                              value={option.id.toString()}
                              key={option.id}
                            >
                              {option.extendedDisplayTitle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {subtitleOptions.length > 0 && (
                    <>
                      <Label>Subtitle</Label>
                      <Select
                        value={
                          subtitleOptions
                            .find((opt) => opt.selected)
                            ?.id?.toString() ?? "0"
                        }
                        defaultValue={
                          subtitleOptions
                            .find((opt) => opt.selected)
                            ?.id?.toString() ?? "0"
                        }
                        onValueChange={async (stream) => {
                          await ServerApi.subtitle({
                            part: metadata?.Media
                              ? metadata?.Media[0].Part[0].id.toString()
                              : "",
                            stream: stream,
                          });
                          await loadMetadata(watch);
                          await ServerApi.decision({
                            id: watch,
                            limitation: {
                              maxVideoBitrate: quality.bitrate,
                              autoAdjustQuality: quality.auto,
                            },
                          });

                          const progress =
                            player.current?.getCurrentTime() ?? 0;

                          if (!seekToAfterLoad.current) {
                            seekToAfterLoad.current = progress;
                          }

                          setUrl("");
                          setNextUrl(loaded());
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose an subtitle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          {subtitleOptions.map((option) => (
                            <SelectItem
                              value={option.id.toString()}
                              key={option.id}
                            >
                              {option.extendedDisplayTitle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </DialogContent>
              </Dialog>
              <button
                className="without-ring"
                onKeyDown={(event) => {
                  if (event.key === " ") {
                    event.preventDefault();
                  }
                }}
                id="button-fullscreen"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().then();
                  } else {
                    document.exitFullscreen().then();
                  }
                }}
              >
                {document.fullscreenElement ? (
                  <Minimize className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                ) : (
                  <Maximize className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-row items-center justify-center">
          {metadata?.art && (
            <>
              <div className="absolute inset-0">
                <img
                  className="h-full object-cover blur-[3px]"
                  src={getCoverImage(metadata.art, true)}
                  alt="Metadata art"
                />
              </div>
              <div className="absolute inset-0 bg-background/80"></div>
            </>
          )}
          <LoaderCircle
            strokeWidth={2}
            className="w-10 h-10 animate-spin-fast text-plex"
          />
        </div>
      )}
      <Dialog
        open={showError}
        onOpenChange={(open) => {
          if (!pendingRefresh) setShowError(open);
        }}
      >
        <DialogContent>
          <DialogTitle>Loading Error</DialogTitle>
          <DialogDescription>
            The video was not able to load. You may try to refresh the page to
            resolve the error.
          </DialogDescription>
          <DialogFooter className="flex flex-row gap-2">
            <DialogClose asChild disabled={pendingRefresh}>
              <Button type="button" disabled={pendingRefresh}>
                Close
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                setPendingRefresh(true);
                setTimeout(() => {
                  let t: string | number | null = searchParams.get("t");
                  if (t === null || parseInt(t) === 0) {
                    t = Math.floor(progress) * 1000;
                  }
                  router.replace(
                    `${pathname}?watch=${watch}${t ? `&t=${t}` : ""}`,
                    {
                      scroll: false,
                    },
                  );
                  setTimeout(() => {
                    window.location.reload();
                    setPendingRefresh(false);
                  }, 250);
                }, 2500);
              }}
              disabled={pendingRefresh}
            >
              {pendingRefresh ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
    document.body,
  );
};

export function getCurrentVideoLevels(resolution: string) {
  const levels: {
    title: string;
    bitrate?: number;
    extra: string;
    original?: boolean;
  }[] = [];

  switch (resolution) {
    case "720":
      levels.push(
        ...[
          {
            title: "Convert to 720p",
            bitrate: 4000,
            extra: "(High) 4Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 3000,
            extra: "(Medium) 3Mbps",
          },
          { title: "Convert to 720p", bitrate: 2000, extra: "2Mbps" },
          { title: "Convert to 480p", bitrate: 1500, extra: "1.5Mbps" },
          { title: "Convert to 360p", bitrate: 750, extra: "0.7Mbps" },
          { title: "Convert to 240p", bitrate: 300, extra: "0.3Mbps" },
        ],
      );
      break;
    case "4k":
      levels.push(
        ...[
          {
            title: "Convert to 4K",
            bitrate: 40000,
            extra: "(High) 40Mbps",
          },
          {
            title: "Convert to 4K",
            bitrate: 30000,
            extra: "(Medium) 30Mbps",
          },
          {
            title: "Convert to 4K",
            bitrate: 20000,
            extra: "20Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 20000,
            extra: "(High) 20Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 12000,
            extra: "(Medium) 12Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 10000,
            extra: "10Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 4000,
            extra: "(High) 4Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 3000,
            extra: "(Medium) 3Mbps",
          },
          { title: "Convert to 720p", bitrate: 2000, extra: "2Mbps" },
          { title: "Convert to 480p", bitrate: 1500, extra: "1.5Mbps" },
          { title: "Convert to 360p", bitrate: 750, extra: "0.7Mbps" },
          { title: "Convert to 240p", bitrate: 300, extra: "0.3Mbps" },
        ],
      );
      break;

    case "1080":
    default:
      levels.push(
        ...[
          {
            title: "Convert to 1080p",
            bitrate: 20000,
            extra: "(High) 20Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 12000,
            extra: "(Medium) 12Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 10000,
            extra: "10Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 4000,
            extra: "(High) 4Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 3000,
            extra: "(Medium) 3Mbps",
          },
          { title: "Convert to 720p", bitrate: 2000, extra: "2Mbps" },
          { title: "Convert to 480p", bitrate: 1500, extra: "1.5Mbps" },
          { title: "Convert to 360p", bitrate: 750, extra: "0.7Mbps" },
          { title: "Convert to 240p", bitrate: 300, extra: "0.3Mbps" },
        ],
      );
      break;
  }

  return levels;
}
