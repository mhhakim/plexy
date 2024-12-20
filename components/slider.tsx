import { Icon } from "@iconify/react";
import { ReactNode, useEffect, useState } from "react";
import ChevronLeft from "@iconify/icons-mdi/chevron-left";
import ChevronRight from "@iconify/icons-mdi/chevron-right";
import { clsx } from "clsx";

interface Slide {
  id: string;
  title: string;
  image: string;
  subtitle: ReactNode;
}

interface ContentProps {
  hasMoved: boolean;
  itemsInRow: number;
  lowestVisibleIndex: number;
  slides: Slide[];
  totalItems: number;
}

export function Content({
  hasMoved,
  itemsInRow,
  lowestVisibleIndex,
  slides,
  totalItems,
}: ContentProps) {
  const left = [];
  const middle = [];
  const right = [];

  for (let i = 0; i < itemsInRow; i++) {
    // left
    if (hasMoved) {
      if (lowestVisibleIndex + i - itemsInRow < 0) {
        left.push(totalItems - itemsInRow + lowestVisibleIndex + i);
      } else {
        left.push(i + lowestVisibleIndex - itemsInRow); // issue here
      }
    }

    // middle
    if (i + lowestVisibleIndex >= totalItems) {
      middle.push(i + lowestVisibleIndex - totalItems);
    } else {
      middle.push(i + lowestVisibleIndex);
    }

    // right
    if (i + lowestVisibleIndex + itemsInRow >= totalItems) {
      right.push(i + lowestVisibleIndex + itemsInRow - totalItems);
    } else {
      right.push(i + lowestVisibleIndex + itemsInRow);
    }
  }

  const indexToDisplay = [...left, ...middle, ...right];

  // add on leading and trailing indexes for peek image when sliding
  if (hasMoved) {
    const trailingIndex =
      indexToDisplay[indexToDisplay.length - 1] === totalItems - 1
        ? 0
        : indexToDisplay[indexToDisplay.length - 1] + 1;
    const leadingIndex =
      indexToDisplay[0] === 0 ? totalItems - 1 : indexToDisplay[0] - 1;

    indexToDisplay.unshift(leadingIndex);
    indexToDisplay.push(trailingIndex);
  }

  const sliderContents = indexToDisplay.map((index) => {
    console.log(index, slides);
    return (
      <div
        className="inline-block h-full px-1 transition-all duration-500 first-of-type:pl-0 last-of-type:pr-0 hover:scale-150"
        style={{
          width: `${100 / itemsInRow}%`,
        }}
        key={`${slides[index].id}-${index}`}
      >
        <div className="fixed bottom-4 left-4 flex flex-col items-start gap-px text-sm ">
          <p className="font-bold">{slides[index].title}</p>
          {slides[index].subtitle}
        </div>
        <img className="h-full w-full max-w-full" src={slides[index].image} />
      </div>
    );
  });

  // adds empty divs to take up appropriate spacing when slider at initial position
  if (!hasMoved) {
    for (let i = 0; i < itemsInRow; i++) {
      sliderContents.unshift(
        <div
          className="inline-block"
          style={{ width: `${100 / itemsInRow}%` }}
          key={i}
        />,
      );
    }
  }

  return sliderContents;
}

interface ControlProps {
  direction: "left" | "right";
  handleClick: () => void;
}

export function Control({ direction, handleClick }: ControlProps) {
  return (
    <div
      className={clsx(
        direction === "right" && "right-0",
        direction === "left" && "left-0",
        "absolute top-0 z-10 flex h-full w-[4%] items-center justify-center text-white opacity-0 transition-opacity duration-300 hover:bg-gray-800/70 hover:opacity-100",
      )}
    >
      <button
        className="text-6xl transition-transform duration-300 hover:scale-150 active:scale-125"
        onClick={handleClick}
      >
        <Icon icon={direction === "right" ? ChevronRight : ChevronLeft} />
      </button>
    </div>
  );
}

interface SliderProps {
  slides: Slide[];
}

export function Slider({ slides }: SliderProps) {
  const [hasMoved, setHasMoved] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [movePercentage, setMovePercentage] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [lowestVisibleIndex, setLowestVisibleIndex] = useState(0);
  const [itemsInRow, setItemsInRow] = useState(5);

  useEffect(() => {
    function handleWindowResize() {
      if (window.innerWidth > 1440) {
        setItemsInRow(6);
      } else if (window.innerWidth >= 1000) {
        setItemsInRow(5);
      } else if (window.innerWidth < 1000) {
        setItemsInRow(4);
      }
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });

  function handleNext() {
    const totalItems = slides.length;

    // get the new lowest visible index
    let newIndex: number;
    if (lowestVisibleIndex === totalItems - itemsInRow) {
      newIndex = 0;
    } else if (lowestVisibleIndex + itemsInRow > totalItems - itemsInRow) {
      newIndex = totalItems - itemsInRow;
    } else {
      newIndex = lowestVisibleIndex + itemsInRow;
    }

    // get the move percentage
    let newMovePercentage;
    if (newIndex !== 0) {
      newMovePercentage = ((newIndex - lowestVisibleIndex) / itemsInRow) * 100;
    } else {
      newMovePercentage = 100;
    }

    setIsMoving(true);
    setDirection("right");
    setMovePercentage(newMovePercentage);

    setTimeout(() => {
      setLowestVisibleIndex(newIndex);
      setIsMoving(false);
    }, 750);

    // show the previous arrow
    if (!hasMoved) {
      setHasMoved(true);
    }
  }

  function handlePrevious() {
    const totalItems = slides.length;

    // get the new lowest visible index
    let newIndex: number;
    if (lowestVisibleIndex < itemsInRow && lowestVisibleIndex !== 0) {
      newIndex = 0;
    } else if (lowestVisibleIndex - itemsInRow < 0) {
      newIndex = totalItems - itemsInRow;
    } else {
      newIndex = lowestVisibleIndex - itemsInRow;
    }

    // get the move percentage
    let newMovePercentage;
    if (lowestVisibleIndex === 0) {
      newMovePercentage = 0;
    } else if (lowestVisibleIndex - newIndex < itemsInRow) {
      newMovePercentage =
        ((itemsInRow - (lowestVisibleIndex - newIndex)) / itemsInRow) * 100;
    } else {
      newMovePercentage = 0;
    }

    setIsMoving(true);
    setDirection("left");
    setMovePercentage(newMovePercentage);

    setTimeout(() => {
      setLowestVisibleIndex(newIndex);
      setIsMoving(false);
    }, 750);
  }

  let contentStyle: React.CSSProperties = {};
  if (isMoving) {
    let translate = "";
    if (direction === "right") {
      translate = `translateX(-${100 + movePercentage + 100 / itemsInRow}%)`;
    } else if (direction === "left") {
      translate = `translateX(-${movePercentage + 100 / itemsInRow}%)`;
    }

    contentStyle = {
      transform: translate,
      transitionDuration: "750ms",
    };
  } else {
    contentStyle = {
      transform: `translateX(-${100 + (hasMoved ? 100 / itemsInRow : 0)}%)`,
    };
  }

  return (
    <div className="relative flex px-[4%]">
      {hasMoved && <Control direction="left" handleClick={handlePrevious} />}
      <div className="whitespace-nowrap" style={contentStyle}>
        <Content
          hasMoved={hasMoved}
          itemsInRow={itemsInRow}
          lowestVisibleIndex={lowestVisibleIndex}
          slides={slides}
          totalItems={slides.length}
        />
      </div>

      <Control direction="right" handleClick={handleNext} />
    </div>
  );
}
