import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { PlexConnection, PlexServer } from "@/type";
import { fetchAvailableServers, fetchExistingServer } from "@/lib/server";
import { Api } from "@/api";
import { XMLParser } from "fast-xml-parser";
import qs from "qs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [user, setUser] = useState<boolean>(false);

  useEffect(() => {
    setUser(!!localStorage.getItem("user-uuid"));
    const currentConnectionUri = localStorage.getItem("server") ?? "";
    let controllers: AbortController[] = [];
    setLoading(true);
    fetchExistingServer(currentConnectionUri).then((currentInfo) => {
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

  if (!user) {
    return (
      <UserSelect
        onSubmit={({ uuid, pin }) => {
          Api.switch({ uuid, pin }).then((res) => {
            localStorage.setItem("user-uuid", uuid);
            localStorage.setItem("uuid", uuid);
            localStorage.setItem("token", res.data.authToken);
            localStorage.setItem("auth-token", res.data.authToken);
            window.location.reload();
          });
        }}
      />
    );
  }

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

function UserSelect({
  onSubmit,
}: {
  onSubmit: ({ uuid, pin }: { uuid: string; pin?: string }) => void;
}) {
  const [users, setUsers] = useState<
    Pick<Plex.UserData, "uuid" | "title" | "thumb" | "hasPassword">[]
  >([]);
  const [viewPassword, setViewPassword] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const server = localStorage.getItem("server");

  useEffect(() => {
    Api.users().then((res) => {
      // console.log(res);
      const parser = new XMLParser({
        parseAttributeValue: true,
        ignoreAttributes: false,
      });
      const obj = parser.parse(res.data);
      const mappedUsers: Pick<
        Plex.UserData,
        "uuid" | "title" | "thumb" | "hasPassword"
      >[] = (obj.MediaContainer.User as Record<string, unknown>[]).map(
        (user) =>
          ({
            uuid: user["@_uuid"],
            hasPassword: user["@_hasPassword"] as boolean,
            thumb: `${server}/photo/:/transcode?${qs.stringify({
              width: 128,
              height: 128,
              url: user["@_thumb"],
              minSize: 1,
              "X-Plex-Token": token,
            })}`,
            title: user["@_title"],
          }) as Pick<Plex.UserData, "uuid" | "title" | "thumb" | "hasPassword">,
      );
      setUsers(() => mappedUsers);
    });
  }, []);

  return (
    <div className="p-20 lg:p-40 flex flex-col gap-4">
      {users.map((user, index) => (
        <div className="group hover:text-primary bg-muted/40 rounded-lg border hover:border-primary/80 w-full">
          <button
            onClick={() => {
              if (user.hasPassword) {
                setViewPassword((prev) => (prev === index ? null : index));
              } else {
                onSubmit({ uuid: user.uuid });
              }
            }}
            className="w-full flex gap-2 items-center p-2 overflow-hidden"
          >
            <div>
              <Avatar>
                <AvatarImage src={user.thumb} />
                <AvatarFallback>
                  {user.title.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="w-min">
              <p className="font-semibold leading-tight">{user.title}</p>
            </div>
          </button>
          {viewPassword === index && (
            <form
              id="form-element"
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(
                  new FormData(e.target as HTMLFormElement),
                ) as unknown as {
                  userPin: string;
                };
                onSubmit({ uuid: user.uuid, pin: data.userPin });
              }}
              className={cn(
                "p-2 overflow-hidden transition-[height] flex gap-2 items-end",
              )}
            >
              <div className="w-full">
                <Label htmlFor="password-input">Password</Label>
                <Input
                  name="userPin"
                  type="password"
                  autoFocus
                  required
                  id="password-input"
                />
              </div>
              <Button variant="default" size="icon">
                <Send />
              </Button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

export function useServer() {
  return useContext(Context);
}
