import {
  Button,
  ChatHistoryItem,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui";
import {
  ChevronRight,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { getGravatarUrl } from "../lib/gravatar";

export interface ChatHistoryEntry {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

export interface AppSidebarProps {
  chatHistory: ChatHistoryEntry[];
  sessionsLoading: boolean;
  selectedChatId: string | null;
  isStreaming: boolean;
  isDarkMode: boolean;
  user: {
    sub?: string;
    email?: string;
    preferredUsername?: string;
    picture?: string;
  } | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onToggleTheme: () => void;
}

export function AppSidebar(props: Readonly<AppSidebarProps>) {
  const {
    chatHistory,
    sessionsLoading,
    selectedChatId,
    isStreaming,
    isDarkMode,
    user,
    onNewChat,
    onSelectChat,
    onToggleTheme,
  } = props;
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const displayName = user?.preferredUsername || user?.email || user?.sub;
  const avatarSrc = user?.picture
    ? user.picture
    : user?.email
      ? getGravatarUrl(user.email, 36)
      : null;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">AI Assistant</span>
          </div>
        </div>

        <div className="mt-4 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <SidebarInput placeholder="Search..." className="pl-8" />
        </div>

        <Button
          className="w-full mt-3 gap-2"
          onClick={onNewChat}
          disabled={isStreaming}
        >
          <Plus className="h-4 w-4" />
          Start New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <Collapsible open={isPinnedOpen} onOpenChange={setIsPinnedOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 -mx-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Pinned Chats</span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 ml-auto transition-transform ${
                    isPinnedOpen ? "rotate-90" : ""
                  }`}
                />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <p className="text-xs text-muted-foreground px-2 py-3">
                  No pinned chats yet
                </p>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2">Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessionsLoading ? (
                <p className="text-xs text-muted-foreground px-2 py-3">
                  Loading...
                </p>
              ) : (
                chatHistory.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <ChatHistoryItem
                      title={chat.title}
                      timestamp={chat.timestamp}
                      messageCount={chat.messageCount}
                      isActive={selectedChatId === chat.id}
                      onClick={() => onSelectChat(chat.id)}
                    />
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onToggleTheme}>
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{isDarkMode ? "Light" : "Dark"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 p-2 mt-2 w-full rounded-lg hover:bg-sidebar-accent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium shrink-0">
                  {user?.sub?.substring(0, 2) ?? <User className="h-4 w-4" />}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem
              onSelect={() => navigate("/profile")}
              className="cursor-pointer"
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => signOut()}
              className="cursor-pointer"
              variant="destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
