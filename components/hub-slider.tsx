import {
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import qs from "qs";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Play } from "lucide-react";
import { Carousel, CarouselItem } from "@/components/carousel";
import { OnDeckImagePreviewItem } from "@/components/cards/on-deck-image-preview-item";
import { OtherImagePreviewItem } from "@/components/cards/other-image-preview-item";
import { HubItemInfo, useHubItem } from "@/hooks/use-hub-item";
import { Progress } from "@/components/ui/progress";
import { durationToMin, uuid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ServerApi, xprops } from "@/api";
import axios, { Canceler } from "axios";
import { useIsSize } from "@/hooks/use-is-size";

const HubFloatingItem = ({
  info,
  item,
  onUpdate,
}: {
  info: HubItemInfo;
  item: Plex.HubMetadata;
  onUpdate: (item: Plex.HubMetadata) => void;
}) => {
  const handleUpdate = () => {
    if (info.guid) {
      ServerApi.discoverMetadata({ guid: info.guid });
    }
    onUpdate(item);
  };

  return (
    <div className="bg-alternative rounded-[2px] overflow-hidden">
      <OnDeckImagePreviewItem
        item={item}
        info={info}
        progress={false}
        action="play"
        isOnDeck
      />

      <div
        onClick={() => info.open()}
        className="p-3 w-full max-w-full flex-1 text-left text-xs cursor-pointer"
      >
        <div className="mb-2 flex flex-row items-center gap-2">
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              info.play();
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
              // TODO: open menu for options
              ServerApi[info.watched ? "unscrobble" : "scrobble"]({
                key: item.ratingKey,
              }).then((success) => {
                if (success) handleUpdate();
              });
            }}
            variant="search"
            size="icon-sm"
            className="rounded-full z-[51]"
          >
            {info.watched ? (
              <svg
                className="lucide lucide-circle-check"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2M9.29 16.29 5.7 12.7a.996.996 0 0 1 0-1.41c.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0s.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0"></path>
              </svg>
            ) : (
              <svg
                className="lucide lucide-circle-check"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7c.39-.39.39-1.02 0-1.41s-1.03-.39-1.42 0"></path>
              </svg>
            )}
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              info.open();
            }}
            variant="search"
            size="icon-sm"
            className="rounded-full z-[51]"
          >
            <ChevronDown className="scale-75" strokeWidth={3} />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          {info.isEpisode && (
            <p className="font-semibold line-clamp-3">
              {(info.isSeason || info.isEpisode || info.isShow) && (
                <span className="uppercase">
                  {info.isSeason && `s${item.index}`}
                  {info.isEpisode && `s${item.parentIndex} e${item.index}`}
                  {info.isShow && `seasons ${item.childCount}`} -&nbsp;
                </span>
              )}
              {item.title}
            </p>
          )}
          <p className="font-semibold text-[0.7rem] text-muted-foreground line-clamp-3">
            {(info.isShow || info.isMovie) && item.title}
            {info.isSeason && item.parentTitle}
            {info.isEpisode && item.grandparentTitle}
          </p>
          {(info.isEpisode || info.isMovie) && (
            <div className="flex flex-row gap-2 items-center">
              <Progress
                className="h-[2px] rounded-full"
                value={info.progress ?? 0}
                color="bg-red-600"
              />
              <span className="font-semibold flex-1 min-w-fit">
                {item.viewOffset
                  ? `${durationToMin(item.viewOffset)} of `
                  : null}
                {durationToMin(item.duration)}m
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HubItem = forwardRef<
  HTMLDivElement,
  {
    item: Plex.HubMetadata;
    index: number;
    refKey: string;
    isOnDeck: boolean;
    isContinueWatching: boolean;
    onUpdate: (item: Plex.HubMetadata) => void;
  }
>(({ item, index, refKey, isOnDeck, isContinueWatching, onUpdate }, ref) => {
  const info = useHubItem(item, { higherResolution: true });
  const { isEpisode, isSeason, isShow, isMovie } = info;

  return (
    <CarouselItem
      key={refKey}
      refKey={refKey}
      ref={ref}
      index={index}
      hoverview={
        isOnDeck ? (
          <HubFloatingItem item={item} info={info} onUpdate={onUpdate} />
        ) : undefined
      }
    >
      {isOnDeck ? (
        <OnDeckImagePreviewItem
          item={item}
          info={info}
          className="rounded-[2px] overflow-hidden"
          action="open"
          progress={false}
          isOnDeck
        />
      ) : (
        <OtherImagePreviewItem
          item={item}
          info={info}
          // indicator
          className="rounded-[2px] overflow-hidden"
          action="open"
          progress={false}
        />
      )}
      <div className="py-2 px-2 w-full max-w-full flex-1 text-left space-y-1.5">
        {isContinueWatching && (
          <Progress
            className="rounded-t-none h-[2px]"
            value={info.progress}
            color="bg-red-600"
          />
        )}
        <p className="font-semibold text-xs text-muted-foreground line-clamp-1">
          {isSeason && `S${item.index} - `}
          {isEpisode && `S${item.parentIndex} E${item.index} - `}
          {(isShow || isMovie) && item.title}
          {isSeason && item.parentTitle}
          {isEpisode && item.grandparentTitle}
        </p>
      </div>
    </CarouselItem>
  );
});

export const isOnDeckHub = (hub: Plex.Hub) => {
  const isInProgress = hub.context.includes("inprogress");
  const isContinueWatching = hub.context.includes("continueWatching");
  const isEpisodeType = hub.type === "episode";
  const isClipType = hub.type === "clip";
  return isInProgress || isContinueWatching || isEpisodeType || isClipType;
};

// TODO: have the HubSlider only receive the hub key and then let him deal with the items and fetching
export const HubSlider: FC<{
  hub: Plex.Hub;
  onUpdate: (item: Plex.HubMetadata, index: number) => void;
  onAppend: (items: Plex.HubMetadata[]) => void;
  id?: string | undefined;
}> = ({ id = undefined, hub, onUpdate, onAppend }) => {
  const router = useRouter();
  const pathname = usePathname();
  const token = localStorage.getItem("token");
  const server = localStorage.getItem("server");
  const { isTiny } = useIsSize();

  const isOnDeck = useMemo(() => isOnDeckHub(hub), [hub]);

  const isContinueWatching = useMemo(
    () => hub.key.includes("continueWatching"),
    [hub],
  );

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState(0);
  const observer = useRef<IntersectionObserver>();
  const lastRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const [prevHubLength, setPrevHubLength] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!hasMore || prevHubLength === hub.Metadata?.length || page === 0) {
      return;
    }
    setLoading(true);
    setPrevHubLength(hub.Metadata?.length);
    let cancel: Canceler;
    const decodedKey = decodeURIComponent(hub.key);
    axios
      .get<{
        MediaContainer: { Metadata: Plex.HubMetadata[]; totalSize: number };
      }>(
        `${server}${decodedKey}${decodedKey.includes("?") ? "&" : "?"}${qs.stringify(
          {
            ...xprops(),
            excludeFields: "summary",
            "X-Plex-Container-Start": hub.Metadata?.length ?? 0,
            "X-Plex-Container-Size": 30,
            uuid: uuid(),
          },
        )}`,
        {
          headers: { "X-Plex-Token": token, accept: "application/json" },
          cancelToken: new axios.CancelToken((c) => {
            cancel = c;
          }),
        },
      )
      .then((res) => {
        if (res.data?.MediaContainer?.Metadata) {
          if (
            res.data.MediaContainer.Metadata.length +
              (hub.Metadata?.length ?? 0) >=
            res.data.MediaContainer.totalSize
          ) {
            setHasMore(false);
          }
          onAppend(res.data.MediaContainer.Metadata);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setHasMore(true);
        setPage(0);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (cancel) {
        cancel();
        setLoading(false);
      }
    };
  }, [page]);

  if (!hub.Metadata || hub.Metadata.length < 1) return null;

  return (
    <div className="w-[100%] overflow-x-hidden mb-12 last:mb-24">
      <button
        type="button"
        className="text-left flex flex-row items-center mx-10 md:mx-20 group gap-2 mb-3"
        onClick={() => {
          router.push(
            `${pathname}?${qs.stringify({ key: hub.key, libtitle: hub.title, ...(id ? { contentDirectoryID: id } : {}) })}`,
            {
              scroll: false,
            },
          );
        }}
      >
        <p className="font-semibold text-xl md:text-2xl text-primary/80 group-hover:text-primary transition-colors">
          {hub.title}
        </p>
        <div className="group-hover:opacity-100 group-hover:translate-x-0 mt-1 opacity-0 transition duration-150 -translate-x-full">
          <ChevronRight className="h-6 w-6 text-plex" />
        </div>
      </button>
      {hub.Metadata && (
        <Carousel
          edges={isTiny ? 40 : 80}
          spacing={6}
          scale={isTiny ? 1.15 : 1.3}
          minimumVisibleItem={isOnDeck ? 1 : isTiny ? 2 : 3}
        >
          {hub.Metadata.map((item, index) => {
            const refKey = `${hub.hubIdentifier}-${item.ratingKey}-${item?.viewOffset ?? ""}-${item?.viewCount ?? ""}-${hub.Metadata?.length}`;
            return (
              <HubItem
                key={item.ratingKey}
                ref={
                  index ===
                  (hub.Metadata?.length ?? 0) -
                    ((hub.Metadata?.length ?? 0) > 6 ? 5 : 1)
                    ? lastRef
                    : undefined
                }
                refKey={refKey}
                item={item}
                index={index}
                isOnDeck={isOnDeck}
                isContinueWatching={isContinueWatching}
                onUpdate={(item) => {
                  onUpdate(item, index);
                }}
              />
            );
          })}
        </Carousel>
      )}
    </div>
  );
};
