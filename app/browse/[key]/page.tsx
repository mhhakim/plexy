"use client";

import { ServerApi } from "@/api";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Hero } from "@/components/hero";
import { HubSlider } from "@/components/hub-slider";
import { Button } from "@/components/ui/button";
import qs from "qs";
import { useHubs } from "@/hooks/use-hubs";

export default function Page() {
  const params = useParams<{ key: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const library = useQuery({
    queryKey: ["details", params.key],
    queryFn: async () => {
      return await ServerApi.details({ key: params.key, include: true });
    },
  });
  const [featured, setFeatured] = useState<Plex.Metadata | null>(null);
  const [initialHubs, setInitialHubs] = useState<Plex.Hub[]>([]);
  const { hubs, reload, append } = useHubs(initialHubs);

  const handleUpdate = (
    updatedItem: Plex.HubMetadata,
    _: number,
    hubIndex: number,
  ) => {
    const hubsIndex = [hubIndex];
    const keys = [updatedItem.ratingKey];
    if (updatedItem.parentRatingKey) keys.push(updatedItem.parentRatingKey);
    if (updatedItem.grandparentRatingKey)
      keys.push(updatedItem.grandparentRatingKey);
    hubs?.forEach((hub, index) => {
      if (hubIndex === index) return;
      const included = hub.Metadata?.some((item) => {
        return keys.includes(item.ratingKey);
      });
      if (
        included ||
        hub.context.includes("recentlyviewed") ||
        hub.context.includes("inprogress")
      ) {
        hubsIndex.push(index);
      }
    });
    hubsIndex.forEach((index) => {
      reload(index);
    });
  };

  useEffect(() => {
    setFeatured(null);
    setInitialHubs([]);

    ServerApi.random({ dir: params.key }).then((res) => {
      if (!res) return;
      setFeatured(res);
    });

    ServerApi.hubs({
      id: params.key,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setInitialHubs(
        res.filter((hub) => hub.Metadata && hub.Metadata.length > 0),
      );
    });
  }, [params.key]);

  useEffect(() => {
    const updateHubs = (event: PopStateEvent) => {
      const storage = localStorage.getItem("from-meta-screen");
      if (storage) {
        const { ratingKey, parentRatingKey, grandparentRatingKey } = JSON.parse(
          storage,
        ) as {
          ratingKey: string;
          parentRatingKey: string | null;
          grandparentRatingKey: string | null;
        };
        const hubsIndex: number[] = [];
        const keys = [ratingKey];
        if (parentRatingKey) keys.push(parentRatingKey);
        if (grandparentRatingKey) keys.push(grandparentRatingKey);
        hubs?.forEach((hub, index) => {
          const included = hub.Metadata?.some((item) =>
            keys.includes(item.ratingKey),
          );
          if (
            included ||
            hub.context.includes("recentlyviewed") ||
            hub.context.includes("inprogress")
          ) {
            hubsIndex.push(index);
          }
        });
        hubsIndex.forEach((index) => {
          reload(index);
        });
      }
      localStorage.removeItem("from-meta-screen");
    };

    window.addEventListener("popstate", updateHubs);
    return () => {
      window.removeEventListener("popstate", updateHubs);
    };
  }, [params.key, hubs]);

  if (!library.data) {
    return null;
  }

  const type = library.data.Type[0].type;

  if (type === "show" || type === "movie") {
    return (
      <>
        <div className="w-full flex flex-col items-start justify-start">
          {featured && <Hero item={featured} />}
          <div className="flex flex-col items-start justify-start w-full z-10 lg:-mt-[calc(10vw-4rem)] md:mt-[3rem] -mt-[calc(-10vw-2rem)]">
            {hubs &&
              hubs.map((item, i) => (
                <HubSlider
                  key={`${item.key}-${i}`}
                  id={params.key}
                  hub={item}
                  onAppend={(items: Plex.HubMetadata[]) => append(i, items)}
                  onUpdate={(updatedItem, itemIndex) =>
                    handleUpdate(updatedItem, itemIndex, i)
                  }
                />
              ))}
          </div>
        </div>
        <div className="absolute right-0 top-16 p-4">
          <Button
            type="button"
            variant="search"
            size="sm"
            onClick={() => {
              router.push(
                `${pathname}?${qs.stringify({ key: `/library/sections/${params.key}/all?sort=titleSort`, libtitle: "Library" })}`,
                {
                  scroll: false,
                },
              );
            }}
          >
            Library
          </Button>
        </div>
      </>
    );
  }

  return null;
}
