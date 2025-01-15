"use client";

import { ServerApi } from "@/api";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Hero } from "@/components/hero";
import { HubSlider } from "@/components/hub-slider";
import { useLibraries } from "@/components/auth-provider";

import _ from "lodash";
import { cn, durationToText, lerp } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import qs from "qs";
import { Progress } from "@/components/ui/progress";
import { VideoItemInterface } from "@/type";
import {
  DESKTOP_BREAKPOINT,
  GIANT_BREAKPOINT,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
  TINY_BREAKPOINT,
} from "@/hooks/use-is-size";
import { createPortal } from "react-dom";

const CarouselItemHover: FC<{
  open: boolean;
  top: number;
  left: number;
  width: number;
  height: number;
  item: VideoItemInterface;
  onLeave: () => void;
  duration: number;
}> = ({ open, item, onLeave, duration, width, height, top, left }) => {
  const hoverRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState({
    width,
    height,
    top,
    left,
    visible: open,
  });

  useEffect(() => {
    if (!hoverRef.current) return;

    // let timer: NodeJS.Timeout;

    const leave = () => {
      // timer = setTimeout(() => {
      onLeave();
      // }, duration);
    };
    const enter = () => {
      // clearTimeout(timer);
    };

    hoverRef.current.addEventListener("mouseleave", leave);
    hoverRef.current.addEventListener("mouseenter", enter);
    return () => {
      hoverRef.current?.removeEventListener("mouseleave", leave);
      hoverRef.current?.removeEventListener("mouseenter", enter);
    };
  }, [hoverRef.current]);

  useEffect(() => {
    const target = open
      ? {
          width: width * 1.3,
          height: height * 1.3,
          top: top - height * 0.15,
          left: left - width * 0.15,
          visible: true,
        }
      : { width, height, top, left, visible: false };

    let frameId: number;
    const d = duration; // animation duration in ms
    const startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const t = Math.min((now - startTime) / (target.visible ? d : d / 3), 1); // normalize time to range [0, 1]

      setCurrent((prev) => ({
        width: lerp(prev.width, target.width, t),
        height: lerp(prev.height, target.height, t),
        top: lerp(prev.top, target.top, t),
        left: lerp(prev.left, target.left, t),
        visible: open
          ? target.visible
          : t > 0.96
            ? target.visible
            : prev.visible,
      }));

      if (t < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [open, width, height, top, left]);

  if (!current.visible) return null;

  return createPortal(
    <div
      ref={hoverRef}
      className="absolute z-50 bg-red-600 rounded overflow-hidden"
      style={{
        top: current.top,
        left: current.left,
        width: current.width,
        height: current.height,
      }}
    >
      <button
        style={{
          background: `url(${item.image}) center center / cover no-repeat`,
        }}
        className="relative aspect-video w-full flex flex-col"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          console.log("play");
        }}
      >
        <div className="flex-1"></div>
        {(item.type === "episode" || item.type === "movie") &&
          (item.viewOffset || (item.viewCount && item.viewCount >= 1)) && (
            <Progress
              className="absolute rounded-t-none rounded-b bottom-0 left-0 h-[4px]"
              value={
                item.viewOffset
                  ? Math.floor((item.viewOffset / item.duration) * 100)
                  : 100
              }
            />
          )}
      </button>
    </div>,
    document.body,
  );
};

