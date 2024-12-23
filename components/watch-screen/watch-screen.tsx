"use client";

import { FC, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { PLEX } from "@/constants";
import { ServerApi, streamprops, xprops } from "@/api";
import qs from "qs";
import { createPortal } from "react-dom";
import { disableBodyScroll, clearAllBodyScrollLocks } from "body-scroll-lock";
import { useSession } from "@/hooks/use-session";
import { useSearchParams } from "next/navigation";

export const WatchScreen: FC<{ watch: string | undefined }> = ({ watch }) => {
  const container = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [metadata, setMetadata] = useState<Plex.Metadata | null>(null);
  const [showmetadata, setShowMetadata] = useState<Plex.Metadata | null>(null);
  const [playQueue, setPlayQueue] = useState<Plex.Metadata[] | null>(null); // [current, ...next]
  const player = useRef<ReactPlayer | null>(null);
  const [quality, setQuality] = useState<{
    bitrate?: number;
    auto?: boolean;
  }>({
    ...(localStorage.getItem("quality") && {
      bitrate: parseInt(localStorage.getItem("quality") ?? "10000"),
    }),
  });

  const [volume, setVolume] = useState<number>(
    parseInt(localStorage.getItem("volume") ?? "100"),
  );

  const lastAppliedTime = useRef<number>(0);

  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(playing);
  const [ready, setReady] = useState(false);
  const seekToAfterLoad = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);

  const [volumePopoverAnchor, setVolumePopoverAnchor] =
    useState<HTMLButtonElement | null>(null);
  const volumePopoverOpen = Boolean(volumePopoverAnchor);

  const [showTune, setShowTune] = useState(false);
  const [tunePage, setTunePage] = useState<number>(0); // 0: menu, 1: video, 2: audio, 3: subtitles
  const tuneButtonRef = useRef<HTMLButtonElement | null>(null);

  const playbackBarRef = useRef<HTMLDivElement | null>(null);

  const [buffering, setBuffering] = useState(false);
  const [showError, setShowError] = useState<string | false>(false);

  const loadMetadata = async (watch: string) => {
    await ServerApi.decision({
      id: watch,
      limitation: {
        maxVideoBitrate: quality.bitrate,
        autoAdjustQuality: quality.auto,
      },
    });

    let Metadata: Plex.Metadata | null = null;
    await ServerApi.metadata({ id: watch }).then((metadata) => {
      if (!metadata) return;

      Metadata = metadata;
      if (metadata.type === "movie" || metadata.type === "episode") {
        setMetadata(metadata);
        if (metadata.type === "episode") {
          ServerApi.metadata({
            id: metadata.grandparentRatingKey as string,
          }).then((show) => {
            setShowMetadata(show);
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

  const [url, setURL] = useState<string>("");
  const getUrl = `${PLEX.server}/video/:/transcode/universal/start.mpd?${qs.stringify(
    {
      ...streamprops({
        id: watch,
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

  const [showControls, setShowControls] = useState(true);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const whenMouseMoves = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    document.addEventListener("mousemove", whenMouseMoves);
    return () => {
      document.removeEventListener("mousemove", whenMouseMoves);
    };
  }, [playing]);

  const [showInfo, setShowInfo] = useState(false);
  useEffect(() => {
    playingRef.current = playing;

    if (!playingRef.current) {
      setTimeout(() => {
        if (!playingRef.current) setShowInfo(true);
      }, 5000);
    } else {
      setShowInfo(false);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) return;

    if (showControls) document.body.style.cursor = "default";
    else document.body.style.cursor = "none";

    return () => {
      document.body.style.cursor = "default";
    };
  }, [playing, showControls]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!watch) return;
      await ServerApi.ping();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [watch]);

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

    return () => clearInterval(updateInterval);
  }, [buffering, watch, playing]);

  useEffect(() => {
    // set css style for .ui-video-seek-slider .track .main .connect
    const style = document.createElement("style");
    document.head.appendChild(style);

    (async () => {
      setReady(false);

      if (!watch) return;

      await loadMetadata(watch);
      setURL(getUrl);
      setShowError(false);
    })();
  }, [watch]);

  // useEffect(() => {
  //   SessionID = sessionID;
  // }, [sessionID]);

  useEffect(() => {
    if (!player.current) return;

    if (ready && !playing) setPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // playback controll buttons
  // SPACE: play/pause
  // LEFT: seek back 10 seconds
  // RIGHT: seek forward 10 seconds
  // UP: increase volume
  // DOWN: decrease volume
  // , (comma): Back 1 frame
  // . (period): Forward 1 frame
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
      console.log(e.key);
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

  if (!watch) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black" ref={container}>
      {metadata && (
        <div
          className={`absolute inset-0 ${showControls ? "" : "cursor-none"}`}
        >
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

              if (seekToAfterLoad.current !== null) {
                player.current.seekTo(seekToAfterLoad.current);
                seekToAfterLoad.current = null;
              }

              if (!searchParams.has("t")) return;
              if (
                lastAppliedTime.current ===
                parseInt(searchParams.get("t") ?? "0")
              )
                return;
              player.current.seekTo(
                parseInt(searchParams.get("t") ?? "0") / 1000,
              );
              lastAppliedTime.current = parseInt(searchParams.get("t") ?? "0");
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
              // if (!playQueue) return console.log("No play queue");
              //
              // if (metadata.type !== "episode")
              //   return navigate(
              //     `/browse/${metadata.librarySectionID}?${queryBuilder({
              //       mid: metadata.ratingKey,
              //     })}`,
              //   );
              //
              // const next = playQueue[1];
              // if (!next)
              //   return navigate(
              //     `/browse/${metadata.librarySectionID}?${queryBuilder({
              //       mid: metadata.grandparentRatingKey,
              //       pid: metadata.parentRatingKey,
              //       iid: metadata.ratingKey,
              //     })}`,
              //   );
              //
              // navigate(`/watch/${next.ratingKey}`);
            }}
            url={url}
            width="100%"
            height="100%"
          />
        </div>
      )}
    </div>,
    document.body,
  );
};
