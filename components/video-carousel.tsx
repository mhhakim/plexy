import { FC, useEffect, useState } from "react";
import { RecommendationShelf, ServerApi } from "@/api";
import _ from "lodash";
import qs from "qs";
import { Slider } from "@/components/slider";

export const VideoCarousel: FC<RecommendationShelf & { shuffle?: boolean }> = ({
  shuffle,
  dir,
  library,
  // link,
  title,
}) => {
  // const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Plex.Metadata[] | null>(null);

  useEffect(() => {
    // setIsLoading(true);
    ServerApi.library({
      key: library,
      directory: dir,
    })
      .then((res) => {
        const media = res?.data.MediaContainer.Metadata;
        if (!media) return;
        setItems(shuffle ? _.shuffle(media) : media);
      })
      .finally(() => {
        // setIsLoading(false);
      });
  }, [dir, library, shuffle]);

  const token = localStorage.getItem("token");

  if (!items) return;

  return (
    <div className="w-[100%] overflow-x-hidden overflow-y-visible">
      <p className="px-20 font-bold text-3xl tracking-tight">
        <span className="px-[5px]">{title}</span>
      </p>
      {items && (
        <Slider
          items={items.map((item) => ({
            ...item,
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
  );
};
