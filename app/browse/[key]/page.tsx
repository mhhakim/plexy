"use client";

import { ServerApi } from "@/api";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Hub } from "@/app/browse/[key]/hub";

export default function Page() {
  const params = useParams<{ key: string }>();
  const library = useQuery({
    queryKey: ["details", params.key],
    queryFn: async () => {
      return await ServerApi.details({ key: params.key, include: true });
    },
  });

  if (!library.data) {
    return null;
  }

  if (
    library.data.Type[0].type === "show" ||
    library.data.Type[0].type === "movie"
  ) {
    return <Hub library={library.data} id={params.key} />;
  }

  return null;
}
