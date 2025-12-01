import { useState, useEffect } from "react";
import { 
  FileText, User, Plus, Clock, MessageSquare, 
  MoreHorizontal, Trash2, Pencil 
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client"; 
import { SchedulerDrawer } from "@/components/SchedulerDrawer";
import { apiClient, type Conversation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
      // ✅ FIX: Use updated_at if available, fallback to created_at
      // This ensures recently active chats jump to "Today"
      const dateStr = conv.updated_at || conv.created_at;
      const convDate = new Date(dateStr);

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
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null); 

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

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
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (!editingId) {
             setTimeout(() => {
               loadConversations();
             }, 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, editingId]); 

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
                topic_title: item.title || item.topic_title || "Untitled",
                created_at: item.created_at,
                // ✅ FIX: Correctly map updated_at from backend
                updated_at: item.updated_at || item.created_at, 
              });
            });
          }
        });
      }
      
      // Sort: Newest activity first
      flattened.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      });
      
      setConversations(flattened);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  // --- ACTIONS ---

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const idToDelete = deleteId;
      setDeleteId(null); 

      setConversations(prev => prev.filter(c => c.id !== idToDelete));
      await apiClient.deleteConversation(idToDelete);
      
      if (location.pathname.includes(idToDelete)) {
        navigate("/");
      }
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete");
      loadConversations(); 
    }
  };

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.topic_title || "Untitled");
  };

  const saveTitle = async () => {
    if (!editingId || !editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const id = editingId;
      const title = editTitle;
      setEditingId(null); 
      
      setConversations(prev => prev.map(c => c.id === id ? { ...c, topic_title: title } : c));
      
      await apiClient.renameConversation(id, title);
    } catch (error) {
      toast.error("Failed to rename");
      loadConversations();
    }
  };

  const groupedChats = groupConversationsByTime(conversations);

  const renderItem = (conv: Conversation) => {
    const isEditing = editingId === conv.id;

    return (
      <SidebarMenuItem key={conv.id}>
        {isEditing ? (
          <div className="flex items-center px-2 py-1 w-full gap-2">
            <Input 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveTitle} 
              onKeyDown={(e) => e.key === "Enter" && saveTitle()} 
              autoFocus
              className="h-8 text-sm bg-background"
            />
          </div>
        ) : (
          <>
            <SidebarMenuButton asChild>
              <NavLink to={`/chat/${conv.id}`}>
                <MessageSquare className="h-4 w-4" />
                <span className="truncate">{conv.topic_title || "Untitled"}</span>
              </NavLink>
            </SidebarMenuButton>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" side="right" align="start">
                <DropdownMenuItem onClick={() => startEditing(conv)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteId(conv.id)} className="text-red-500 focus:text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </SidebarMenuItem>
    );
  };

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
                    {groupedChats.today.map(renderItem)}
                  </>
                )}

                {groupedChats.yesterday.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">
                      Yesterday
                    </div>
                    {groupedChats.yesterday.map(renderItem)}
                  </>
                )}

                {groupedChats["previous-7-days"].length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">
                      Previous 7 Days
                    </div>
                    {groupedChats["previous-7-days"].map(renderItem)}
                  </>
                )}

                {groupedChats.older.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground mt-2">
                      Older
                    </div>
                    {groupedChats.older.map(renderItem)}
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this conversation and all its history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}