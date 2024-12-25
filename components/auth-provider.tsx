"use client";

import { ReactNode, useEffect, useState } from "react";
import { uuidv4 } from "@/lib/utils";
import { Api, ServerApi } from "@/api";
import { PLEX } from "@/constants";
import _ from "lodash";
import { XMLParser } from "fast-xml-parser";
import { usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | undefined>();
  const pathname = usePathname();

  useEffect(() => {
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
        console.log("here 1");
        Api.token({ uuid, pin: pinId })
          .then(async (res) => {
            // should have the token here
            if (!res.data.authToken) {
              // TODO: handle error
              console.log(res.data);
              return;
            }

            // validate token
            const validation = await ServerApi.validate({
              token: res.data.authToken,
            });

            console.log("validation", validation);

            if (validation?.status === 200) {
              localStorage.setItem("token", res.data.authToken);
              localStorage.setItem("auth-token", res.data.authToken);
              setToken(res.data.authToken);
              window.location.href = "/";
              return;
            }

            const identity = await ServerApi.identity({
              token: res.data.authToken,
            });

            console.log(identity);

            if (!identity || !identity.data.MediaContainer) {
              // TODO: handle error
              return;
            }

            const parser = new XMLParser({
              attributeNamePrefix: "",
              textNodeName: "value",
              ignoreAttributes: false,
              parseAttributeValue: true,
            });

            const resources = await Api.resources({
              token: res.data.authToken,
            });

            console.log(resources);

            const servers = parser.parse(resources.data);
            const target = _.find(servers.MediaContainer.Device, {
              clientIdentifier: identity.data.MediaContainer.machineIdentifier,
            });

            console.log(target);

            if (!target) {
              console.log("here");
              // TODO: handle error
              return;
            }

            localStorage.setItem("token", target.accessToken);
            localStorage.setItem("auth-token", res.data.authToken);
            window.location.href = "/";
          })
          .catch((err) => {
            console.error(err);
            // TODO: handle error
          });
      }
    } else {
      setToken(stored);
    }
  }, []);

  if (!token) return null;

  return children;
}
