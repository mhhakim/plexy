import { FC } from "react";
import { Progress } from "@/components/ui/progress";
import { useHubItem } from "@/hooks/use-hub-item";
import { ClassNameValue } from "tailwind-merge";
import { cn, durationToMin } from "@/lib/utils";

export const ElementImagePreviewItem: FC<{
  item: Plex.HubMetadata | Plex.Metadata;
  image: string;
  action?: "play" | "open" | null;
  disabled?: boolean;
  indicator?: boolean;
  className?: ClassNameValue;
  progress?: boolean;
  quality?: boolean;
  higherResolution?: boolean;
}> = ({
  item,
  image,
  disabled = false,
  indicator = false,
  className = "",
  action = null,
  progress = true,
  quality = false,
  higherResolution = false,
}) => {
  const { isEpisode, isMovie, isSeason, play, open, ...info } = useHubItem(
    item,
    { higherResolution },
  );
  return (
    <button
      className={cn("relative w-full flex flex-col", className)}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (action === "play") {
          play();
        } else if (action === "open") {
          open();
        }
      }}
      disabled={disabled}
    >
      <img
        className="absolute inset-0 object-cover w-full h-full"
        src={image}
        alt=""
        loading="lazy"
      />
      {indicator && (isEpisode || isSeason) && (
        <p className="px-2 py-1 bg-background/60 rounded-bl truncate uppercase text-sm font-bold absolute right-0 top-0">
          {isEpisode && `s${item.parentIndex} e${item.index}`}
          {isSeason && `s${item.index}`}
        </p>
      )}
      {quality && info.quality && (
        <p className="px-2 py-1 bg-background/60 rounded-bl truncate uppercase text-sm font-bold absolute left-0 top-0">
          {info.quality}
        </p>
      )}
      <div className="flex-1"></div>
      {progress && (isEpisode || isMovie) && info.progress !== 0 && (
        <Progress
          className="absolute rounded-t-none bottom-0 left-0 h-[2px]"
          value={info.progress}
          color="bg-primary"
        />
      )}
    </button>
  );
};
