import { useEffect, useState } from "react";
import axios from "axios";
import qs from "qs";
import { xprops } from "@/api";

const useItemKeyMetadata = (
  key: string | null | undefined,
  contentDirectoryID: string | null | undefined,
  options: { full?: boolean } = {},
) => {
  const [metadata, setMetadata] = useState<Plex.Metadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) {
      setMetadata([]);
      return;
    }

    setLoading(true);
    axios
      .get<{ MediaContainer: { Metadata: Plex.Metadata[] } }>(
        `${localStorage.getItem("server")}${decodeURIComponent(key)}${decodeURIComponent(key).includes("?") ? "&" : "?"}${qs.stringify(
          {
            ...xprops(),
            ...(contentDirectoryID ? { contentDirectoryID } : {}),
            includeCollections: 1,
            includeExternalMedia: 1,
            includeAdvanced: 1,
            includeMeta: 1,
          },
        )}`,
        {
          headers: {
            "X-Plex-Token": localStorage.getItem("token") as string,
            accept: "application/json",
          },
        },
      )
      .then((res) => {
        if (!res.data?.MediaContainer?.Metadata) {
          setMetadata([]);
          return;
        }
        if (options.full) {
          setMetadata(res.data.MediaContainer.Metadata);
        } else {
          setMetadata(res.data.MediaContainer.Metadata.slice(0, 50));
        }
      })
      .catch((err) => {
        console.error(err);
        setMetadata([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key]);

  return { metadata, loading };
};

export { useItemKeyMetadata };
