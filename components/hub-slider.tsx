import { FC } from "react";
import { Slider } from "@/components/slider";
import qs from "qs";

export const HubSlider: FC<{ hub: Plex.Hub; onUpdate: () => void }> = ({
  hub,
  onUpdate,
}) => {
  const token = localStorage.getItem("token");

  return (
    <div className="w-[100%] overflow-x-hidden overflow-y-visible">
      <p className="px-20 font-bold text-xl md:text-2xl xl:text-3xl tracking-tight">
        <span className="px-[5px]">{hub.title}</span>
      </p>
      {hub.Metadata && (
        <Slider
          onUpdate={onUpdate}
          items={hub.Metadata.map((item) => ({
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
  );
};
