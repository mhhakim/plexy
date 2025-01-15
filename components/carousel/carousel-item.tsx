import { FC, useEffect, useRef, useState } from "react";
import { VideoItemInterface } from "@/type";
import { usePathname, useRouter } from "next/navigation";
import { durationToText } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { CarouselItemHover } from "@/components/carousel/index";

const CarouselItem: FC<{
  size: number;
  item: VideoItemInterface;
  mr: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ size, item, mr, isFirst, isLast }) => {
  const router = useRouter();
  const pathname = usePathname();
  const itemRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({
    top: 0,
    left: 0,
    right: 0,
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
        const right = itemRef.current.getBoundingClientRect().right;
        setOrigin({ top, left, right, width, height });
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
          right={origin.right}
          top={origin.top}
          width={origin.width}
          height={origin.height}
          duration={d}
          onLeave={() => setHover(false)}
          isFirst={isFirst}
          isLast={isLast}
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

export default CarouselItem;
