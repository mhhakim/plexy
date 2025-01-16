"use client";

import { ServerApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { HubSlider } from "@/components/hub-slider";
import { useLibraries } from "@/components/auth-provider";
import _ from "lodash";
import { durationToText } from "@/lib/utils";
import qs from "qs";
import { Carousel, CarouselItem } from "@/components/carousel";
import { OnDeckImagePreviewItem } from "@/components/hub/on-deck-image-preview-item";

export default function Page() {
  const { libraries } = useLibraries();
  const lib = _.find(libraries, { title: "Anime" });
  const library = useQuery({
    queryKey: ["details", lib?.key],
    queryFn: async () => {
      if (!lib) return null;
      return await ServerApi.details({ key: lib.key, include: true });
    },
  });
  const [hubs, setHubs] = useState<Plex.Hub[]>([]);

  const updateHubs = () => {
    if (!lib) return;
    ServerApi.hubs({
      id: lib.key,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
    });
  };

  useEffect(() => {
    if (!lib) return;
    setHubs([]);
    ServerApi.hubs({
      id: lib.key,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
    });
  }, [lib?.key]);

  useEffect(() => {
    window.addEventListener("popstate", updateHubs);
    return () => {
      window.removeEventListener("popstate", updateHubs);
    };
  }, []);

  if (!library.data || !lib) {
    return null;
  }

  const type = library.data.Type[0].type;

  if (type === "show" || type === "movie") {
    return (
      <>
        <div className="w-full flex flex-col items-start justify-start">
          <div
            className={`flex flex-col items-start justify-start w-full z-10 mt-36`}
          >
            {hubs.map((item, i) => (
              <HubSlider
                key={`${item.key}-${i}`}
                id={lib.key}
                hub={item}
                onUpdate={() => updateHubs()}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return null;
}
