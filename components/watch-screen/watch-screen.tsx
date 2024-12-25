"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { PLEX } from "@/constants";
import { ServerApi, streamprops } from "@/api";
import qs from "qs";
import { createPortal } from "react-dom";
import { disableBodyScroll, clearAllBodyScrollLocks } from "body-scroll-lock";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  Volume2,
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
  const [openVolume, setOpenVolume] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [showError, setShowError] = useState<string | false>(false);
  const [showControls, setShowControls] = useState(true);
  const [url, setUrl] = useState<string>("");

  const loaded = `${PLEX.server}/video/:/transcode/universal/start.mpd?${qs.stringify(
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
    await ServerApi.decision({
      id,
      limitation: {
        maxVideoBitrate: quality.bitrate,
        autoAdjustQuality: quality.auto,
      },
    });

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

    document.addEventListener("mousemove", move);
    return () => {
      document.removeEventListener("mousemove", move);
    };
  }, []);

  useEffect(() => {
    if (!watch) return;

    const updateTimeline = async () => {
      if (!player.current) return;
      const timelineUpdateData = await ServerApi.timeline({
        id: parseInt(watch),
        duration: Math.floor(player.current.getDuration()) * 1000,
        state: buffering ? "buffering" : playing ? "playing" : "paused",
        time: Math.floor(player.current.getCurrentTime()) * 1000,
      });

      if (!timelineUpdateData) return;

      const { terminationCode, terminationText } =
        timelineUpdateData.MediaContainer;
      if (terminationCode) {
        setShowError(`${terminationCode} - ${terminationText}`);
        setPlaying(false);
      }
    };

    const updateInterval = setInterval(updateTimeline, 5000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [buffering, watch, playing]);

  useEffect(() => {
    if (!watch) {
      setUrl("");
    }

    (async () => {
      setReady(false);

      if (!watch) return;

      await loadMetadata(watch);
      setUrl(loaded);
      setShowError(false);
    })();
  }, [watch]);

  useEffect(() => {
    if (!player.current) return;

    if (ready && !playing) setPlaying(true);
  }, [ready]);

  // playback controll buttons
  // SPACE: play/pause
  // LEFT: seek back 10 seconds
  // RIGHT: seek forward 10 seconds
  // UP: increase volume
  // DOWN: decrease volume
  // , (comma): Back 1 frame
  // . (period): Forward 1 frame
  // F: fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        setVolume((state) => Math.min(state + 5, 100));
      }
      if (e.key === "ArrowDown" && player.current) {
        setVolume((state) => Math.max(state - 5, 0));
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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
    };
  }, [container, watch]);

  const videoOptions = useMemo(
    () =>
      metadata?.Media && metadata.Media.length > 0
        ? getCurrentVideoLevels(
            metadata.Media[0].videoResolution,
            `${Math.floor(metadata.Media[0].bitrate / 1000)}Mbps`,
          ).filter((opt) => opt.bitrate)
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

  if (!watch) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black" ref={container}>
      {metadata && (
        <>
          <div
            className={`absolute inset-0 ${showControls ? "" : "cursor-none"}`}
          >
            {!metadata || !url ? (
              <div>{/* TODO: loading spinner */}</div>
            ) : (
              <ReactPlayer
                ref={player}
                playing={playing}
                volume={volume / 100}
                onClick={(e: MouseEvent) => {
                  e.preventDefault();

                  switch (e.detail) {
                    case 1:
                      setPlaying((state) => !state);
                      break;
                    case 2:
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                        setPlaying(true);
                      } else {
                        document.exitFullscreen();
                      }
                      break;
                    default:
                      break;
                  }
                }}
                onReady={() => {
                  if (!player.current) return;
                  setReady(true);

                  console.log(seekToAfterLoad.current);

                  if (seekToAfterLoad.current !== null) {
                    player.current.seekTo(seekToAfterLoad.current);
                    seekToAfterLoad.current = null;
                  }

                  if (!searchParams.has("t")) return;
                  if (
                    lastAppliedTime.current ===
                    parseInt(searchParams.get("t") ?? "0")
                  ) {
                    return;
                  }
                  player.current.seekTo(
                    parseInt(searchParams.get("t") ?? "0") / 1000,
                  );
                  lastAppliedTime.current = parseInt(
                    searchParams.get("t") ?? "0",
                  );
                }}
                onProgress={(progress) => {
                  setProgress(progress.playedSeconds);
                  setBuffered(progress.loadedSeconds);
                }}
                onPause={() => {
                  setPlaying(false);
                }}
                onPlay={() => {
                  setPlaying(true);
                }}
                onBuffer={() => {
                  setBuffering(true);
                }}
                onBufferEnd={() => {
                  setBuffering(false);
                }}
                onError={(err) => {
                  console.log("Player error:");
                  console.error(err);
                  // window.location.reload();

                  setPlaying(false);
                  if (showError) return;
                }}
                config={{
                  file: {
                    forceDisableHls: true,
                    dashVersion: "4.7.0",
                    attributes: {
                      controlsList: "nodownload",
                      disablePictureInPicture: true,
                      disableRemotePlayback: true,
                      autoplay: true,
                    },
                  },
                }}
                onEnded={() => {
                  if (!playQueue) return console.log("No play queue");

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
                  }

                  router.replace(`${pathname}?watch=${next.ratingKey}`, {
                    scroll: false,
                  });
                }}
                url={url}
                width="100%"
                height="100%"
              />
            )}
          </div>
          <div
            className={`absolute top-0 w-full flex flex-col gap-6 p-6 bg-background/80 ${showControls || !playing ? "" : "hidden"}`}
          >
            <button
              onClick={() => {
                router.back();
              }}
            >
              <ArrowLeft className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
            </button>
          </div>
          <div
            className={`absolute bottom-0 w-full flex flex-col gap-6 p-6 bg-background/80 ${showControls || !playing ? "" : "hidden"}`}
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
              className="flex flex-row gap-2 items-center"
            >
              <button
                onClick={() => {
                  setPlaying(!playing);
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
              <div className="flex-1" />
              <p className="font-bold select-none">
                {metadata.type === "movie" && metadata.title}
                {metadata.type === "episode" &&
                  `${metadata.grandparentTitle} - S${metadata.parentIndex}E${metadata.index} - ${metadata.title}`}
              </p>
              <div className="flex-1" />
              <Dialog>
                <DialogTrigger>
                  <Settings className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                </DialogTrigger>
                <DialogContent className="m-4 flex flex-col gap-2">
                  {videoOptions.length > 0 && (
                    <>
                      <Label>Video</Label>
                      <Select
                        value={quality.bitrate?.toString()}
                        defaultValue={quality.bitrate?.toString()}
                        onValueChange={async (bitrate) => {
                          await loadMetadata(watch);
                          await ServerApi.decision({
                            id: watch,
                            limitation: {
                              maxVideoBitrate: parseInt(bitrate),
                              autoAdjustQuality: quality.auto,
                            },
                          });

                          const selected = videoOptions.find(
                            (q) => q.bitrate?.toString() === bitrate,
                          )!;
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
                          setTimeout(() => {
                            setUrl(loaded);
                          }, 500);
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
                          setTimeout(() => {
                            setUrl(loaded);
                          }, 500);
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
                          setTimeout(() => {
                            setUrl(loaded);
                          }, 500);
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
              <Popover
                open={openVolume && showControls}
                onOpenChange={(open) => setOpenVolume(open)}
              >
                <PopoverTrigger>
                  <Volume2 className="w-8 h-8 text-muted-foreground hover:scale-125 hover:text-primary transition duration-75" />
                </PopoverTrigger>
                <PopoverContent className="w-min m-4">
                  <Slider
                    className="h-[200px]"
                    value={[volume]}
                    defaultValue={[volume]}
                    max={100}
                    min={0}
                    step={1}
                    onValueChange={(value) => {
                      localStorage.setItem("volume", value[0].toString());
                      setVolume(value[0]);
                    }}
                    orientation="vertical"
                  />
                </PopoverContent>
              </Popover>
              <button
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
      )}
    </div>,
    document.body,
  );
};

export function getCurrentVideoLevels(
  resolution: string,
  extraForOriginal = "Auto",
) {
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
