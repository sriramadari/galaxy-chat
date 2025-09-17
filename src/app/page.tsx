"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import ChatContainer from "@/components/chat/ChatContainer";
import Sidebar from "@/components/chat/SideBar";

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  messages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: Date;
  }>;
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Fetch conversations when user is loaded
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      setConversations(data);

      // Set active conversation to the first one if it exists and none is selected
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });

      const newConversation = await response.json();
      setConversations([newConversation, ...conversations]);
      setActiveConversationId(newConversation._id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Show sign in if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Welcome to Galaxy Chat</h1>
        <p className="mb-6">Please sign in to continue</p>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md">Sign In</button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={handleNewConversation}
        isLoading={isLoadingConversations}
      />
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold">Galaxy Chat</h1>
          <UserButton />
        </div>
        <div className="flex-1 overflow-hidden">
          {activeConversationId ? (
            <ChatContainer conversationId={activeConversationId} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation or start a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
