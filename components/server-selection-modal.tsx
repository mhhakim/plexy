"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlexConnection {
  protocol: string;
  address: string;
  port: number;
  uri: string;
  local: boolean;
  relay: boolean;
  IPv6: boolean;
}

interface PlexServer {
  name: string;
  product: string;
  productVersion: string;
  platform: string;
  platformVersion: string;
  device: string;
  clientIdentifier: string;
  createdAt: string;
  lastSeenAt: string;
  provides: string;
  ownerId: any;
  sourceTitle: any;
  publicAddress: string;
  accessToken: string;
  owned: boolean;
  home: boolean;
  synced: boolean;
  relay: boolean;
  presence: boolean;
  httpsRequired: boolean;
  publicAddressMatches: boolean;
  dnsRebindingProtection: boolean;
  natLoopbackSupported: boolean;
  connections: PlexConnection[];
}

interface ServerSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servers: PlexServer[];
  onServerSelect: (server: PlexServer, uri: string) => void;
  isLoading?: boolean;
  error?: string;
  userIp?: string;
}

// helper function to format the connection URL for display
const formatConnectionUrl = (connection: PlexConnection) => {
  try {
    const url = new URL(connection.uri);
    return `${url.hostname}`;
  } catch (e) {
    return connection.uri;
  }
};

// helper function to sort and filter connections
const getPreferredConnections = (connections: PlexConnection[], userIp?: string) => {
  // First, separate connections by type
  const local = connections.filter(c => c.local && !c.relay);
  const remote = connections.filter(c => !c.local && !c.relay);
  const relay = connections.filter(c => c.relay);

  // Filter local connections to only include those that match the user's IP
  const userLocal = local.filter(c => userIp && c.address === userIp);

  // For each type, prioritize HTTPS over HTTP
  const sortByProtocol = (conns: PlexConnection[]) => {
    return conns.sort((a, b) => {
      if (a.protocol === 'https' && b.protocol !== 'https') return -1;
      if (a.protocol !== 'https' && b.protocol === 'https') return 1;
      return 0;
    });
  };

  // Combine in priority order: userLocal -> remote -> relay
  // Only include relay if no other options are available
  const preferred = [...sortByProtocol(userLocal), ...sortByProtocol(remote)];
  return preferred.length > 0 ? preferred : sortByProtocol(relay);
};

export function ServerSelectionModal({
  open,
  onOpenChange,
  servers,
  onServerSelect,
  isLoading = false,
  error,
  userIp,
}: ServerSelectionModalProps) {
  const [selectedServer, setSelectedServer] = useState<{
    server: PlexServer;
    uri: string;
  } | null>(null);

  // reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedServer(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>select server</DialogTitle>
          <DialogDescription>
            choose a plex server to connect to
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : servers.length === 0 ? (
            <div>no servers available</div>
          ) : (
            <div className="grid gap-2">
              {servers.map((server) => {
                const connections = getPreferredConnections(server.connections, userIp);
                return (
                  <div key={server.clientIdentifier} className="space-y-2">
                    <div className="font-semibold text-sm text-muted-foreground">{server.name}</div>
                    {connections.map((connection) => (
                      <Button
                        key={connection.uri}
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          selectedServer?.server.clientIdentifier ===
                            server.clientIdentifier &&
                            selectedServer?.uri === connection.uri &&
                            "border-primary"
                        )}
                        onClick={() => setSelectedServer({ server, uri: connection.uri })}
                      >
                        <div className="flex flex-col items-start">
                          <div className="text-sm">
                            {formatConnectionUrl(connection)}
                            {connection.local && " (local)"}
                            {connection.relay && " (relay)"}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (selectedServer) {
                onServerSelect(selectedServer.server, selectedServer.uri);
              }
            }}
            disabled={!selectedServer}
          >
            connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 