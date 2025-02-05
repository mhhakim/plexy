import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { PlexConnection, PlexServer } from "@/type";
import { fetchAvailableServers, fetchExistingServer } from "@/lib/server";

export type LibraryAndServer = {
  libraries: Plex.LibrarySection[];
  server: PlexServer;
  connection: PlexConnection;
};

const Context = createContext(
  {} as {
    servers: PlexServer[];
    server: LibraryAndServer;
    libraries: Plex.LibrarySection[];
    handleServerSelection: (server: LibraryAndServer) => void;
  },
);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<PlexServer[]>([]);
  const [server, setServer] = useState<LibraryAndServer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentConnectionUri = localStorage.getItem("server") ?? "";
    let controllers: AbortController[] = [];
    setLoading(true);
    fetchExistingServer(currentConnectionUri).then((currentInfo) => {
      console.log(currentInfo);
      if (currentInfo) {
        localStorage.setItem("server", currentInfo.connection.uri);
        localStorage.setItem("token", currentInfo.server.accessToken);
        setServer(currentInfo);
      }
      fetchAvailableServers()
        .then(({ list, info, controllers: aborts }) => {
          if (aborts) controllers = aborts;
          if (list.length === 0) {
            // TODO: error
            return;
          }
          console.log(info, list);
          if (!currentInfo && info) {
            localStorage.setItem("token", info.server.accessToken);
            localStorage.setItem("server", info.connection.uri);
            setServer(info);
          }
          setServers(list);
        })
        .finally(() => {
          setLoading(false);
        });
    });

    return () => {
      controllers.forEach((controller) => controller.abort());
    };
  }, []);

  const handleServerSelection = (server: LibraryAndServer) => {
    setServer(server);
    localStorage.setItem("server", server.connection.uri);
    localStorage.setItem("token", server.server.accessToken);
    window.location.reload();
  };

  if (loading || !server) return null;

  return (
    <Context.Provider
      value={{
        servers,
        server,
        libraries: server.libraries ?? [],
        handleServerSelection,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useServer() {
  return useContext(Context);
}
