import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Server, Database } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl">
                {user?.email ? getInitials(user.email) : "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.id || ""} disabled className="font-mono text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend Configuration
          </CardTitle>
          <CardDescription>
            API and service endpoints for SIRA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Backend API URL</Label>
            <Badge variant="outline" className="font-mono text-xs">
              {import.meta.env.VITE_API_BASE || "http://localhost:8000"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Configure this in your environment variables (VITE_API_BASE)
            </p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Pinecone Index
            </Label>
            <Badge variant="outline" className="font-mono text-xs">
              sira-research-memory
            </Badge>
            <p className="text-xs text-muted-foreground">
              Vector database for research memory storage
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
