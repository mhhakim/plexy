"use client";

import { FC, useEffect, useState } from "react";
import { ServerApi } from "@/api";
import { Hero } from "@/components/hero";
import { Slider } from "@/components/slider";
import { PLEX } from "@/constants";
import qs from "qs";

export const Hub: FC<{ library: Plex.LibraryDetails; id: string }> = ({
  id,
}) => {
  const [featured, setFeatured] = useState<Plex.Metadata | null>(null);
  const [hubs, setHubs] = useState<Plex.Hub[]>([]);

  useEffect(() => {
    setFeatured(null);
    setHubs([]);
    console.log(id);
    ServerApi.random({ dir: id }).then((res) => {
      if (!res) return;
      setFeatured(res);
    });

    ServerApi.hubs({
      id: id,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
    });
  }, [id]);

  if (!featured) return;

  const token = localStorage.getItem("token");

  return (
    <div className="w-full flex flex-col items-start justify-start">
      <Hero item={featured} />
      <div
        className={`flex flex-col items-start justify-start w-full z-10 ${featured ? "-mt-20" : ""}`}
      >
        {hubs.map((item, i) => (
          <div
            key={`${item.key}-${i}`}
            className="w-[100%] overflow-x-hidden overflow-y-visible"
          >
            <p className="px-20 font-bold text-xl md:text-2xl xl:text-3xl tracking-tight">
              <span className="px-[5px]">{item.title}</span>
            </p>
            {item.Metadata && (
              <Slider
                items={item.Metadata.map((item) => ({
                  ...item,
                  contentRating: item.contentRating ?? "",
                  image:
                    item.type === "episode"
                      ? `${localStorage.getItem("server")}/photo/:/transcode?${qs.stringify(
                          {
                            width: 300 * 2,
                            height: 170 * 2,
                            url: `${item.thumb}?X-Plex-Token=${token}`,
                            minSize: 1,
                            upscale: 1,
                            "X-Plex-Token": token,
                          },
                        )}`
                      : `${localStorage.getItem("server")}/photo/:/transcode?${qs.stringify(
                          {
                            width: 300 * 2,
                            height: 170 * 2,
                            url: `${item.art}?X-Plex-Token=${token}`,
                            minSize: 1,
                            upscale: 1,
                            "X-Plex-Token": token,
                          },
                        )}`,
                }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
