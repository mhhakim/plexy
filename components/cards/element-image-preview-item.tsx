import { FC } from "react";
import { Progress } from "@/components/ui/progress";
import { HubItemInfo } from "@/hooks/use-hub-item";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/settings-provider";

export const ElementImagePreviewItem: FC<{
  item: Plex.HubMetadata | Plex.Metadata;
  info: HubItemInfo;
  isOnDeck?: boolean;
  image: string;
  action?: "play" | "open" | null;
  disabled?: boolean;
  indicator?: boolean;
  className?: ClassNameValue;
  progress?: boolean;
  quality?: boolean;
  clearLogo?: string | null;
}> = ({
  item,
  info,
  isOnDeck = false,
  image,
  disabled = false,
  indicator = false,
  className = "",
  action = null,
  progress = true,
  quality = false,
  clearLogo,
}) => {
  const { isEpisode, isMovie, isSeason, play, open } = info;
  const { disableClearLogo } = useSettings();

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
      {isOnDeck && clearLogo && !disableClearLogo && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0))",
            }}
          ></div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(45deg, hsl(var(--background)), rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))",
            }}
          ></div>
          <div className="absolute inset-0 bg-center">
            <img
              className="absolute bottom-0 left-0 p-4 w-auto max-w-[calc(70%-2rem)] h-auto max-h-[(100%-2rem)]"
              src={clearLogo}
              alt={item.title}
            />
          </div>
        </>
      )}
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
