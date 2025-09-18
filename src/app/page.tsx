"use client";

import { useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect to /conversations when user is loaded and authenticated
  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/conversations/new");
    }
  }, [isLoaded, user, router]);

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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-8 bg-green-600 rounded-sm flex items-center justify-center shadow-lg">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Welcome to Galaxy Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Your intelligent AI assistant for conversations, coding, and creative tasks.
          </p>
          <SignInButton mode="modal">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-sm">
              Get Started
            </button>
          </SignInButton>
          <div className="mt-12 grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🧠</div>
              <span className="font-medium">Smart Conversations</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">✏️</div>
              <span className="font-medium">Edit & Re-ask</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">📁</div>
              <span className="font-medium">File Support</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🌙</div>
              <span className="font-medium">Dark Mode</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This will show briefly before redirect
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );
}
