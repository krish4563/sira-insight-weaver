import { useState } from "react";
import { User, Mail, Globe, Database, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.clear();
      navigate("/auth");
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold gradient-text">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account information
        </p>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {user?.email ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Account Details</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage your profile information
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {user?.id || "Not available"}
                  </p>
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates when new research is available
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Backend Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">API Endpoint</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {import.meta.env.VITE_API_BASE || "http://localhost:8000"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Memory System</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  Pinecone Vector Database
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