const CarouselItem: FC<{
  size: number;
  item: VideoItemInterface;
  mr: number;
}> = ({ size, item, mr }) => {
  const router = useRouter();
  const pathname = usePathname();
  const itemRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const d = 350;

  useEffect(() => {
    if (!itemRef.current) return;

    let timer: NodeJS.Timeout;

    const enter = () => {
      if (itemRef.current) {
        const width = itemRef.current.offsetWidth;
        const height = itemRef.current.offsetHeight;
        const top = itemRef.current.getBoundingClientRect().top;
        const left = itemRef.current.getBoundingClientRect().left;
        setOrigin({ top, left, width, height });
      }

      timer = setTimeout(() => {
        setHover(true);
      }, d);
    };
    const leave = () => {
      clearTimeout(timer);
    };

    itemRef.current.addEventListener("mouseenter", enter);
    itemRef.current.addEventListener("mouseleave", leave);

    return () => {
      itemRef.current?.removeEventListener("mouseenter", enter);
      itemRef.current?.removeEventListener("mouseleave", leave);
    };
  }, []);

  const seasons =
    item.childCount && item.childCount > 1 ? `${item.childCount} Seasons` : "";
  const episodes = item.leafCount
    ? `${item.leafCount} Episode${item.leafCount > 1 ? "s" : ""}`
    : "";
  const duration =
    item.duration && (item.type === "episode" || item.type === "movie")
      ? durationToText(item.duration)
      : "";
  const mid = item.ratingKey.toString();

  return (
    <div
      className="group overflow-x-hidden rounded relative h-full bg-[rgb(21,21,23)] flex flex-col"
      style={{
        minWidth: `${size - mr}px`,
        width: `${size - mr}px`,
        maxWidth: `${size - mr}px`,
        marginRight: `${mr}px`,
      }}
      ref={itemRef}
    >
      {itemRef.current && (
        <CarouselItemHover
          open={hover}
          item={item}
          left={origin.left}
          top={origin.top}
          width={origin.width}
          height={origin.height}
          duration={d}
          onLeave={() => {
            setHover(false);
          }}
        />
      )}
      <button
        style={{
          background: `url(${item.image}) center center / cover no-repeat`,
        }}
        className="relative aspect-video w-full flex flex-col"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          console.log("play");
        }}
      >
        <div className="flex-1"></div>
        {(item.type === "episode" || item.type === "movie") &&
          (item.viewOffset || (item.viewCount && item.viewCount >= 1)) && (
            <Progress
              className="absolute rounded-t-none rounded-b bottom-0 left-0 h-[4px]"
              value={
                item.viewOffset
                  ? Math.floor((item.viewOffset / item.duration) * 100)
                  : 100
              }
            />
          )}
      </button>
      <button
        className="p-4 w-full max-w-full flex-1 text-left flex flex-col gap-0.5"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          router.push(`${pathname}?mid=${mid}`, {
            scroll: false,
          });
        }}
      >
        <p className="font-bold truncate sm:text-md text-sm text-plex flex flex-row items-center gap-2 uppercase">
          {item.type}
          {(item.type === "season" || item.type === "episode") &&
            ` ${item.index}`}
        </p>
        <p className="font-bold line-clamp-1 lg:text-lg">
          {(item.type === "season" ? item.parentTitle : item.title) ??
            item.title}
        </p>
        {item.type === "episode" && item.grandparentTitle && (
          <p className="font-bold text-sm text-muted-foreground line-clamp-1">
            {item.grandparentTitle}
          </p>
        )}
        <div className="flex-1"></div>
        <p className="w-full max-w-full truncate text-sm text-muted-foreground flex flex-row items-center gap-2">
          {(episodes || seasons) && (
            <span className="font-bold">{seasons || episodes}</span>
          )}
          {duration && <span className="font-bold">{duration}</span>}
          <span className="flex-1" />
          <span className="text-xs font-bold">{item.year}</span>
        </p>
      </button>
    </div>
  );
};

