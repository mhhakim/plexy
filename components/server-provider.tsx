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
import { cn } from "@/lib/utils";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

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
    disabledLibraries: { [key in string]: boolean };
    toggleDisableLibrary: (title: string) => void;
    handleServerSelection: (server: LibraryAndServer) => void;
  },
);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<PlexServer[]>([]);
  const [server, setServer] = useState<LibraryAndServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<boolean>(false);
  const [disabledLibraries, setDisabledLibraries] = useState<{
    [key in string]: boolean;
  }>(JSON.parse(localStorage.getItem("disabledLibraries") ?? "{}"));

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

  const toggleDisableLibrary = (title: string) => {
    const updated = { ...disabledLibraries };
    updated[title] = !updated[title];
    setDisabledLibraries(updated);
    localStorage.setItem("disabledLibraries", JSON.stringify(updated));
  };

  const handleServerSelection = (server: LibraryAndServer) => {
    setServer(server);
    localStorage.setItem("server", server.connection.uri);
    localStorage.setItem("token", server.server.accessToken);
    window.location.reload();
  };

  if (loading || !server) return null;

  if (!user) {
    return <UserSelect />;
  }

  return (
    <Context.Provider
      value={{
        servers,
        server,
        libraries: server.libraries ?? [],
        disabledLibraries,
        toggleDisableLibrary,
        handleServerSelection,
      }}
    >
      {children}
    </Context.Provider>
  );
}

function mapUser(
  rec: Record<string, unknown>,
): Pick<Plex.UserData, "uuid" | "title" | "thumb" | "hasPassword"> {
  const token = localStorage.getItem("token");
  const server = localStorage.getItem("server");
  return {
    uuid: rec["@_uuid"] as string,
    hasPassword: rec["@_protected"] == 1,
    thumb: `${server}/photo/:/transcode?${qs.stringify({
      width: 128,
      height: 128,
      url: rec["@_thumb"],
      minSize: 1,
      "X-Plex-Token": token,
    })}`,
    title: rec["@_title"] as string,
  };
}

function UserSelect() {
  const [users, setUsers] = useState<
    Pick<Plex.UserData, "uuid" | "title" | "thumb" | "hasPassword">[]
  >([]);
  const [viewPassword, setViewPassword] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = ({
    uuid,
    pin = undefined,
  }: {
    uuid: string;
    pin?: string;
  }) => {
    setLoading(true);
    Api.switch({ uuid, pin })
      .then((res) => {
        localStorage.setItem("user-uuid", uuid);
        localStorage.setItem("uuid", uuid);
        localStorage.setItem("token", res.data.authToken);
        localStorage.setItem("auth-token", res.data.authToken);
        window.location.reload();
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

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
      >[] = Array.isArray(obj.MediaContainer.User)
        ? (obj.MediaContainer.User as Record<string, unknown>[]).map(mapUser)
        : [mapUser(obj.MediaContainer.User as Record<string, unknown>)];
      setUsers(() => mappedUsers);
    });
  }, []);

  return (
    <div className="p-10 sm:p-20 md:p-30 lg:p-40 flex flex-col gap-4">
      <p className="font-medium text-xl">Select a User</p>
      {users.map((user, index) => (
        <div
          key={user.uuid}
          className="group hover:text-primary bg-muted/40 rounded-lg border hover:border-primary/80 w-full flex flex-row flex-wrap gap-2"
        >
          <button
            onClick={() => {
              if (user.hasPassword) {
                setViewPassword((prev) => (prev === index ? null : index));
              } else {
                handleSubmit({ uuid: user.uuid });
              }
            }}
            className="w-full flex gap-2 items-center p-2 overflow-hidden flex-1 min-w-fit disabled:text-muted-foreground"
            disabled={loading}
          >
            <div>
              <Avatar>
                <AvatarImage src={user.thumb} />
                <AvatarFallback>
                  {user.title.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="font-semibold leading-tight">{user.title}</p>
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
                handleSubmit({ uuid: user.uuid, pin: data.userPin });
              }}
              className={cn(
                "p-2 overflow-hidden transition-[height] flex gap-2 items-end",
              )}
            >
              <InputOTP
                maxLength={4}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                autoFocus
                required
                id="password-input"
                name="userPin"
                onChange={(value) => {
                  if (value.length === 4) {
                    handleSubmit({ uuid: user.uuid, pin: value });
                  }
                }}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
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
