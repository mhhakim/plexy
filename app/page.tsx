"use client";

import { RecommendationShelf, ServerApi } from "@/api";
import { PLEX } from "@/constants";
import { useEffect, useState } from "react";
import Image from "next/image";
import { VideoCarousel } from "@/components/video-carousel";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { Info } from "lucide-react";

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationShelf[]>(
    [],
  );
  const [item, setItem] = useState<Plex.Metadata | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    ServerApi.libraries()
      .then(async (data) => {
        if (!data) {
          return;
        }
        ServerApi.recommendations({ libraries: data }).then((res) => {
          setRecommendations(res);
        });
        let elem = await ServerApi.random({ libraries: data });
        let retries = 0;
        while (!elem && retries < 15) {
          elem = await ServerApi.random({ libraries: data });
          retries++;
        }
        setItem(elem);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-start justify-start">
      {item ? (
        // Hero
        <div className="w-full flex flex-col items-start justify-start h-auto">
          <div
            className="w-full flex flex-col items-start justify-center z-0 pt-[40vh] pb-60"
            style={{
              background: `linear-gradient(0, hsl(var(--background)), rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)), url(${PLEX.server}${item.art}?X-Plex-Token=${localStorage.getItem("token")}) center center / cover no-repeat`,
            }}
          >
            <div className="ml-20 mr-20 flex flex-col gap-4">
              <div className="flex flex-row items-center justify-start gap-2">
                <Image
                  src="/plexicon.png"
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
              <Button
                type="button"
                className="w-fit font-bold"
                variant="secondary"
                onClick={() => {
                  router.push(`${pathname}?mid=${item.ratingKey.toString()}`);
                }}
              >
                <Info /> More Info
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-16" />
      )}
      <div
        className={`flex flex-col gap-6 items-start justify-start w-full z-10 ${item ? "-mt-20" : ""}`}
      >
        {recommendations.map((recommendation) => (
          <VideoCarousel
            key={recommendation.key}
            dir={recommendation.dir}
            title={recommendation.title}
            link={recommendation.link}
            library={recommendation.library}
          />
        ))}
      </div>
    </div>
  );
}
