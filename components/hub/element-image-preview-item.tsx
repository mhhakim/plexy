import { FC } from "react";
import { Progress } from "@/components/ui/progress";
import { useHubItem } from "@/hooks/use-hub-item";
import { ClassNameValue } from "tailwind-merge";
import { cn, durationToMin } from "@/lib/utils";

export const ElementImagePreviewItem: FC<{
  item: Plex.HubMetadata;
  image: string;
  action?: "play" | "open";
  disabled?: boolean;
  indicator?: boolean;
  className?: ClassNameValue;
  progress?: boolean;
}> = ({
  item,
  image,
  disabled = false,
  indicator = false,
  className = "",
  action = "open",
  progress = true,
}) => {
  const {
    info: { isEpisode, isMovie, ...info },
    play,
    open,
  } = useHubItem(item);
  return (
    <button
      style={{ background: `url(${image}) center center / cover no-repeat` }}
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
      {indicator && (item.type === "episode" || item.type === "season") && (
        <p className="ml-auto px-2 py-1 bg-background/60 rounded-bl truncate text-plex uppercase text-sm font-bold">
          {item.type === "episode" && `s${item.parentIndex} e${item.index}`}
          {item.type === "season" && `s${item.index}`}
        </p>
      )}
      <div className="flex-1"></div>
      {progress && (isEpisode || isMovie) && info.progress !== 0 && (
        <Progress
          className="absolute rounded-t-none bottom-0 left-0 h-[2px]"
          value={info.progress}
        />
      )}
    </button>
  );
};
