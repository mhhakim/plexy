import { FC, ReactNode, useEffect, useRef, useState } from "react";
import {
  DESKTOP_BREAKPOINT,
  GIANT_BREAKPOINT,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
  TINY_BREAKPOINT,
} from "@/hooks/use-is-size";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Carousel: FC<{ items: ReactNode; px: number; mr: number }> = ({
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
        {size === 0 ? null : items}
      </div>
    </div>
  );
};

export default Carousel;
