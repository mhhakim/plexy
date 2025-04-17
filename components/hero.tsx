"use client";

import { type CSSProperties, FC, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Info, Play } from "lucide-react";
import { ServerApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useHubItem } from "@/hooks/use-hub-item";
import { APPBAR_HEIGHT } from "@/components/appbar";

export const Hero: FC<{ item: Plex.Metadata }> = ({ item }) => {
  const metadata = useQuery({
    queryKey: ["metadata", item.ratingKey],
    queryFn: async () => {
      return ServerApi.metadata({ id: item.ratingKey }).then((res) => res);
    },
  });

  const { play, coverImage, clearLogo, playable, open } = useHubItem(
    metadata.data ?? item,
    {
      fullSize: true,
    },
  );

  const summaryRef = useRef<HTMLParagraphElement | null>(null);
  const [hideSummary, setHideSummary] = useState(false);
  const [summaryHeight, setSummaryHeight] = useState(0);

  useEffect(() => {
    if (summaryRef.current && summaryHeight === 0) {
      setSummaryHeight(summaryRef.current.clientHeight);
    }

    const timer = setTimeout(() => {
      setHideSummary(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full flex flex-col items-start justify-start relative">
      <div className="relative w-full">
        <img className="w-full top-0" src={coverImage} alt="preview image" />
        <div
          className="w-full h-full absolute top-0"
          style={{
            background:
              "linear-gradient(0, hsl(var(--background)), rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.1))",
          }}
        />
        <div
          className="w-full absolute top-0"
          style={{
            height: `calc(${APPBAR_HEIGHT}*5)`,
            background:
              "linear-gradient(to top, transparent, rgba(0,0,0,0.06), rgba(0,0,0,0.2), rgba(0,0,0,0.5), rgba(0,0,0,0.8))",
          }}
        />
      </div>
      <div className="flex flex-col items-start justify-center mx-10 md:mx-20 gap-6 absolute -bottom-[10vw] md:bottom-0 lg:bottom-[10vw]">
        <button
          onClick={() => open()}
          className={hideSummary ? "logo-shift" : ""}
          style={
            {
              "--h": `${summaryHeight}px`,
            } as CSSProperties
          }
        >
          {clearLogo ? (
            <img
              className={`min-w-[150px] w-auto max-w-[calc(100%-5rem)] lg:max-w-[60%] xl:max-w-[600px] max-h-[200px] xl:max-h-[320px] h-full`}
              src={clearLogo}
              alt={item.title}
            />
          ) : (
            <p
              className={`font-bold text-xl sm:text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl max-w-screen-lg line-clamp-2 md:line-clamp-3 lg:line-clamp-none`}
            >
              {item.title}
            </p>
          )}
        </button>
        <p
          ref={summaryRef}
          className={`font-medium max-w-[600px] line-clamp-3 text-xl transition-opacity duration-500 ${
            hideSummary ? "fade-down" : ""
          } ${hideSummary ? "-z-10" : ""}`}
        >
          {item.summary}
        </p>
        <div className="flex flex-row gap-6">
          {metadata.data && (
            <Button
              variant="default"
              size="none"
              onClick={play}
              className="font-semibold text-xl"
            >
              <Play fill="currentColor" /> Play
              {/*{playable*/}
              {/*  ? `${playable.season !== null ? ` S${playable.season}` : ""}${playable.episode !== null ? ` E${playable.episode}` : ""}`*/}
              {/*  : null}*/}
            </Button>
          )}
          <Button
            type="button"
            size="none"
            className="font-semibold text-xl"
            onClick={() => open()}
          >
            <Info /> More Info
          </Button>
        </div>
      </div>
    </div>
  );
};