const Carousel: FC<{ items: VideoItemInterface[]; px: number; mr: number }> = ({
  items,
  px,
  mr,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAtEndOfScroll, setIsAtEndOfScroll] = useState(false);
  const [isAtStartOfScroll, setIsAtStartOfScroll] = useState(true);
  const [isContainerScrollable, setIsContainerScrollable] = useState(false);
  const [numberOfItemsVisible, setNumberOfItemsVisible] = useState(0);
  const [size, setSize] = useState(0);

  // MUST NOT TOUCH THIS USE EFFECT
  useEffect(() => {
    if (!containerRef.current) return;
    const onscroll = (baseSize = size) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      setIsContainerScrollable(container.scrollWidth > container.offsetWidth);
      setIsAtStartOfScroll(container.scrollLeft === 0);
      setNumberOfItemsVisible(
        Math.floor((container.offsetWidth - px * 2 + mr) / baseSize),
      );

      const isAtStart = container.scrollLeft === 0;
      setIsAtStartOfScroll(() => isAtStart);

      const scrollDelta =
        container.scrollLeft - (container.scrollWidth - container.offsetWidth);
      const isAtEnd = Math.min(Math.ceil(scrollDelta), 0) === 0;
      setIsAtEndOfScroll(() => isAtEnd);

      const maxScrollLeft = Math.max(container.scrollLeft - px, 0);

      const itemWidthWithMargin = baseSize - mr + (maxScrollLeft < mr ? 0 : mr);

      let index = Math.floor(maxScrollLeft / itemWidthWithMargin);

      if (maxScrollLeft % baseSize !== 0) {
        index++;
      }

      setCurrentIndex(() => index);
    };

    onscroll();

    const scrollbase = () => onscroll();
    const wheelscroll = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    containerRef.current.addEventListener("wheel", wheelscroll, {
      passive: false,
    });
    containerRef.current.addEventListener("scroll", scrollbase);
    return () => {
      containerRef.current?.removeEventListener("wheel", wheelscroll);
      containerRef.current?.removeEventListener("scroll", scrollbase);
    };
  }, [size]);

  useEffect(() => {
    const calcSize = (divider: number) => {
      if (!containerRef.current) return 0;
      return Math.floor((containerRef.current.offsetWidth - px * 2) / divider);
    };

    const sizechange = () => {
      let updatedSize = 0;
      if (window.innerWidth < 520) {
        updatedSize = calcSize(1);
      } else if (window.innerWidth < TINY_BREAKPOINT) {
        updatedSize = calcSize(2);
      } else if (window.innerWidth < MOBILE_BREAKPOINT) {
        updatedSize = calcSize(3);
      } else if (window.innerWidth < TABLET_BREAKPOINT) {
        updatedSize = calcSize(4);
      } else if (window.innerWidth < DESKTOP_BREAKPOINT) {
        updatedSize = calcSize(5);
      } else if (window.innerWidth < GIANT_BREAKPOINT) {
        updatedSize = calcSize(6);
      } else {
        updatedSize = calcSize(7);
      }

      setSize(updatedSize);
      return updatedSize;
    };

    sizechange();

    const onresize = (event: UIEvent) => {
      const updatedSize = sizechange();
      if (containerRef.current) {
        const updatedNumberOfItemsVisible = Math.floor(
          (containerRef.current.offsetWidth - px * 2 + mr) / updatedSize,
        );
        setNumberOfItemsVisible(updatedNumberOfItemsVisible);
        containerRef.current.scroll(currentIndex * updatedSize, 0);
      }
    };

    window.addEventListener("resize", onresize, { passive: true });

    return () => {
      window.removeEventListener("resize", onresize);
    };
  }, [currentIndex]);

  const handlePrevious = () => {
    if (!containerRef.current) return;
    containerRef.current.scroll(
      currentIndex <= numberOfItemsVisible
        ? 0
        : Math.max((currentIndex - numberOfItemsVisible) * size, 0),
      0,
    );
  };

  const handleNext = () => {
    if (!containerRef.current) return;
    containerRef.current.scroll(
      (currentIndex + numberOfItemsVisible) * size,
      0,
    );
  };

  return (
    <div className="max-w-screen-4xl w-full relative group mx-auto">
      <button
        className={cn(
          `hidden absolute left-0 top-0 bottom-0 flex-row justify-center items-center carousel-button z-50 bg-gradient-to-r from-background to-transparent`,
          !isContainerScrollable ? "" : "flex",
        )}
        onClick={handlePrevious}
        style={{ width: `${px}px` }}
        disabled={isAtStartOfScroll}
      >
        <ChevronLeft
          size={40}
          color={"#ffffff"}
          className={cn(
            "duration-200 hidden",
            isAtStartOfScroll ? "" : "group-hover:block",
          )}
        />
      </button>
      <button
        className={cn(
          `hidden absolute right-0 top-0 bottom-0 flex-row justify-center items-center carousel-button z-50 bg-gradient-to-l from-background to-transparent`,
          !isContainerScrollable ? "" : "flex",
        )}
        onClick={handleNext}
        style={{ width: `${px}px` }}
        disabled={isAtEndOfScroll}
      >
        <ChevronRight
          size={40}
          color={"#ffffff"}
          className={cn(
            "duration-200 hidden",
            isAtEndOfScroll ? "" : "group-hover:block",
          )}
        />
      </button>
      <div
        className={`flex flex-row max-w-full overflow-x-auto scroll-smooth no-scrollbar`}
        ref={containerRef}
        style={{ paddingLeft: `${px}px`, paddingRight: `${px}px` }}
      >
        {size === 0
          ? null
          : items.map((item) => (
              // IMPORTANT: The carousel item width must be the same as the size state
              // This is to ensure that the carousel functions correctly
              <CarouselItem
                key={item.ratingKey}
                item={item}
                size={size}
                mr={mr}
              />
            ))}
      </div>
    </div>
  );
};

