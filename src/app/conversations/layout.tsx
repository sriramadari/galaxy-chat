"use client";

import React, { useEffect, useState } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
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
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { subscribe } = useConversationUpdates();
  const { showToast } = useToast();

  // Extract conversation ID from pathname
  const activeId =
    pathname === "/conversations"
      ? null
      : pathname === "/conversations/new"
        ? "new"
        : pathname.split("/").pop();

  const fetchConversations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
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
      router.push(`/conversations/new`);
      // Close mobile sidebar after creating new conversation
      if (isMobileOpen) {
        setIsMobileOpen(false);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

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

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Show sign in if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Welcome to Galaxy Chat
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Please sign in to continue</p>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

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
          isLoading={isLoading}
        />

        <main className="flex-1 h-full md:ml-64 pt-14">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}
