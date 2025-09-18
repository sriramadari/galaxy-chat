"use client";

import React from "react";

export default function ConversationsPage() {
  return (
    <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Galaxy Chat</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select a conversation from the sidebar or start a new one to begin chatting with AI.
        </p>
        <div className="max-w-md mx-auto text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            ✨ <strong>Features:</strong>
          </p>
          <ul className="text-left space-y-1">
            <li>• Context-aware conversations</li>
            <li>• Edit and re-ask messages</li>
            <li>• File upload support</li>
            <li>• Dark mode toggle</li>
            <li>• Mobile responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
