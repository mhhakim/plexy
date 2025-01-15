import { FC, useEffect, useRef, useState } from "react";
import { VideoItemInterface } from "@/type";
import { lerp } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Progress } from "@/components/ui/progress";

const CarouselItemHover: FC<{
  open: boolean;
  top: number;
  left: number;
  right: number;
  width: number;
  height: number;
  item: VideoItemInterface;
  onLeave: () => void;
  duration: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({
  open,
  item,
  onLeave,
  duration,
  width,
  height,
  top,
  left,
  isFirst,
  isLast,
}) => {
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

    hoverRef.current.addEventListener("mouseleave", onLeave);
    return () => {
      hoverRef.current?.removeEventListener("mouseleave", onLeave);
    };
  }, [hoverRef.current]);

  useEffect(() => {
    const getLeft = () => {
      if (isFirst && isLast) {
        return left - width * 0.15;
      }

      if (isFirst) {
        return left;
      }

      if (isLast) {
        return left - width * 0.3;
      }

      return left - width * 0.15;
    };

    const target = open
      ? {
          width: width * 1.3,
          height: height * 1.3,
          top: top - height * 0.15,
          left: getLeft(),
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

  console.log(isLast);

  return createPortal(
    <div
      ref={hoverRef}
      className="absolute z-50 bg-red-600 rounded overflow-hidden"
      style={{
        top: current.top,
        left: current.left,
        width: current.width,
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

export default CarouselItemHover;
