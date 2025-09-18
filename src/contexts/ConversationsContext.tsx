import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  userId: string;
}

interface ConversationsContextType {
  conversations: Conversation[];
  loading: boolean;
  refreshConversations: () => Promise<void>;
  updateConversationTitle: (_id: string, _title: string) => Promise<boolean>;
  deleteConversation: (_id: string) => Promise<boolean>;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshConversations = async () => {
    await fetchConversations();
  };

  const updateConversationTitle = async (id: string, title: string): Promise<boolean> => {
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
        return true;
      }
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
    return false;
  };

  const deleteConversation = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConversations((prev) => prev.filter((conv) => conv._id !== id));
        return true;
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
    return false;
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const value = {
    conversations,
    loading,
    refreshConversations,
    updateConversationTitle,
    deleteConversation,
  };

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error("useConversations must be used within a ConversationsProvider");
  }
  return context;
}
