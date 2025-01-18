"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Info, Play } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ServerApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useHubItem } from "@/hooks/use-hub-item";
import { APPBAR_HEIGHT } from "@/components/appbar";

export const Hero: FC<{ item: Plex.Metadata }> = ({ item }) => {
  const router = useRouter();
  const pathname = usePathname();

  const metadata = useQuery({
    queryKey: ["metadata", item.ratingKey],
    queryFn: async () => {
      return ServerApi.metadata({ id: item.ratingKey }).then((res) => res);
    },
  });

  const { play } = useHubItem(metadata.data ?? item);

  return (
    <div className="w-full flex flex-col items-start justify-start relative">
      <div className="relative w-full">
        <img
          className="w-full top-0"
          src={`${localStorage.getItem("server")}${item.art}?X-Plex-Token=${localStorage.getItem("token")}`}
          alt="preview image"
        />
        <div
          className="w-full h-full absolute top-0"
          style={{
            background:
              "linear-gradient(0, hsl(var(--background)), rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.1))",
          }}
        />
        <div
          className={`w-full absolute top-0`}
          style={{
            height: `calc(${APPBAR_HEIGHT}*5)`,
            background:
              "linear-gradient(to top, transparent, rgba(0,0,0,0.06), rgba(0,0,0,0.2), rgba(0,0,0,0.5), rgba(0,0,0,0.8))",
          }}
        />
      </div>
      <div className="flex flex-col items-start justify-center mx-20 gap-4 absolute -bottom-[10vw] md:bottom-0 lg:bottom-[10vw]">
        <p className="font-bold text-xl sm:text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl max-w-screen-lg line-clamp-2 md:line-clamp-3 lg:line-clamp-none">
          {item.title}
        </p>
        <p className="font-bold text-muted-foreground max-w-4xl md:line-clamp-3 hidden sm:line-clamp-2">
          {item.summary}
        </p>
        <div className="flex flex-row gap-2">
          {metadata.data && (
            <Button
              variant="default"
              onClick={play}
              className="font-bold xl:text-lg"
            >
              <Play fill="currentColor" /> Play
              {(metadata.data.type === "show" ||
                metadata.data.type === "season") &&
                metadata.data.OnDeck &&
                metadata.data.OnDeck?.Metadata &&
                ` ${
                  metadata.data.Children?.size &&
                  metadata.data.Children.size > 0
                    ? `S${metadata.data.OnDeck.Metadata.parentIndex}`
                    : ""
                } E${metadata.data.OnDeck.Metadata.index}`}
            </Button>
          )}
          <Button
            type="button"
            className="font-bold xl:text-lg"
            onClick={() => {
              router.push(`${pathname}?mid=${item.ratingKey.toString()}`, {
                scroll: false,
              });
            }}
          >
            <Info /> More Info
          </Button>
        </div>
      </div>
    </div>
  );
};
