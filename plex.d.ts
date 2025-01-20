declare namespace Plex {
  interface ServerPreferences {
    size: number;
    allowCameraUpload: boolean;
    allowChannelAccess: boolean;
    allowMediaDeletion: boolean;
    allowSharing: boolean;
    allowSync: boolean;
    allowTuners: boolean;
    backgroundProcessing: boolean;
    certificate: boolean;
    companionProxy: boolean;
    countryCode: string;
    diagnostics: string;
    eventStream: boolean;
    friendlyName: string;
    hubSearch: boolean;
    itemClusters: boolean;
    livetv: number;
    machineIdentifier: string;
    mediaProviders: boolean;
    multiuser: boolean;
    musicAnalysis: number;
    myPlex: boolean;
    myPlexMappingState: string;
    myPlexSigninState: string;
    myPlexSubscription: boolean;
    myPlexUsername: string;
    offlineTranscode: number;
    ownerFeatures: string;
    photoAutoTag: boolean;
    platform: string;
    platformVersion: string;
    pluginHost: boolean;
    pushNotifications: boolean;
    readOnlyLibraries: boolean;
    streamingBrainABRVersion: number;
    streamingBrainVersion: number;
    sync: boolean;
    transcoderActiveVideoSessions: number;
    transcoderAudio: boolean;
    transcoderLyrics: boolean;
    transcoderPhoto: boolean;
    transcoderSubtitles: boolean;
    transcoderVideo: boolean;
    transcoderVideoBitrates: string;
    transcoderVideoQualities: string;
    transcoderVideoResolutions: string;
    updatedAt: number;
    updater: boolean;
    version: string;
    voiceSearch: boolean;
  }

  type LibraryType =
    | "movie"
    | "show"
    | "artist"
    | "photo"
    | "episode"
    | "track"
    | "season"
    | "album"
    | "collection";

  interface LibrarySection {
    allowSync: boolean;
    art: string;
    composite: string;
    filters: boolean;
    refreshing: boolean;
    thumb: string;
    key: string;
    type: LibraryType;
    title: string;
    agent: string;
    scanner: string;
    language: string;
    uuid: string;
    updatedAt: number;
    createdAt: number;
    scannedAt: number;
    content: boolean;
    directory: boolean;
    contentChangedAt: number;
    hidden: number;
    Location: Location[];
  }

  interface LibraryDetails {
    size: number;
    allowSync: boolean;
    art: string;
    content: string;
    identifier: string;
    librarySectionID: number;
    mediaTagPrefix: string;
    mediaTagVersion: number;
    thumb: string;
    title1: string;
    viewGroup: string;
    viewMode: number;
    Directory: Directory[];
    Type: Type[];
    FieldType: FieldType[];
  }

  interface LibrarySecondary {
    size: number;
    allowSync: boolean;
    art: string;
    content: string;
    identifier: string;
    librarySectionID: number;
    mediaTagPrefix: string;
    mediaTagVersion: number;
    thumb: string;
    title1: string;
    title2: string;
    viewGroup: string;
    viewMode: number;
    Directory: Directory[];
  }

  interface Directory {
    key: string;
    title: string;
    secondary?: boolean;
    prompt?: string;
    search?: boolean;
    type?: string;
    librarySectionID?: number;
    librarySectionKey?: string;
    librarySectionTitle?: string;
    librarySectionType?: number;
    id?: number;
    filter?: string;
    tag?: string;
    tagType?: number;
    count?: number;
  }

  interface Type {
    key: string;
    type: LibraryType;
    title: string;
    active: boolean;
    Filter: Filter[];
    Sort: Sort[];
    Field: Field[];
  }

  interface Filter {
    filter: string;
    filterType: string;
    key: string;
    title: string;
    type: string;
  }

  interface Sort {
    default?: string;
    defaultDirection?: string;
    descKey: string;
    firstCharacterKey?: string;
    key: string;
    title: string;
  }

  interface Field {
    key: string;
    title: string;
    type: string;
    subType?: string;
  }

  interface FieldType {
    type: string;
    Operator: Operator[];
  }

  interface Operator {
    key: string;
    title: string;
  }

  interface Metadata {
    ratingKey: string;
    key: string;
    parentRatingKey?: string;
    grandparentRatingKey?: string;
    guid: string;
    slug?: string;
    studio: string;
    type: LibraryType;
    title: string;
    titleSort?: string;
    librarySectionTitle: string;
    librarySectionID: number;
    librarySectionKey: string;
    grandparentArt?: string;
    grandparentThumb?: string;
    grandparentKey?: string;
    parentKey?: string;
    grandparentTitle?: string;
    parentTitle?: string;
    originalTitle?: string;
    contentRating: string;
    summary: string;
    index?: number;
    parentIndex?: number;
    rating?: number;
    audienceRating?: number;
    userRating?: number;
    viewOffset?: number;
    viewCount?: number;
    lastViewedAt?: number;
    year: number;
    tagline: string;
    thumb: string;
    parentThumb?: string;
    art: string;
    theme?: string;
    duration: number;
    originallyAvailableAt: string;
    leafCount?: number;
    viewedLeafCount?: number;
    childCount?: number;
    addedAt: number;
    updatedAt: number;
    audienceRatingImage: string;
    chapterSource?: string;
    primaryExtraKey: string;
    ratingImage?: string;
    Media?: Media[];
    Genre?: Tag[];
    Country?: Tag[];
    Director?: Tag[];
    Writer?: Tag[];
    Role?: Role[];
    Chapter?: Chapter[];
    Marker?: Marker[];
    OnDeck?: {
      Metadata: Metadata;
    };
    Children?: {
      size: number;
      Metadata: Child[];
    };
    Extras?: {
      size: number;
      Metadata: Metadata[];
    };
  }

  interface Chapter {
    id: number;
    filter: string;
    index: 1;
    startTimeOffset: number;
    endTimeOffset: number;
    thumb: string;
  }

  interface Marker {
    final: boolean;
    id: number;
    type: string;
    startTimeOffset: number;
    endTimeOffset: number;
  }

  interface Role {
    id: number;
    filter: string;
    tag: string;
    tagKey: string;
    role: string;
    thumb: string;
  }

  interface Media {
    id: number;
    duration: number;
    bitrate: number;
    width: number;
    height: number;
    aspectRatio: number;
    audioChannels: number;
    audioCodec: string;
    videoCodec: string;
    videoResolution: string;
    container: string;
    videoFrameRate: string;
    audioProfile: string;
    videoProfile: string;
    Part: Part[];
  }

  interface Part {
    id: number;
    key: string;
    duration: number;
    file: string;
    size: number;
    audioProfile: string;
    container: string;
    indexes: string;
    videoProfile: string;
    Stream: Stream[];
  }

  interface Stream {
    id: number;
    streamType: number;
    default: boolean;
    codec: string;
    index: number;
    bitrate: number;
    language: string;
    languageTag: string;
    languageCode: string;
    bitDepth?: number;
    chromaLocation?: string;
    chromaSubsampling?: string;
    codedHeight?: number;
    codedWidth?: number;
    frameRate?: string;
    height?: number;
    level?: number;
    profile?: string;
    refFrames?: number;
    scanType?: string;
    title?: string;
    width?: number;
    displayTitle: string;
    extendedDisplayTitle: string;
    channels?: number;
    audioChannelLayout?: string;
    samplingRate?: number;
    selected?: boolean;
  }

  interface Tag {
    id: number;
    filter: string;
    tag: string;
  }

  interface Location {
    id: number;
    path: string;
  }

  interface Child {
    ratingKey: string;
    key: string;
    parentRatingKey: string;
    guid: string;
    parentGuid: string;
    parentSlug: string;
    parentStudio: string;
    type: string;
    title: string;
    parentKey: string;
    parentTitle: string;
    summary: string;
    index: number;
    parentIndex: number;
    parentYear: number;
    thumb: string;
    art: string;
    parentThumb: string;
    parentTheme: string;
    leafCount: number;
    viewedLeafCount: number;
    addedAt: number;
    updatedAt: number;
  }

  interface TokenData {
    id: number;
    code: string;
    expiresIn: number;
    createdAt: string;
    expiresAt: string;
    authToken: string | null;
    newRegistration: boolean | null;
  }

  interface UserData {
    id: number;
    uuid: string;
    username: string;
    title: string;
    email: string;
    friendlyName: string;
    locale: string;
    confirmed: boolean;
    joinedAt: number;
    emailOnlyAuth: boolean;
    hasPassword: boolean;
    protected: boolean;
    thumb: string;
    authToken: string;
    mailingListStatus: string;
    mailingListActive: boolean;
    scrobbleTypes: string;
    country: string;
  }

  interface SearchResult {
    score: number;
    Metadata?: Metadata;
    Directory?: Directory;
  }

  interface TimelineUpdateResult {
    MediaContainer: {
      size: number;
      playbackState: string;
      skipCount: number;
      terminationCode?: number;
      terminationText?: string;
      viewCount: number;
      viewOffset: number;
      Bandwidths: {
        Bandwidth: {
          time: number;
          bandwidth: number;
          resolution: string;
        }[];
      }[];
      TranscodeSession?: TranscodeSession[];
    };
  }

  interface TranscodeSession {
    key: string;
    throttled: boolean;
    complete: boolean;
    progress: number;
    size: number;
    speed: number;
    error: boolean;
    duration: number;
    context: string;
    sourceVideoCodec: string;
    sourceAudioCodec: string;
    videoDecision: string;
    audioDecision: string;
    protocol: string;
    container: string;
    videoCodec: string;
    audioCodec: string;
    audioChannels: number;
    width: number;
    height: number;
    transcodeHwRequested: boolean;
    transcodeHwFullPipeline: boolean;
    timeStamp: number;
    maxOffsetAvailable: number;
    minOffsetAvailable: number;
  }

  export interface HubMetadata {
    parentRatingKey?: string;
    grandparentRatingKey?: string;
    grandparentThumb?: string;
    parentThumb?: string;
    viewedLeafCount?: number;
    grandparentTitle?: string;
    parentTitle?: string;
    index?: number;
    parentIndex?: number;
    leafCount?: number;
    childCount?: number;
    ratingKey: string;
    key: string;
    guid: string;
    slug: string;
    studio: string;
    type: LibraryType;
    title: string;
    summary: string;
    audienceRating: number;
    viewCount?: number;
    skipCount?: number;
    lastViewedAt?: number;
    year: number;
    thumb: string;
    art: string;
    duration: number;
    originallyAvailableAt: string;
    grandparentArt?: string;
    addedAt: number;
    updatedAt: number;
    audienceRatingImage: string;
    viewOffset?: number;
    OnDeck?: {
      Metadata: Metadata;
    };
    Children?: {
      size: number;
      Metadata: Child[];
    };
    Media: {
      id: number;
      duration: number;
      bitrate: number;
      width: number;
      height: number;
      aspectRatio: number;
      audioChannels: number;
      audioCodec: string;
      videoCodec: string;
      videoResolution: string;
      container: string;
      videoFrameRate: string;
      videoProfile: string;
      hasVoiceActivity: boolean;
      Part: {
        id: number;
        key: string;
        duration: number;
        file: string;
        size: number;
        container: string;
        videoProfile: string;
      }[];
    }[];
    Image: {
      alt: string;
      type: string;
      url: string;
    }[];
    UltraBlurColors: {
      topLeft: string;
      topRight: string;
      bottomRight: string;
      bottomLeft: string;
    };
    Genre: {
      tag: string;
    }[];
    Country: {
      tag: string;
    }[];
    Collection: {
      tag: string;
    }[];
    Director: {
      tag: string;
    }[];
    Writer: {
      tag: string;
    }[];
    Role: {
      tag: string;
    }[];
    contentRating?: string;
    rating?: number;
    tagline?: string;
    chapterSource?: string;
    primaryExtraKey?: string;
    ratingImage?: string;
    titleSort?: string;
  }

  export interface Hub {
    hubKey: string;
    key: string;
    title: string;
    type: LibraryType;
    hubIdentifier: string;
    context: string;
    size: number;
    more: boolean;
    style: string;
    Metadata?: HubMetadata[];
  }
}
