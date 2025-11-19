import { Webhook, Plus, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

interface WebhookConfig {
  id: string;
  url: string;
  event: string;
  enabled: boolean;
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newEvent, setNewEvent] = useState("research.completed");

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const webhook: WebhookConfig = {
      id: Date.now().toString(),
      url: newUrl,
      event: newEvent,
      enabled: true,
    };

    setWebhooks([...webhooks, webhook]);
    setNewUrl("");
    toast.success("Webhook added (placeholder - backend integration pending)");
  };

  const handleToggle = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
    toast.info("Webhook toggled");
  };

  const handleDelete = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.success("Webhook removed");
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Webhooks</h1>
        <p className="text-muted-foreground">
          Receive real-time notifications when research events occur
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Add New Webhook</CardTitle>
          <CardDescription>Configure a webhook endpoint for event notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddWebhook} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-endpoint.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <select
                  id="event-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                >
                  <option value="research.completed">Research Completed</option>
                  <option value="research.started">Research Started</option>
                  <option value="kg.updated">Knowledge Graph Updated</option>
                  <option value="memory.added">Memory Added</option>
                  <option value="schedule.triggered">Schedule Triggered</option>
                </select>
              </div>
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Active Webhooks
          </CardTitle>
          <CardDescription>Manage your webhook configurations</CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No webhooks configured yet</p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex-1">
                    <p className="font-medium truncate">{webhook.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {webhook.event}
                      </Badge>
                      {webhook.enabled ? (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <X className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={() => handleToggle(webhook.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>Available event types for subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { name: "research.completed", desc: "Triggered when a research task completes" },
              { name: "research.started", desc: "Triggered when research begins" },
              { name: "kg.updated", desc: "Triggered when knowledge graph is updated" },
              { name: "memory.added", desc: "Triggered when new memory is stored" },
              { name: "schedule.triggered", desc: "Triggered when a scheduled job runs" },
            ].map((event) => (
              <div key={event.name} className="p-3 rounded-lg border border-border/50">
                <p className="font-mono text-sm font-medium text-primary">{event.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{event.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
