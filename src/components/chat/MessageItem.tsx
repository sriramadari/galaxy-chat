import React, { useState } from "react";
import { Pencil, Check, X, RotateCcw, Copy, Check as CheckIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// Define our custom message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageItemProps {
  message: Message;
  // Parameter names match implementation in the parent component's handleEditMessage function
  // which requires these parameter names for proper functioning
  // eslint-disable-next-line no-unused-vars
  onEdit: (id: string, content: string) => void;
  // eslint-disable-next-line no-unused-vars
  onReAsk?: (id: string) => void;
}

// Custom code block component with copy functionality
const CodeBlock = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  if (match) {
    return (
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 text-gray-200 px-4 py-2 rounded-t-lg">
          <span className="text-sm font-mono text-gray-400">{language}</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
          <code className="text-sm font-mono" {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code
      className="bg-gray-200 dark:bg-gray-700 text-red-600 dark:text-red-400 px-1 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
};

export default function MessageItem({ message, onEdit, onReAsk }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  // Using onEdit function that takes message.id and editedContent parameters

  const handleSave = () => {
    onEdit(message.id, editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleReAsk = () => {
    if (onReAsk) {
      onReAsk(message.id);
    }
  };

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 group relative ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        }`}
      >
        {isEditing && isUser ? (
          <div className="flex flex-col space-y-3">
            <textarea
              className="border rounded-lg p-3 bg-white dark:bg-gray-700 text-black dark:text-white min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your message..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="inline-flex items-center text-sm py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </button>
              <button
                className="inline-flex items-center text-sm py-2 px-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                onClick={handleSave}
              >
                <Check className="h-4 w-4 mr-1" /> Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`break-words ${isUser ? "text-white" : ""}`}>
              {isUser ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code: CodeBlock,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => (
                        <h2 className="text-lg font-semibold mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-md font-semibold mb-1">{children}</h3>
                      ),
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {isUser && (
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="inline-flex items-center text-xs py-1.5 px-2 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors duration-200"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                >
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </button>
                {onReAsk && (
                  <button
                    className="inline-flex items-center text-xs py-1.5 px-2 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors duration-200"
                    onClick={handleReAsk}
                    title="Re-ask this question"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Re-ask
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
