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
        className="w-full"
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
        alt=""
      />
      <div
        className="absolute inset-0 p-4"
        style={{
          background:
            "linear-gradient(0, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.75))",
        }}
      >
        <p className="font-bold text-xl">{season.title}</p>
      </div>
    </button>
  );
};
