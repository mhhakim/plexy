"use client";

import { ServerApi } from "@/api";
import { useEffect, useState } from "react";
import { Hero } from "@/components/hero";
import _ from "lodash";
import { HubSlider } from "@/components/hub-slider";

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

  return (
    <div className="w-full flex flex-col items-start justify-start">
      {item ? <Hero item={item} /> : <div className="h-16" />}
      <div
        className={`flex flex-col items-start justify-start w-full z-10 ${item ? "-mt-20" : ""}`}
      >
        {continueWatching && <HubSlider hub={continueWatching} />}
        {promoted &&
          promoted.map((item, i) => (
            <HubSlider key={`${item.key}-${i}`} hub={item} />
          ))}
      </div>
    </div>
  );
}
