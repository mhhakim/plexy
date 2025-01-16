import { FC, useMemo } from "react";
import qs from "qs";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Play } from "lucide-react";
import { Carousel, CarouselItem } from "@/components/carousel";
import { OnDeckImagePreviewItem } from "@/components/hub/on-deck-image-preview-item";
import { OtherImagePreviewItem } from "@/components/hub/other-image-preview-item";
import { useHubItem } from "@/hooks/use-hub-item";
import { Progress } from "@/components/ui/progress";
import { durationToMin } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const HubItem: FC<{
  item: Plex.HubMetadata;
  index: number;
  refKey: string;
  isOnDeck: boolean;
}> = ({ item, index, refKey, isOnDeck }) => {
  const {
    info: { isEpisode, isSeason, isShow, isMovie, ...info },
    open,
    play,
  } = useHubItem(item);

  return (
    <CarouselItem
      key={refKey}
      refKey={refKey}
      index={index}
      hoverview={
        isOnDeck ? (
          <div className="bg-[rgb(21,21,23)] rounded overflow-hidden">
            <OnDeckImagePreviewItem
              item={item}
              progress={false}
              action="play"
            />
            <div
              onClick={open}
              className="p-4 w-full max-w-full flex-1 text-left text-xs cursor-pointer"
            >
              <div className="mb-2 flex flex-row items-center">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    play();
                  }}
                  variant="default"
                  size="icon-sm"
                  className="rounded-full z-[51]"
                >
                  <Play fill="currentColor" className="scale-75" />
                </Button>
                <div className="flex-1" />
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  variant="search"
                  size="icon-sm"
                  className="rounded-full z-[51]"
                >
                  <ChevronDown className="scale-75" />
                </Button>
              </div>
              {isEpisode && (
                <p className="font-bold line-clamp-3"> {item.title}</p>
              )}
              {(isSeason || isEpisode || isShow) && (
                <p className="font-bold text-plex line-clamp-3">
                  <span className="uppercase">
                    {isSeason && `s${item.index}`}
                    {isEpisode && `s${item.parentIndex} e${item.index}`}
                    {isShow && `seasons ${item.childCount}`}
                  </span>
                </p>
              )}
              <p className="font-bold text-muted-foreground line-clamp-3">
                {(isShow || isMovie) && item.title}
                {isSeason && item.parentTitle}
                {isEpisode && item.grandparentTitle}
              </p>
              {(isEpisode || isMovie) && (
                <div className="flex flex-row gap-2 mt-2 items-center">
                  <Progress
                    className="h-[4px] rounded-full"
                    value={info.progress ?? 0}
                  />
                  <span className="font-bold flex-1 min-w-fit">
                    {item.viewOffset
                      ? `${durationToMin(item.viewOffset)} of `
                      : null}
                    {durationToMin(item.duration)}m
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : undefined
      }
    >
      {isOnDeck ? (
        <OnDeckImagePreviewItem
          item={item}
          indicator
          className="rounded overflow-hidden"
          action="open"
        />
      ) : (
        <OtherImagePreviewItem
          item={item}
          indicator
          className="rounded overflow-hidden"
          action="open"
        />
      )}
      <div className="p-2 w-full max-w-full flex-1 text-left">
        <p className="font-bold text-sm text-muted-foreground line-clamp-1">
          {(isShow || isMovie) && item.title}
          {isSeason && item.parentTitle}
          {isEpisode && item.grandparentTitle}
        </p>
      </div>
    </CarouselItem>
  );
};

export const HubSlider: FC<{
  hub: Plex.Hub;
  onUpdate: () => void;
  id?: string | undefined;
}> = ({ id = undefined, hub, onUpdate }) => {
  const router = useRouter();
  const pathname = usePathname();

  const isOnDeck = useMemo(() => {
    const isInProgress = hub.context.includes("inprogress");
    const isContinueWatching = hub.context.includes("continueWatching");
    const isEpisodeType = hub.type === "episode";
    return isInProgress || isContinueWatching || isEpisodeType;
  }, [hub]);

  return (
    <div className="w-[100%] overflow-x-hidden mb-12 last:mb-24">
      <button
        type="button"
        className="text-left flex flex-row items-center mx-20 group gap-2 mb-3"
        onClick={() => {
          router.push(
            `${pathname}?${qs.stringify({ key: hub.key, libtitle: hub.title, ...(id ? { contentDirectoryID: id } : {}) })}`,
            {
              scroll: false,
            },
          );
        }}
      >
        <p className="font-bold text-xl md:text-2xl tracking-tight">
          <span className="px-[5px]">{hub.title}</span>
        </p>
        <div className="group-hover:opacity-100 group-hover:translate-x-0 opacity-0 transition duration-150 -translate-x-full">
          <ChevronRight className="h-6 w-6 text-plex" />
        </div>
      </button>
      {hub.Metadata && (
        <Carousel
          edges={80}
          spacing={10}
          scale={1.3}
          minimumVisibleItem={isOnDeck ? 1 : 3}
        >
          {hub.Metadata.map((item, index) => {
            const refKey = `${hub.hubIdentifier}-${item.ratingKey}`;
            return (
              <HubItem
                key={refKey}
                refKey={refKey}
                item={item}
                index={index}
                isOnDeck={isOnDeck}
              />
            );
          })}
        </Carousel>
      )}
    </div>
  );
};
