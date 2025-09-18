# Galaxy Chat 🚀

A full-stack, context-persisting ChatGPT-like chat application built with modern web technologies.

## ✨ Features

### 🔒 **Authentication & User Management**

- Secure authentication with Clerk
- User profiles with avatars
- Session management

### 💬 **Chat Experience**

- Real-time streaming AI responses using Gemini 2.5 Flash
- Markdown support with syntax highlighting
- Code block copy-to-clipboard functionality
- File upload capabilities (images, documents)
- Message persistence across sessions

### 🧠 **Context Memory**

- Intelligent context retention with Mem0
- Cross-conversation memory
- Personalized AI responses based on user history

### 📱 **Modern UI/UX**

- Professional dark/light theme toggle
- Responsive design (mobile & desktop)
- Sidebar navigation with conversation management
- Editable conversation titles
- Real-time conversation updates
- Toast notifications for user feedback
- Error boundaries for graceful error handling

### ⚙️ **Conversation Management**

- Create new conversations
- Edit conversation titles inline
- Delete conversations
- Auto-generated meaningful titles
- Conversation history sidebar

### ⌨️ **Keyboard Shortcuts**

- `Ctrl/Cmd + Shift + N`: Create new conversation
- `Escape`: Close mobile sidebar
- `Enter`: Send message
- `Shift + Enter`: New line in message

### 🛠 **Technical Features**

- MongoDB database for persistence
- Vercel AI SDK for streaming responses
- TailwindCSS for styling
- TypeScript for type safety
- Next.js 15 App Router
- Optimistic UI updates
- Real-time sidebar refresh

## 🏗 **Architecture**

### **Frontend**

- **Next.js 15**: App Router, Server Components, and Client Components
- **React 18**: Modern React features with hooks
- **TailwindCSS**: Utility-first styling
- **Clerk**: Authentication and user management
- **TypeScript**: Type safety and developer experience

### **Backend**

- **Next.js API Routes**: RESTful API endpoints
- **MongoDB**: Document database for conversations and messages
- **Mongoose**: MongoDB object modeling
- **Vercel AI SDK**: Streaming AI responses
- **Mem0**: Context and memory management

### **AI Integration**

- **Google Gemini 2.5 Flash**: Large language model
- **Vercel AI SDK**: Streaming and response handling
- **Mem0**: Memory and context persistence

## 📁 **Project Structure**

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # Main chat endpoint
│   │   ├── conversations/        # CRUD for conversations
│   │   ├── messages/             # Message management
│   │   └── upload/               # File upload handling
│   ├── conversations/            # Chat pages
│   │   ├── [conversationId]/     # Dynamic conversation pages
│   │   ├── new/                  # New conversation welcome
│   │   └── layout.tsx            # Main chat layout
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── chat/                     # Chat-specific components
│   ├── ui/                       # Reusable UI components
│   └── upload/                   # File upload components
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
└── models/                       # MongoDB models
```

## 🚀 **Getting Started**

1. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd galaxy-chat
   pnpm install
   ```

2. **Environment Setup**:
   Create a `.env.local` file with:

   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # AI Services
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   MEM0_API_KEY=your_mem0_api_key

   # File Upload
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. **Run the development server**:

   ```bash
   pnpm dev
   ```

4. **Visit** `http://localhost:3000` and start chatting!

## 🔧 **Configuration**

### **Database Models**

- **Conversation**: Stores conversation metadata (title, user, timestamps)
- **Message**: Stores individual messages with role, content, and conversation reference

### **API Endpoints**

- `POST /api/chat`: Main chat endpoint with streaming
- `GET /api/conversations`: Fetch user conversations
- `PATCH /api/conversations/[id]`: Update conversation title
- `DELETE /api/conversations/[id]`: Delete conversation
- `GET/POST /api/messages/[conversationId]`: Message CRUD operations
- `POST /api/upload`: File upload handling

## 🎯 **Key Features Implemented**

- ✅ Persistent conversations and messages
- ✅ Mem0 context integration
- ✅ Streaming Gemini responses
- ✅ Editable conversation titles
- ✅ Professional UI with dark mode
- ✅ Sidebar with CRUD operations
- ✅ Real-time updates
- ✅ Markdown and code parsing
- ✅ User profile integration
- ✅ Mobile responsive design
- ✅ File upload capabilities
- ✅ Error handling and boundaries
- ✅ Toast notifications
- ✅ Keyboard shortcuts
- ✅ Optimistic UI updates

## 🔮 **Future Enhancements**

- [ ] Message editing and re-asking
- [ ] Conversation search and filtering
- [ ] Export conversations
- [ ] Advanced file type support
- [ ] Voice input/output
- [ ] Conversation sharing
- [ ] Advanced memory controls
- [ ] Custom AI model selection

## 💡 **Usage Tips**

1. **Creating Conversations**: Click "New Chat" or use `Ctrl+Shift+N`
2. **Editing Titles**: Hover over any conversation and click the edit icon
3. **File Uploads**: Click the upload icon in the message input
4. **Theme Toggle**: Use the sun/moon icon in the header
5. **Mobile Navigation**: Use the hamburger menu on mobile devices

## 🛠 **Development**

Built with love using modern web technologies. The application follows best practices for:

- Type safety with TypeScript
- Component composition with React
- Responsive design with TailwindCSS
- API design with REST principles
- Database modeling with MongoDB
- Real-time updates and streaming
- Error handling and user experience

---

**Galaxy Chat** - Your intelligent conversation companion! 🌟
