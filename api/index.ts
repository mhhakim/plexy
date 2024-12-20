import { PLEX } from "@/constants";
import axios from "axios";
import _ from "lodash";
import qs from "qs";

const includes = {
  includeDetails: 1,
  includeMarkers: 1,
  includeOnDeck: 1,
  includeChapters: 1,
  includeChildren: 1,
  includeExternalMedia: 1,
  includeExtras: 1,
  includeConcerts: 1,
  includeReviews: 1,
  includePreferences: 1,
  includeStations: 1,
};

export interface RecommendationShelf {
  title: string;
  library: string;
  dir: string;
  link: string;
  key: string;
}

export class Api {
  static async pin(props: { uuid: string }) {
    return axios.post<{ id: number; code: string }>(
      `https://plex.tv/api/v2/pins?X-Plex-Client-Identifier=${props.uuid}&X-Plex-Product=${PLEX.application}&strong=true`,
    );
  }
  static async token(props: { pin: string; uuid: string }) {
    return axios.get<{ authToken: string }>(
      `https://plex.tv/api/v2/pins/${props.pin}?X-Plex-Client-Identifier=${props.uuid}`,
    );
  }
  static async resources({ token }: { token: string }) {
    return axios.get(`https://plex.tv/api/resources?X-Plex-Token=${token}`);
  }
  static async user({ token, uuid }: { token: string; uuid: string }) {
    return axios.get<Plex.UserData>(
      `https://plex.tv/api/v2/user?X-Plex-Token=${token}&X-Plex-Product=${PLEX.application}&X-Plex-Client-Identifier=${uuid}`,
    );
  }
}

export class ServerApi {
  static async validate({ token }: { token: string }) {
    return await axios
      .get(`${PLEX.server}/?X-Plex-Token=${token}`)
      .catch((err) => {
        console.log(err);
        return null;
      });
  }
  static async identity({ token }: { token: string }) {
    return await axios
      .get(`${PLEX.server}/identity`, {
        headers: {
          "X-Plex-Token": token,
        },
      })
      .catch((err) => {
        console.log(err);
        return null;
      });
  }
  static async libraries() {
    return await axios
      .get<{ MediaContainer: { Directory: Plex.LibarySection[] } }>(
        `${PLEX.server}/library/sections`,
        {
          headers: {
            "X-Plex-Token": localStorage.getItem("token") as string,
            accept: "application/json",
          },
        },
      )
      .then((res) => {
        return _.filter(res.data.MediaContainer.Directory, (section) => {
          return section.type === "show" || section.type === "movie";
        });
      })
      .catch((err) => {
        console.log(err);
        return null;
      });
  }
  static async library({
    key,
    directory,
    include = false,
  }: {
    key: string;
    directory: string;
    include?: boolean;
  }) {
    return await axios
      .get<{
        MediaContainer: {
          Directory: Plex.Directory[];
          Metadata: Plex.Metadata[];
        };
      }>(
        `${PLEX.server}/library/sections/${key}/${directory}${include ? `?${qs.stringify(includes)}` : ""}`,
        {
          headers: {
            "X-Plex-Token": localStorage.getItem("token") as string,
            accept: "application/json",
          },
        },
      )
      .catch((err) => {
        console.log(err);
        return null;
      });
  }
  static async recommendations({
    libraries,
    include = false,
  }: {
    libraries: Plex.LibarySection[];
    include?: boolean;
  }): Promise<RecommendationShelf[]> {
    const selections: RecommendationShelf[] = [];

    for (const library of libraries) {
      const genres = await ServerApi.library({
        key: library.key,
        directory: "genre",
        include,
      });

      if (
        !genres?.data.MediaContainer.Directory ||
        genres.data.MediaContainer.Directory.length === 0
      ) {
        continue;
      }

      const selected: Plex.Directory[] = [];

      // Get 5 random genres
      while (
        selected.length <
        Math.min(5, genres.data.MediaContainer.Directory.length)
      ) {
        const genre =
          genres.data.MediaContainer.Directory[
            Math.floor(
              Math.random() * genres.data.MediaContainer.Directory.length,
            )
          ];

        if (selected.includes(genre)) continue;

        selected.push(genre);
      }

      for (const genre of selected) {
        selections.push({
          key: `${library.key}-${selections.length}`,
          title: `${library.title} - ${genre.title}`,
          library: library.key,
          dir: `all?genre=${genre.key}`,
          link: `/library/${library.key}/dir/genre/${genre.key}`,
        });
      }
    }

    return selections.length > 0
      ? _.shuffle(selections)
      : ([] as RecommendationShelf[]);
  }
  static async random({ libraries }: { libraries: Plex.LibarySection[] }) {
    const library = libraries[Math.floor(Math.random() * libraries.length)];
    const dirs = await ServerApi.library({
      key: library.key,
      directory: "genre",
    });

    if (!dirs?.data.MediaContainer.Directory) return null;

    const items = await ServerApi.library({
      key: library.key,
      directory: `all?genre=${dirs.data.MediaContainer.Directory[Math.floor(Math.random() * dirs.data.MediaContainer.Directory.length)].key}`,
    });

    if (!items) return null;

    return items.data.MediaContainer.Metadata[
      Math.floor(Math.random() * items.data.MediaContainer.Metadata.length)
    ];
  }
}
