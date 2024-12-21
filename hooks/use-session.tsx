import { Api } from "@/api";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { uuidv4 } from "@/lib/utils";

interface Context {
  user: Plex.UserData | null;
}

const SessionContext = createContext({} as Context);

declare global {
  interface Window {
    user?: Plex.UserData;
    sessionId?: string;
    plexSessionId?: string;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Plex.UserData | null>(null);

  useEffect(() => {
    window.sessionId = window.sessionId ?? uuidv4();
    window.plexSessionId = window.plexSessionId ?? uuidv4();

    const token = localStorage.getItem("auth-token") as string;
    const uuid = localStorage.getItem("uuid") as string;

    if (!user && token && uuid) {
      Api.user({ token, uuid })
        .then((res) => {
          window.user = res.data;
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

  return (
    <SessionContext.Provider value={{ user }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const { user } = useContext(SessionContext);
  return { user };
};
