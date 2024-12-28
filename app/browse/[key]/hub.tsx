"use client";

import { FC, useEffect, useState } from "react";
import { ServerApi } from "@/api";
import { Hero } from "@/components/hero";
import { HubSlider } from "@/components/hub-slider";

export const Hub: FC<{ library: Plex.LibraryDetails; id: string }> = ({
  id,
}) => {
  const [featured, setFeatured] = useState<Plex.Metadata | null>(null);
  const [hubs, setHubs] = useState<Plex.Hub[]>([]);

  const updateHubs = () => {
    ServerApi.hubs({
      id: id,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
    });
  };

  useEffect(() => {
    setFeatured(null);
    setHubs([]);

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

  useEffect(() => {
    window.addEventListener("popstate", updateHubs);
    return () => {
      window.removeEventListener("popstate", updateHubs);
    };
  }, []);

  if (!featured) return;

  return (
    <div className="w-full flex flex-col items-start justify-start">
      <Hero item={featured} />
      <div
        className={`flex flex-col items-start justify-start w-full z-10 -mt-20`}
      >
        {hubs.map((item, i) => (
          <HubSlider
            key={`${item.key}-${i}`}
            id={id}
            hub={item}
            onUpdate={() => updateHubs()}
          />
        ))}
      </div>
    </div>
  );
};
