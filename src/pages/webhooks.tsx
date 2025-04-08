"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Webhook {
  url: string;
  events: string[];
}

export default function WebhookManager() {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);

  const availableEvents = [
    "server_started",
    "server_stopped",
    "error_occurred",
    "map_added",
    "map_deleted",
    "map_changed",
    "custom_event",
    "knife_kill",
  ];

  const loadWebhooks = async () => {
    const result = await invoke<Webhook[]>("list_webhooks");
    setWebhooks(result);
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const addWebhook = async () => {
    if (!url || events.length === 0) return;
    await invoke("add_webhook", { url, events });
    setUrl("");
    setEvents([]);
    setEditingUrl(null);
    loadWebhooks();
  };

  const removeWebhook = async (url: string) => {
    await invoke("remove_webhook", { url });
    loadWebhooks();
  };

  const startEdit = (webhook: Webhook) => {
    setUrl(webhook.url);
    setEvents(webhook.events);
    setEditingUrl(webhook.url);
    // Deleta temporariamente o antigo para evitar duplicação
    removeWebhook(webhook.url);
  };

  const isValid = url.length > 0 && events.length > 0;

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingUrl ? "Editar Webhook" : "Adicionar Webhook"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="https://discord.com/api/webhooks/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {availableEvents.map((event) => (
                <Button
                  key={event}
                  variant={events.includes(event) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleEvent(event)}
                >
                  {event}
                </Button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={addWebhook} disabled={!isValid}>
                {editingUrl ? "Salvar Edição" : "Salvar Webhook"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {webhooks.map((wh) => (
            <Card key={wh.url}>
              <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-sm truncate max-w-full font-mono text-muted-foreground">
                      {wh.url}
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>{wh.url}</TooltipContent>
                </Tooltip>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startEdit(wh)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWebhook(wh.url)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {wh.events.map((ev) => (
                  <span
                    key={ev}
                    className="text-xs bg-muted px-2 py-1 rounded-md font-mono"
                  >
                    {ev}
                  </span>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