export default function Page() {
  const { libraries } = useLibraries();
  const lib = _.find(libraries, { title: "Anime" });
  const library = useQuery({
    queryKey: ["details", lib?.key],
    queryFn: async () => {
      if (!lib) return null;
      return await ServerApi.details({ key: lib.key, include: true });
    },
  });
  const [hubs, setHubs] = useState<Plex.Hub[]>([]);

  const updateHubs = () => {
    if (!lib) return;
    ServerApi.hubs({
      id: lib.key,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
    });
  };

  useEffect(() => {
    if (!lib) return;
    setHubs([]);
    ServerApi.hubs({
      id: lib.key,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
    });
  }, [lib?.key]);

  useEffect(() => {
    window.addEventListener("popstate", updateHubs);
    return () => {
      window.removeEventListener("popstate", updateHubs);
    };
  }, []);

  if (!library.data || !lib) {
    return null;
  }

  const type = library.data.Type[0].type;

  const token = localStorage.getItem("token");

  if (type === "show" || type === "movie") {
    return (
      <>
        <div className="w-full flex flex-col items-start justify-start">
          <div
            className={`flex flex-col items-start justify-start w-full z-10 mt-36`}
          >
            {hubs.length > 0 && hubs[0].Metadata && (
              <Carousel
                px={80}
                mr={10}
                items={hubs[0].Metadata.map((item) => ({
                  ...item,
                  contentRating: item.contentRating ?? "",
                  image:
                    item.type === "episode"
                      ? `${localStorage.getItem("server")}/photo/:/transcode?${qs.stringify(
                          {
                            width: 300 * 2,
                            height: 170 * 2,
                            url: `${item.thumb}?X-Plex-Token=${token}`,
                            minSize: 1,
                            upscale: 1,
                            "X-Plex-Token": token,
                          },
                        )}`
                      : `${localStorage.getItem("server")}/photo/:/transcode?${qs.stringify(
                          {
                            width: 300 * 2,
                            height: 170 * 2,
                            url: `${item.art}?X-Plex-Token=${token}`,
                            minSize: 1,
                            upscale: 1,
                            "X-Plex-Token": token,
                          },
                        )}`,
                }))}
              />
            )}
            {hubs.map((item, i) => (
              <HubSlider
                key={`${item.key}-${i}`}
                id={lib.key}
                hub={item}
                onUpdate={() => updateHubs()}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return null;
}
