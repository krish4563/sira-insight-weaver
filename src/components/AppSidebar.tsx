import { FileText, User, Plus, Clock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
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
import { SchedulerDrawer } from "@/components/SchedulerDrawer";

const staticItems = [
  { title: "New Research", url: "/", icon: Plus },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Profile", url: "/profile", icon: User },
];

// Mock chat history - in production, fetch from backend
const chatHistory = {
  Today: [
    { id: "1", title: "AI Research Trends 2024", url: "/" },
    { id: "2", title: "Quantum Computing Updates", url: "/" },
  ],
  Yesterday: [
    { id: "3", title: "Climate Change Studies", url: "/" },
  ],
  "Previous 7 Days": [
    { id: "4", title: "Machine Learning Papers", url: "/" },
    { id: "5", title: "Biotech Innovations", url: "/" },
  ],
};

export function AppSidebar() {
  const [showScheduler, setShowScheduler] = useState(false);

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
              {Object.entries(chatHistory).map(([period, chats]) => (
                <div key={period} className="mb-4">
                  <p className="text-xs text-muted-foreground px-3 py-2">
                    {period}
                  </p>
                  <SidebarMenu>
                    {chats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={chat.url}
                            className="hover:bg-muted/50 text-sm truncate"
                          >
                            {chat.title}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
              ))}
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
