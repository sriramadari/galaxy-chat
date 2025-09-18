"use client";

import React, { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { Sun, Moon, Menu } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useConversationUpdates } from "@/hooks/useConversationUpdates";
import SideBar from "@/components/chat/SideBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/contexts/ToastContext";

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConversationsLayoutInner>{children}</ConversationsLayoutInner>
    </ToastProvider>
  );
}

function ConversationsLayoutInner({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { subscribe } = useConversationUpdates();
  const { showToast } = useToast();

  // Extract conversation ID from pathname
  const activeId = pathname.split("/").pop() === "conversations" ? null : pathname.split("/").pop();

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Listen for conversation updates
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type === "created" || event.type === "titleUpdated") {
        fetchConversations(); // Refresh the list
      } else if (event.type === "deleted" && event.conversationId) {
        setConversations((prev) => prev.filter((conv) => conv._id !== event.conversationId));
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + N for new conversation
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        createNewConversation();
      }
      // Escape to close mobile sidebar
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const createNewConversation = async () => {
    if (!user) return;
    try {
      // For immediate new conversation, we'll just navigate to /conversations/new
      // The actual conversation will be created when the first message is sent
      router.push(`/conversations/new`);
      // Close mobile sidebar after creating new conversation
      if (isMobileOpen) {
        setIsMobileOpen(false);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Function to refresh conversations (can be called when a new conversation is created)
  // const refreshConversations = async () => {
  //   await fetchConversations();
  // };

  const handleUpdateTitle = async (id: string, title: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        // Update local state optimistically
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === id ? { ...conv, title, updatedAt: new Date().toISOString() } : conv
          )
        );
        showToast("Conversation title updated", "success");
        return true;
      } else {
        showToast("Failed to update title", "error");
      }
    } catch (error) {
      console.error("Failed to update conversation title:", error);
      showToast("Failed to update title", "error");
    }
    return false;
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations(conversations.filter((conv) => conv._id !== id));
        showToast("Conversation deleted", "success");
        // If we're currently viewing the deleted conversation, redirect
        if (activeId === id) {
          router.push("/conversations");
        }
      } else {
        showToast("Failed to delete conversation", "error");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      showToast("Failed to delete conversation", "error");
    }
  };

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 md:hidden">
          <div className="flex items-center justify-between px-4 h-full">
            <button
              onClick={handleMobileToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Galaxy Chat</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block fixed top-0 left-64 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30">
          <div className="flex items-center justify-between px-4 h-full">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Galaxy Chat</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        </div>

        <SideBar
          conversations={conversations}
          activeId={activeId || ""}
          onSelect={(id) => router.push(`/conversations/${id}`)}
          onNew={createNewConversation}
          onDelete={handleDeleteConversation}
          onUpdateTitle={handleUpdateTitle}
          isMobileOpen={isMobileOpen}
          onMobileToggle={handleMobileToggle}
        />

        <main className="flex-1 h-full md:ml-64 pt-14">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}
