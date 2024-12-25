"use client";

import { ServerApi } from "@/api";
import { useEffect, useState } from "react";
import { Hero } from "@/components/hero";
import { Slider } from "@/components/slider";
import { PLEX } from "@/constants";
import qs from "qs";
import _ from "lodash";

export default function Home() {
  const [item, setItem] = useState<Plex.Metadata | null>(null);
  const [continueWatching, setContinueWatched] = useState<Plex.Hub | null>(
    null,
  );
  const [promoted, setPromoted] = useState<Plex.Hub[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    ServerApi.libraries()
      .then(async (data) => {
        if (!data) {
          return;
        }
        const dirs = data.map((a) => a.key);
        const randomDir = _.sample(dirs);
        if (randomDir) {
          const item = await ServerApi.random({ dir: randomDir });
          setItem(item);
        }
        ServerApi.continue({ dirs }).then((res) => {
          if (!res) return;
          if (res.length === 0) return;
          setContinueWatched(res[0]);
        });
        const promo: Plex.Hub[] = [];
        for (const dir of dirs) {
          const res = await ServerApi.promoted({ dir, dirs });
          if (!res) continue;
          if (res.length === 0) continue;
          res.forEach((hub) => {
            promo.push(hub);
          });
        }
        setPromoted(promo);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return null;
  }

  const token = localStorage.getItem("token");

  return (
    <div className="w-full flex flex-col items-start justify-start">
      {item ? <Hero item={item} /> : <div className="h-16" />}
      <div
        className={`flex flex-col items-start justify-start w-full z-10 ${item ? "-mt-20" : ""}`}
      >
        {continueWatching && (
          <div className="w-[100%] overflow-x-hidden">
            <p className="px-20 font-bold text-3xl tracking-tight">
              <span className="px-[5px]">{continueWatching.title}</span>
            </p>
            {continueWatching.Metadata && (
              <Slider
                items={continueWatching.Metadata.map((item) => ({
                  ...item,
                  contentRating: item.contentRating ?? "",
                  image:
                    item.type === "episode"
                      ? `${PLEX.server}/photo/:/transcode?${qs.stringify({
                          width: 300 * 2,
                          height: 170 * 2,
                          url: `${item.thumb}?X-Plex-Token=${token}`,
                          minSize: 1,
                          upscale: 1,
                          "X-Plex-Token": token,
                        })}`
                      : `${PLEX.server}/photo/:/transcode?${qs.stringify({
                          width: 300 * 2,
                          height: 170 * 2,
                          url: `${item.art}?X-Plex-Token=${token}`,
                          minSize: 1,
                          upscale: 1,
                          "X-Plex-Token": token,
                        })}`,
                }))}
              />
            )}
          </div>
        )}
        {promoted &&
          promoted.map((item, i) => (
            <div
              key={`${item.key}-${i}`}
              className="w-[100%] overflow-x-hidden"
            >
              <p className="px-20 font-bold text-3xl tracking-tight">
                <span className="px-[5px]">{item.title}</span>
              </p>
              {item.Metadata && (
                <Slider
                  items={item.Metadata.map((item) => ({
                    ...item,
                    contentRating: item.contentRating ?? "",
                    image:
                      item.type === "episode"
                        ? `${PLEX.server}/photo/:/transcode?${qs.stringify({
                            width: 300 * 2,
                            height: 170 * 2,
                            url: `${item.thumb}?X-Plex-Token=${token}`,
                            minSize: 1,
                            upscale: 1,
                            "X-Plex-Token": token,
                          })}`
                        : `${PLEX.server}/photo/:/transcode?${qs.stringify({
                            width: 300 * 2,
                            height: 170 * 2,
                            url: `${item.art}?X-Plex-Token=${token}`,
                            minSize: 1,
                            upscale: 1,
                            "X-Plex-Token": token,
                          })}`,
                  }))}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
