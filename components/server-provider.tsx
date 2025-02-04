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
    setLoading(true);
    fetchExistingServer(currentConnectionUri).then((currentInfo) => {
      console.log(currentInfo);
      if (currentInfo) {
        localStorage.setItem("server", currentInfo.connection.uri);
        setServer(currentInfo);
      }
      fetchAvailableServers()
        .then(({ list, info }) => {
          if (list.length === 0) {
            // TODO: error
            return;
          }
          console.log(info, list);
          if (!currentInfo && info) {
            localStorage.setItem("server", info.connection.uri);
            setServer(info);
          }
          setServers(list);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, []);

  const handleServerSelection = (server: LibraryAndServer) => {
    setServer(server);
    localStorage.setItem("server", server.connection.uri);
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
