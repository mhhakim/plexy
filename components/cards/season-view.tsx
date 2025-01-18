import { FC } from "react";
import qs from "qs";
import { usePathname, useRouter } from "next/navigation";

export const SeasonView: FC<{ season: Plex.Child }> = ({ season }) => {
  const router = useRouter();
  const pathname = usePathname();

  const token = localStorage.getItem("token");

  return (
    <button
      className="relative text-left"
      onClick={() => {
        router.push(`${pathname}?mid=${season.ratingKey}`, { scroll: false });
      }}
    >
      <img
        loading="lazy"
        className="w-full object-cover aspect-[9/14] top-0 rounded"
        src={`${localStorage.getItem("server")}/photo/:/transcode?${qs.stringify(
          {
            width: 300,
            height: 450,
            url: `${season.thumb}?X-Plex-Token=${token}`,
            minSize: 1,
            upscale: 1,
            "X-Plex-Token": token,
          },
        )}`}
        alt="season poster"
      />
      <div className="p-2 w-full font-semibold">
        <p className="truncate">{season.title}</p>
        <p className="text-muted-foreground truncate">
          {season.leafCount} Episodes
        </p>
      </div>
    </button>
  );
};
