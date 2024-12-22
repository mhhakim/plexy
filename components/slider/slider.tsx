import { FC } from "react";
import { useSliding } from "@/components/slider/use-sliding";
import "@/components/slider/slider.scss";
import { useIsSize } from "@/hooks/use-is-size";
import { ChevronDown, CircleCheck } from "lucide-react";
import { durationToText } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { VideoItemInterface } from "@/type";

export const Slider: FC<{ items: VideoItemInterface[] }> = ({ items }) => {
  const {
    handlePrev,
    handleNext,
    slideProps,
    containerRef,
    hasNext,
    hasPrev,
    elementRef,
  } = useSliding(items.length);
  const router = useRouter();
  const pathname = usePathname();
  const { isTiny, isMobile, isTablet, isDesktop } = useIsSize();

  const isFirst = (i: number) => {
    if (isTiny) return i % 2 === 0;
    if (isMobile) return i % 3 === 0;
    if (isTablet) return i % 4 === 0;
    if (isDesktop) return i % 5 === 0;
    return i % 6 === 0;
  };

  const isLast = (i: number) => {
    if (isTiny) return isFirst(i - 1);
    if (isMobile) return isFirst(i - 2);
    if (isTablet) return isFirst(i - 3);
    if (isDesktop) return isFirst(i - 4);
    return isFirst(i - 5);
  };

  return (
    <div className="pt-[20px] pb-[40px] overflow-visible relative slider__parent">
      <div className="slider">
        <div ref={containerRef} className="slider__container" {...slideProps}>
          {items.map((item, i) => {
            const watched =
              (item.type === "show" &&
                item.leafCount === item.viewedLeafCount) ||
              (item.type === "movie" && item?.viewCount && item.viewCount > 0);
            const seasons =
              item.childCount && item.childCount > 1
                ? `${item.childCount} Seasons`
                : "";
            const episodes = item.leafCount
              ? `${item.leafCount} Episode${item.leafCount > 1 ? "s" : ""}`
              : "";
            const duration =
              item.duration &&
              (item.type === "episode" || item.type === "movie")
                ? durationToText(item.duration)
                : "";
            const mid =
              item.grandparentRatingKey && item.type === "episode"
                ? item.grandparentRatingKey
                : item.ratingKey.toString();
            return (
              <button
                key={`${item.image}-${i}`}
                className="item group overflow-hidden"
                {...{ "data-first": isFirst(i), "data-last": isLast(i) }}
                ref={i === 0 ? elementRef : undefined}
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
                    <p className="font-bold truncate sm:text-md text-sm text-plex flex flex-row items-center gap-2 uppercase">
                      {item.type}
                    </p>
                    <p className="font-bold truncate lg:text-lg">
                      {item.title}
                    </p>
                    {item.type === "episode" && item.grandparentTitle && (
                      <p className="font-bold text-sm text-muted-foreground line-clamp-1">
                        {item.grandparentTitle}
                      </p>
                    )}
                    <p className="w-full max-w-full truncate text-sm text-muted-foreground flex flex-row items-center gap-2">
                      {(episodes || seasons) && (
                        <span className="font-bold">{seasons || episodes}</span>
                      )}
                      {duration && (
                        <span className="font-bold">{duration}</span>
                      )}
                      <span className="flex-1" />
                      <span className="text-xs font-bold">{item.year}</span>
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {hasPrev && (
        <button
          className={`slide-button slide-button--prev`}
          onClick={handlePrev}
        >
          <span>
            <ChevronDown size={50} color={"#ffffff"} />
          </span>
        </button>
      )}
      {hasNext && (
        <button
          className={`slide-button slide-button--next`}
          onClick={handleNext}
        >
          <span>
            <ChevronDown size={50} color={"#ffffff"} />
          </span>
        </button>
      )}
    </div>
  );
};
