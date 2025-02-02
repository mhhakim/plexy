"use client";

import {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { uuidv4 } from "@/lib/utils";
import { Api } from "@/api";
import { PLEX } from "@/constants";
import axios from "axios";
import { ServerSelectionModal } from "./server-selection-modal";

const LibrariesContext = createContext({ libraries: [] } as {
  libraries: Plex.LibrarySection[];
});

export const useLibraries = () => {
  return useContext(LibrariesContext);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [libraries, setLibraries] = useState<Plex.LibrarySection[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [showServerSelection, setShowServerSelection] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let pin = localStorage.getItem("pin");
    const stored = localStorage.getItem("token");
    const pinId = new URL(location.href).searchParams.get("pinID");
    let uuid = localStorage.getItem("uuid");

    if (!uuid) {
      uuid = uuidv4();
      localStorage.setItem("uuid", uuid);
    }

    if (!stored) {
      if (!pinId) {
        Api.pin({ uuid })
          .then((res) => {
            pin = res.data.code;
            localStorage.setItem("pin", pin);
            window.location.href = `https://app.plex.tv/auth/#!?clientID=${
              uuid
            }&context[device][product]=${
              PLEX.application
            }&context[device][version]=4.118.0&context[device][platform]=Firefox&context[device][platformVersion]=122.0&context[device][device]=Linux&context[device][model]=bundled&context[device][screenResolution]=1920x945,1920x1080&context[device][layout]=desktop&context[device][protocol]=${window.location.protocol.replace(
              ":",
              "",
            )}&forwardUrl=${window.location.protocol}//${
              window.location.host
            }/login?pinID=${res.data.id}&code=${res.data.code}&language=en`;
          })
          .catch((err) => {
            console.error(err);
            // TODO: handle error
          });
      } else {
        Api.token({ uuid, pin: pinId })
          .then(async (res) => {
            // should have the token here
            if (!res.data.authToken) {
              // TODO: handle error
              console.log(res.data);
              return;
            }

            localStorage.setItem("token", res.data.authToken);
            localStorage.setItem("auth-token", res.data.authToken);
            window.location.href = "/";
          })
          .catch((err) => {
            console.error(err);
            // TODO: handle error
          });
      }
    } else {
      // fetch available servers
      setIsLoadingServers(true);
      Api.servers()
        .then(async (res2) => {
          setServers(res2.data || []);
          
          // if no server is selected and servers are available, show selection modal
          if (!localStorage.getItem("server") && res2.data && res2.data.length > 0) {
            setShowServerSelection(true);
            return;
          }

          // if no servers available, show error
          if (
            !res2.data ||
            res2.data.length === 0 ||
            !res2.data[0].connections ||
            res2.data[0].connections.length === 0
          ) {
            setServerError("no servers available");
            return;
          }

          // if server is already selected, try to connect
          if (localStorage.getItem("server")) {
            await connectToServer();
          }
        })
        .catch((err) => {
          console.error(err);
          setServerError("failed to fetch servers");
        })
        .finally(() => {
          setIsLoadingServers(false);
        });
    }
  }, [mounted]);

  const connectToServer = async () => {
    try {
      const serverUri = localStorage.getItem("server");
      if (!serverUri) {
        throw new Error("no server selected");
      }

      // Create an array of promises for each connection
      const response = await axios.get<{ MediaContainer: { Directory: Plex.LibrarySection[] } }>(
        `${serverUri}/library/sections`,
        {
          headers: {
            "X-Plex-Token": localStorage.getItem("token") as string,
            accept: "application/json",
          },
        }
      );

      if (response.data?.MediaContainer?.Directory) {
        setLibraries(response.data.MediaContainer.Directory);
      }
    } catch (err) {
      console.error(err);
      setServerError("failed to connect to server");
      // clear server selection to allow retrying
      localStorage.removeItem("server");
      setShowServerSelection(true);
    }
  };

  const handleServerSelect = async (server: any, uri: string) => {
    localStorage.setItem("server", uri);
    setShowServerSelection(false);
    await connectToServer();
  };

  if (!mounted) return null;

  return (
    <LibrariesContext.Provider value={{ libraries }}>
      <ServerSelectionModal
        open={showServerSelection}
        onOpenChange={setShowServerSelection}
        servers={servers}
        onServerSelect={handleServerSelect}
        isLoading={isLoadingServers}
        error={serverError}
      />
      {children}
    </LibrariesContext.Provider>
  );
}
