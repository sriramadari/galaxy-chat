import React, { useState } from "react";
import { Pencil, RotateCcw, Copy, Check as CheckIcon, Bot, User } from "lucide-react";
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
  onEdit: (_id: string, _content: string, _shouldReAsk?: boolean) => void;
  onReAsk?: (_id: string) => void;
  isStreaming?: boolean;
}

// Custom code block component with copy functionality
const CodeBlock = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const extractTextContent = (node: any): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractTextContent).join("");
    if (node && typeof node === "object") {
      if (node.props && node.props.children) {
        return extractTextContent(node.props.children);
      }
      if (node.type === "text") return node.value || "";
    }
    return String(node || "");
  };

  const copyToClipboard = async () => {
    try {
      const textContent = extractTextContent(children).trim();
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = extractTextContent(children).trim();
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  if (match) {
    return (
      <div className="relative group my-4 bg-gray-950 rounded-lg overflow-hidden border border-gray-800 max-w-full">
        <div className="flex items-center justify-between bg-gray-900 px-4 py-2.5 border-b border-gray-800">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
            {language}
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100"
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
        <div className="overflow-x-auto max-w-full">
          <pre className="p-4 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <code
      className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-gray-700"
      {...props}
    >
      {children}
    </code>
  );
};

export default function MessageItem({ message, onEdit, onReAsk, isStreaming }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleSave = () => {
    if (editedContent.trim() !== message.content.trim()) {
      // Call onEdit with shouldReAsk=true to trigger re-ask after editing
      onEdit(message.id, editedContent.trim(), true);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleReAsk = () => {
    if (onReAsk && !isEditing) {
      onReAsk(message.id);
    }
  };

  const isUser = message.role === "user";

  return (
    <div
      className={`group relative w-full ${isUser ? "mb-4" : "mb-6"} ${!isUser ? "bg-gray-50/80 dark:bg-gray-800/50" : ""}`}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-green-600 rounded-sm flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {isEditing && isUser ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <textarea
                  className="w-full bg-transparent text-gray-900 dark:text-gray-100 p-4 min-h-[120px] resize-none focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Edit your message..."
                  autoFocus
                />
                <div className="flex justify-end gap-2 p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                  <button
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={handleSave}
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none prose-sm">
                {isUser ? (
                  <div className="text-gray-900 dark:text-gray-100 leading-7 whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                ) : (
                  <div className="text-gray-900 dark:text-gray-100 leading-7 overflow-hidden">
                    {message.content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code: CodeBlock,
                          p: ({ children }) => (
                            <p className="mb-4 last:mb-0 leading-7 text-gray-900 dark:text-gray-100 break-words">
                              {children}
                            </p>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">
                              {children}
                            </h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-6 mb-4 space-y-1 overflow-hidden">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-6 mb-4 space-y-1 overflow-hidden">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-gray-900 dark:text-gray-100 leading-relaxed break-words">
                              {children}
                            </li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 py-3 rounded-r overflow-hidden">
                              {children}
                            </blockquote>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900 dark:text-gray-100">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
                          ),
                          th: ({ children }) => (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 break-words">
                              {children}
                            </td>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline break-all"
                            >
                              {children}
                            </a>
                          ),
                          pre: ({ children }) => <div className="overflow-hidden">{children}</div>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : isStreaming ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Galaxy AI is thinking...
                        </span>
                      </div>
                    ) : null}

                    {/* Show blinking cursor when streaming and has content */}
                    {isStreaming && message.content && (
                      <span className="inline-block w-2 h-5 bg-gray-600 dark:bg-gray-400 animate-pulse ml-1"></span>
                    )}
                  </div>
                )}

                {/* Action buttons for user messages */}
                {isUser && !isEditing && (
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      className="flex items-center gap-1.5 text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200"
                      onClick={() => setIsEditing(true)}
                      title="Edit message"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    {onReAsk && (
                      <button
                        className="flex items-center gap-1.5 text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200"
                        onClick={handleReAsk}
                        title="Re-ask this question"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
