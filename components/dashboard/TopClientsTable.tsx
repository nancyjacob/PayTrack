"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { Users } from "lucide-react";

type TopClient = {
  clientId: string;
  name: string;
  totalPaid: number;
};

export function TopClientsTable({ clients }: { clients: TopClient[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clients</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Users size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No paid invoices yet</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {clients.map((client, idx) => (
              <li key={client.clientId} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {client.name}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatNaira(client.totalPaid)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
