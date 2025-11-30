// src/components/AppSidebar.tsx
import { useState, useEffect } from "react";
import { FileText, User, Plus, Clock, MessageSquare } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client"; 
import { SchedulerDrawer } from "@/components/SchedulerDrawer";
import { apiClient, type Conversation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const staticItems = [
  { title: "New Research", url: "/", icon: Plus },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Profile", url: "/profile", icon: User },
];

function groupConversationsByTime(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return conversations.reduce(
    (acc, conv) => {
      const convDate = new Date(conv.created_at);
      if (convDate >= today) {
        acc.today.push(conv);
      } else if (convDate >= yesterday) {
        acc.yesterday.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        acc["previous-7-days"].push(conv);
      } else {
        acc.older.push(conv);
      }
      return acc;
    },
    {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      "previous-7-days": [] as Conversation[],
      older: [] as Conversation[],
    }
  );
}

export function AppSidebar() {
  const [showScheduler, setShowScheduler] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { user } = useAuth();

  // 1. Initial Load
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // 2. Real-time Listener (With Timeout Fix)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("sidebar-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`, // Filter is safe if RLS is correct, otherwise remove
        },
        () => {
          console.log("🔔 Realtime Update Received! Refreshing list...");
          
          // ✅ TIMEOUT ADDED: Waits 1.5s for DB to finish saving before fetching
          setTimeout(() => {
            loadConversations();
          }, 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const data = await apiClient.listConversations(user.id);
      
      const flattened: Conversation[] = [];
      
      if (data && typeof data === "object") {
        Object.values(data).forEach((group: any) => {
          if (Array.isArray(group)) {
            group.forEach((item: any) => {
              flattened.push({
                id: item.id,
                user_id: user.id,
                topic_title: item.title || "Untitled",
                created_at: item.created_at,
                updated_at: item.created_at,
              });
            });
          }
        });
      }
      
      setConversations(flattened);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const groupedChats = groupConversationsByTime(conversations);

  // Helper to render links
  const renderLink = (conv: Conversation) => (
    <SidebarMenuItem key={conv.id}>
      <SidebarMenuButton asChild>
        <NavLink to={`/chat/${conv.id}`}>
          <MessageSquare className="h-4 w-4" />
          <span className="truncate">{conv.topic_title || "Untitled"}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <Sidebar className="border-r border-border">
        <SidebarHeader className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
            <div>
              <h2 className="text-lg font-bold gradient-text">SIRA</h2>
              <p className="text-xs text-muted-foreground">Research Agent</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {staticItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>History</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setShowScheduler(true)}
              >
                <Clock className="h-3 w-3" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedChats.today.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground">Today</div>
                    {groupedChats.today.map(renderLink)}
                  </>
                )}

                {groupedChats.yesterday.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">Yesterday</div>
                    {groupedChats.yesterday.map(renderLink)}
                  </>
                )}

                {groupedChats["previous-7-days"].length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">Previous 7 Days</div>
                    {groupedChats["previous-7-days"].map(renderLink)}
                  </>
                )}

                {groupedChats.older.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">Older</div>
                    {groupedChats.older.map(renderLink)}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground text-center">
            Self-Initiated Research Agent
          </p>
        </SidebarFooter>
      </Sidebar>

      <SchedulerDrawer
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
      />
    </>
  );
}