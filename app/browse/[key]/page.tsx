"use client";

import { ServerApi } from "@/api";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Hero } from "@/components/hero";
import { HubSlider } from "@/components/hub-slider";
import { Button } from "@/components/ui/button";
import qs from "qs";

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
  const [hubs, setHubs] = useState<Plex.Hub[]>([]);

  const updateHub = (
    updatedItem: Plex.HubMetadata,
    itemIndex: number,
    hubIndex: number,
  ) => {
    setHubs((prev) => {
      const updated = [...prev];
      if (updated[hubIndex].Metadata) {
        updated[hubIndex].Metadata[itemIndex] = updatedItem;
      }
      return updated;
    });
  };

  useEffect(() => {
    setFeatured(null);
    setHubs([]);

    ServerApi.random({ dir: params.key }).then((res) => {
      if (!res) return;
      setFeatured(res);
    });

    ServerApi.hubs({
      id: params.key,
    }).then((res) => {
      if (!res) return;
      if (res.length === 0) return;
      setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
    });
  }, [params.key]);

  useEffect(() => {
    const updateHubs = () => {
      ServerApi.hubs({
        id: params.key,
      }).then((res) => {
        if (!res) return;
        if (res.length === 0) return;
        setHubs(res.filter((hub) => hub.Metadata && hub.Metadata.length > 0));
      });
    };

    window.addEventListener("popstate", updateHubs);
    return () => {
      window.removeEventListener("popstate", updateHubs);
    };
  }, [params.key]);

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
            {hubs.map((item, i) => (
              <HubSlider
                key={`${item.key}-${i}`}
                id={params.key}
                hub={item}
                onUpdate={(updatedItem, itemIndex) =>
                  updateHub(updatedItem, itemIndex, i)
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
          {/*<Button*/}
          {/*  type="button"*/}
          {/*  variant="search"*/}
          {/*  size="sm"*/}
          {/*  onClick={() => {*/}
          {/*    router.push(*/}
          {/*      `${pathname}?${qs.stringify({ key: `/library/sections/${params.key}/collections`, libtitle: "Collections" })}`,*/}
          {/*      {*/}
          {/*        scroll: false,*/}
          {/*      },*/}
          {/*    );*/}
          {/*  }}*/}
          {/*>*/}
          {/*  Collections*/}
          {/*</Button>*/}
        </div>
      </>
    );
  }

  return null;
}
