import { Api } from "@/api";
import { useEffect, useState } from "react";

export const useSession = () => {
  const [user, setUser] = useState<Plex.UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth-token") as string;
    const uuid = localStorage.getItem("uuid") as string;

    if (token && uuid) {
      Api.user({ token, uuid })
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error(err);
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  return { user };
};
