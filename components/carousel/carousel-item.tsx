import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { CarouselItemHover, useCarouselItem } from "@/components/carousel";

const CarouselItem: FC<{
  children: ReactNode;
  hoverview: ReactNode;
  index: number;
  refKey: string;
}> = ({ children, hoverview, index, refKey }) => {
  const { size, isFirst, isLast, open, close, isOpen } = useCarouselItem(
    index,
    refKey,
  );
  const itemRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState({
    top: 0,
    left: 0,
    height: 0,
  });
  const d = 350;

  useEffect(() => {
    if (!itemRef.current) return;

    let timer: NodeJS.Timeout;

    const enter = () => {
      if (itemRef.current) {
        const height = itemRef.current.offsetHeight;
        const top = itemRef.current.getBoundingClientRect().top;
        const left = itemRef.current.getBoundingClientRect().left;
        setOrigin({ top, left, height });
      }

      timer = setTimeout(open, d);
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
  }, [itemRef.current]);

  return (
    <div
      className="group overflow-x-hidden rounded relative h-full flex flex-col"
      style={{
        minWidth: `${size}px`,
        width: `${size}px`,
        maxWidth: `${size}px`,
      }}
      ref={itemRef}
    >
      {hoverview && itemRef.current && (
        <CarouselItemHover
          refKey={refKey}
          open={isOpen}
          left={origin.left}
          top={origin.top}
          width={size}
          height={origin.height}
          duration={d}
          onLeave={close}
          isFirst={isFirst}
          isLast={isLast}
        >
          {hoverview}
        </CarouselItemHover>
      )}
      {children}
    </div>
  );
};

export default CarouselItem;
