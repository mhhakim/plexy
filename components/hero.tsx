"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Info, Play } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ServerApi } from "@/api";
import { useQuery } from "@tanstack/react-query";

export const Hero: FC<{ item: Plex.Metadata }> = ({ item }) => {
  const router = useRouter();
  const pathname = usePathname();

  const metadata = useQuery({
    queryKey: ["metadata", item.ratingKey],
    queryFn: async () => {
      return ServerApi.metadata({ id: item.ratingKey }).then((res) => res);
    },
  });

  return (
    <div className="w-full flex flex-col items-start justify-start h-auto">
      <div
        className="w-full flex flex-col items-start justify-center z-0 pt-[40vh] pb-60"
        style={{
          background: `linear-gradient(0, hsl(var(--background)), rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1)), url(${localStorage.getItem("server")}${item.art}?X-Plex-Token=${localStorage.getItem("token")}) center center / cover no-repeat`,
        }}
      >
        <div className="ml-20 mr-20 flex flex-col gap-4">
          <div className="flex flex-row items-center justify-start gap-2">
            <img
              loading="lazy"
              src="https://i.imgur.com/7MHdofK.png"
              alt="plex icon"
              width={35}
              height={35}
            />
            <p className="text-plex text-2xl font-bold drop-shadow-md uppercase tracking-wider">
              {item.type}
            </p>
          </div>
          <p className="font-bold text-5xl">{item.title}</p>
          <p className="font-bold text-muted-foreground max-w-4xl line-clamp-3">
            {item.summary}
          </p>
          <div className="flex flex-row gap-2">
            {metadata.data && (
              <Button
                variant="plex"
                onClick={() => {
                  if (metadata.data?.type === "movie") {
                    router.push(
                      `${pathname}?watch=${metadata.data.ratingKey}${metadata.data.viewOffset ? `&t=${metadata.data.viewOffset}` : ""}`,
                      { scroll: false },
                    );
                    return;
                  }

                  if (metadata.data?.type === "episode") {
                    router.push(
                      `${pathname}?watch=${metadata.data.ratingKey.toString()}${metadata.data.viewOffset ? `&t=${metadata.data.viewOffset}` : ""}`,
                      { scroll: false },
                    );
                    return;
                  }

                  if (
                    metadata.data?.type === "show" ||
                    metadata.data?.type === "season"
                  ) {
                    if (metadata.data.OnDeck && metadata.data.OnDeck.Metadata) {
                      router.push(
                        `${pathname}?watch=${metadata.data.OnDeck.Metadata.ratingKey}${
                          metadata.data.OnDeck.Metadata.viewOffset
                            ? `&t=${metadata.data.OnDeck.Metadata.viewOffset}`
                            : ""
                        }`,
                        { scroll: false },
                      );
                      return;
                    }

                    const season =
                      metadata.data.type === "season"
                        ? metadata.data
                        : metadata.data?.Children?.Metadata.find(
                            (s) => s.title !== "Specials",
                          );
                    if (!season) return;

                    ServerApi.children({
                      id: season.ratingKey as string,
                    }).then((eps) => {
                      if (!eps) return;

                      router.push(`${pathname}?watch=${eps[0].ratingKey}`, {
                        scroll: false,
                      });
                      return;
                    });
                  }
                }}
              >
                <Play fill="currentColor" /> Play{" "}
                {(metadata.data.type === "show" ||
                  metadata.data?.type === "season") &&
                  metadata.data.OnDeck &&
                  metadata.data.OnDeck?.Metadata &&
                  `${
                    metadata.data?.Children?.size &&
                    metadata.data.Children.size > 0
                      ? `S${metadata.data.OnDeck.Metadata.parentIndex}`
                      : ""
                  }
                              E${metadata.data.OnDeck.Metadata.index}`}
              </Button>
            )}
            <Button
              type="button"
              className="w-fit font-bold"
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
    </div>
  );
};
