import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import "./App.css";

// Simple demo app to test all comments component functionalities
// No fancy colors, just functional UI


type Thread = {
  thread: {
    _id: string;
    resolved: boolean;
    resolvedBy?: string;
    createdAt: number;
  };
  firstMessage: { body: string; authorId: string } | null;
  messageCount: number;
};
type Message = {
  message: {
    _id: string;
    body: string;
    authorId: string;
    mentions: Array<{ userId: string; start: number; end: number }>;
    links: Array<{ url: string; start: number; end: number }>;
    attachments: Array<{ type: string; url: string; name?: string }>;
    isEdited: boolean;
    isDeleted: boolean;
    resolved?: boolean;
    resolvedBy?: string;
    createdAt: number;
  };
  reactions: Array<{
    emoji: string;
    count: number;
    users: string[];
    includesMe: boolean;
  }>;
};

const DEMO_USERS = ["alice", "bob", "charlie"];

function App() {
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]);
  const [activeTab, setActiveTab] = useState<"zones" | "threads" | "messages">("zones");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ borderBottom: "2px solid #000", paddingBottom: "10px" }}>
        Comments Component Demo
      </h1>

      {/* User Switcher */}
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f5f5f5", border: "1px solid #ddd" }}>
        <strong>Current User:</strong>{" "}
        <select
          value={currentUser}
          onChange={(e) => setCurrentUser(e.target.value)}
          style={{ padding: "4px 8px", marginLeft: "10px" }}
        >
          {DEMO_USERS.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        <span style={{ marginLeft: "15px", fontSize: "12px", color: "#666" }}>
          (Open 2 tabs with different users to test typing indicators)
        </span>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => { setActiveTab("zones"); setSelectedZoneId(null); setSelectedThreadId(null); }}
          style={{ padding: "8px 16px", fontWeight: activeTab === "zones" ? "bold" : "normal", border: "1px solid #000", background: activeTab === "zones" ? "#000" : "#fff", color: activeTab === "zones" ? "#fff" : "#000", cursor: "pointer" }}
        >
          1. Zones
        </button>
        <button
          onClick={() => { setActiveTab("threads"); setSelectedThreadId(null); }}
          disabled={!selectedZoneId}
          style={{ padding: "8px 16px", fontWeight: activeTab === "threads" ? "bold" : "normal", border: "1px solid #000", background: activeTab === "threads" ? "#000" : "#fff", color: activeTab === "threads" ? "#fff" : "#000", cursor: selectedZoneId ? "pointer" : "not-allowed", opacity: selectedZoneId ? 1 : 0.5 }}
        >
          2. Threads
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          disabled={!selectedThreadId}
          style={{ padding: "8px 16px", fontWeight: activeTab === "messages" ? "bold" : "normal", border: "1px solid #000", background: activeTab === "messages" ? "#000" : "#fff", color: activeTab === "messages" ? "#fff" : "#000", cursor: selectedThreadId ? "pointer" : "not-allowed", opacity: selectedThreadId ? 1 : 0.5 }}
        >
          3. Messages
        </button>
      </div>

      {/* Breadcrumb */}
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f5f5f5", border: "1px solid #ddd" }}>
        <strong>Path:</strong>{" "}
        <span onClick={() => { setActiveTab("zones"); setSelectedZoneId(null); setSelectedThreadId(null); }} style={{ cursor: "pointer", textDecoration: "underline" }}>Zones</span>
        {selectedZoneId && (
          <>
            {" → "}
            <span onClick={() => { setActiveTab("threads"); setSelectedThreadId(null); }} style={{ cursor: "pointer", textDecoration: "underline" }}>Zone: {selectedZoneId.slice(0, 8)}...</span>
          </>
        )}
        {selectedThreadId && (
          <>
            {" → "}
            <span>Thread: {selectedThreadId.slice(0, 8)}...</span>
          </>
        )}
      </div>

      {/* Content */}
      {activeTab === "zones" && (
        <ZonesPanel
          onSelectZone={(zoneId) => {
            setSelectedZoneId(zoneId);
            setActiveTab("threads");
          }}
        />
      )}
      {activeTab === "threads" && selectedZoneId && (
        <ThreadsPanel
          zoneId={selectedZoneId}
          onSelectThread={(threadId) => {
            setSelectedThreadId(threadId);
            setActiveTab("messages");
          }}
        />
      )}
      {activeTab === "messages" && selectedThreadId && (
        <MessagesPanel threadId={selectedThreadId} currentUser={currentUser} />
      )}
    </div>
  );
}

// ============================================================================
// ZONES PANEL - Test: getOrCreateZone, listZones
// ============================================================================

function ZonesPanel({ onSelectZone }: { onSelectZone: (id: string) => void }) {
  const [entityId, setEntityId] = useState("");
  const zones = useQuery(api.example.listZones, {});
  const getOrCreateZone = useMutation(api.example.getOrCreateZone);

  const handleCreate = async () => {
    if (!entityId.trim()) return;
    const zoneId = await getOrCreateZone({ entityId: entityId.trim() });
    setEntityId("");
    // Navigate directly to the zone's threads
    onSelectZone(zoneId);
  };

  return (
    <div>
      <h2>Zones</h2>
      <p style={{ color: "#666" }}>
        <strong>Functions:</strong> getOrCreateZone(entityId), listZones()
      </p>

      {/* Create Zone */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd" }}>
        <h3>Create/Get Zone</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="Entity ID (e.g., doc_123, task_456)"
            style={{ flex: 1, padding: "8px", border: "1px solid #ccc" }}
          />
          <button onClick={handleCreate} style={{ padding: "8px 16px", cursor: "pointer" }}>
            getOrCreateZone()
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
          Enter any ID to create a zone. Same ID returns same zone (lazy creation).
        </p>
      </div>

      {/* Zone List */}
      <div style={{ border: "1px solid #ddd", padding: "15px" }}>
        <h3>All Zones ({zones?.length ?? 0})</h3>
        {!zones || zones.length === 0 ? (
          <p style={{ color: "#999" }}>No zones yet. Create one above.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Entity ID</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Zone ID</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Created At</th>
                <th style={{ padding: "8px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z._id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "8px" }}><code>{z.entityId}</code></td>
                  <td style={{ padding: "8px" }}><code>{z._id}</code></td>
                  <td style={{ padding: "8px" }}>{new Date(z.createdAt).toLocaleString()}</td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <button onClick={() => onSelectZone(z._id)} style={{ cursor: "pointer" }}>
                      View Threads →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// THREADS PANEL - Test: addThread, getThreads, resolveThread, unresolveThread
// ============================================================================

function ThreadsPanel({ zoneId, onSelectThread }: { zoneId: string; onSelectThread: (id: string) => void }) {
  const [showResolved, setShowResolved] = useState(true);

  const threadsResult = useQuery(api.example.getThreads, {
    zoneId,
    limit: 50,
    includeResolved: showResolved,
  });
  const addThread = useMutation(api.example.addThread);
  const resolveThread = useMutation(api.example.resolveThread);
  const unresolveThread = useMutation(api.example.unresolveThread);

  const threads = threadsResult?.threads ?? [];

  const handleAddThread = async () => {
    await addThread({ zoneId });
  };

  const handleResolve = async (threadId: string) => {
    await resolveThread({ threadId });
  };

  const handleUnresolve = async (threadId: string) => {
    await unresolveThread({ threadId });
  };

  return (
    <div>
      <h2>Threads in Zone</h2>
      <p style={{ color: "#666" }}>
        <strong>Functions:</strong> addThread(), getThreads(includeResolved), resolveThread(), unresolveThread()
      </p>
      <p><strong>Zone ID:</strong> <code>{zoneId}</code></p>

      {/* Add Thread */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd" }}>
        <h3>Create Thread</h3>
        <button onClick={handleAddThread} style={{ padding: "8px 16px", cursor: "pointer" }}>
          addThread() - Create Empty Thread
        </button>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
          Creates a new thread. Add messages to it in the Messages panel.
        </p>
      </div>

      {/* Filter Controls */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", background: "#f9f9f9" }}>
        <h3>Filter</h3>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          <span>Include Resolved Threads</span>
        </label>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
          Uses <code>getThreads({"{"} includeResolved: {showResolved.toString()} {"}"})</code>
        </p>
      </div>

      {/* Thread List */}
      <div style={{ border: "1px solid #ddd", padding: "15px" }}>
        <h3>Threads ({threads.length})</h3>
        {threads.length === 0 ? (
          <p style={{ color: "#999" }}>No threads yet. Create one above.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Thread ID</th>
                <th style={{ textAlign: "left", padding: "8px" }}>First Message</th>
                <th style={{ textAlign: "center", padding: "8px" }}>Messages</th>
                <th style={{ textAlign: "center", padding: "8px" }}>Resolved</th>
                <th style={{ padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((t: Thread) => (
                <tr key={t.thread._id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "8px" }}><code>{t.thread._id.slice(0, 12)}...</code></td>
                  <td style={{ padding: "8px" }}>
                    {t.firstMessage ? (
                      <span>{t.firstMessage.body.slice(0, 30)}{t.firstMessage.body.length > 30 ? "..." : ""}</span>
                    ) : (
                      <span style={{ color: "#999" }}>(empty)</span>
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>{t.messageCount}</td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {t.thread.resolved ? "✓ Yes" : "No"}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <button onClick={() => onSelectThread(t.thread._id)} style={{ marginRight: "5px", cursor: "pointer" }}>
                      Messages →
                    </button>
                    {t.thread.resolved ? (
                      <button onClick={() => handleUnresolve(t.thread._id)} style={{ cursor: "pointer" }}>
                        Unresolve
                      </button>
                    ) : (
                      <button onClick={() => handleResolve(t.thread._id)} style={{ cursor: "pointer" }}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MESSAGES PANEL - Test: addComment, getMessages, editMessage, deleteMessage,
//                        resolveMessage, unresolveMessage, reactions, typing
// ============================================================================

function MessagesPanel({ threadId, currentUser }: { threadId: string; currentUser: string }) {
  const [body, setBody] = useState("");


  // Mention autocomplete state
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Sample mentionable users (in real app, fetch from auth/DB)
  const mentionableUsers = [
    { id: "alice", name: "Alice Johnson" },
    { id: "bob", name: "Bob Smith" },
    { id: "charlie", name: "Charlie Brown" },
    { id: "diana", name: "Diana Prince" },
    { id: "eve", name: "Eve Wilson" },
  ];

  const filteredMentionUsers = mentionableUsers.filter(
    (u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const messagesResult = useQuery(api.example.getMessages, { threadId, limit: 100 });
  const typingUsers = useQuery(api.example.getTypingUsers, { threadId, excludeUserId: currentUser });

  const addComment = useMutation(api.example.addComment);
  const toggleReaction = useMutation(api.example.toggleReaction);
  const setIsTyping = useMutation(api.example.setIsTyping);
  const resolveMessage = useMutation(api.example.resolveMessage);
  const unresolveMessage = useMutation(api.example.unresolveMessage);

  const messages = messagesResult?.messages ?? [];

  const handleAddComment = async () => {
    if (!body.trim()) return;
    const result = await addComment({ threadId, body: body.trim() });
    console.log("addComment result:", result);
    setBody("");
    setShowMentionPicker(false);
    await setIsTyping({ threadId, userId: currentUser, isTyping: false });
  };

  const handleTypingWithMention = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setBody(value);
    setIsTyping({ threadId, userId: currentUser, isTyping: value.length > 0 });

    // Check for mention trigger
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex >= 0) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setShowMentionPicker(true);
        setMentionQuery(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionPicker(false);
      }
    } else {
      setShowMentionPicker(false);
    }
  };

  const insertMention = (user: { id: string; name: string }) => {
    const beforeMention = body.slice(0, mentionStartPos);
    const afterMention = body.slice(mentionStartPos + 1 + mentionQuery.length);
    const newBody = `${beforeMention}@${user.id} ${afterMention}`;
    setBody(newBody);
    setShowMentionPicker(false);
    setMentionQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && filteredMentionUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.min(prev + 1, filteredMentionUsers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentionUsers[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentionPicker(false);
        return;
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const result = await toggleReaction({ messageId, emoji });
    console.log("toggleReaction result:", result);
  };

  const handleResolveMessage = async (messageId: string) => {
    await resolveMessage({ messageId });
  };

  const handleUnresolveMessage = async (messageId: string) => {
    await unresolveMessage({ messageId });
  };

  return (
    <div>
      <h2>Messages in Thread</h2>
      <p style={{ color: "#666" }}>
        <strong>Functions:</strong> addComment(), getMessages(), toggleReaction(), setIsTyping(), resolveMessage(), unresolveMessage()
      </p>
      <p><strong>Thread ID:</strong> <code>{threadId}</code></p>

      {/* Add Comment with Mention Autocomplete */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd" }}>
        <h3>Add Comment (with Mention Autocomplete)</h3>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
          Type <code>@</code> to see mention autocomplete. Try: @alice, @bob, @charlie
        </p>
        <div style={{ position: "relative" }}>
          <textarea
            value={body}
            onChange={(e) => handleTypingWithMention(e)}
            onKeyDown={(e) => handleKeyDown(e)}
            placeholder="Write a message... (type @ to mention users)"
            style={{ flex: 1, padding: "8px", border: "1px solid #ccc", minHeight: "60px", width: "100%" }}
          />

          {/* Mention Autocomplete Dropdown */}
          {showMentionPicker && filteredMentionUsers.length > 0 && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              right: 0,
              marginBottom: "4px",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              maxHeight: "150px",
              overflowY: "auto",
            }}>
              {filteredMentionUsers.map((user, index) => (
                <div
                  key={user.id}
                  onClick={() => insertMention(user)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: index === selectedMentionIndex ? "#f0f0f0" : "transparent",
                  }}
                  onMouseEnter={() => setSelectedMentionIndex(index)}
                >
                  <strong>{user.name}</strong> <span style={{ color: "#666" }}>@{user.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleAddComment} style={{ marginTop: "10px", padding: "8px 16px", cursor: "pointer" }}>
          Send
        </button>
      </div>

      {/* Typing Indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div style={{ padding: "10px", background: "#f5f5f5", marginBottom: "20px", fontStyle: "italic" }}>
          {typingUsers.map(u => u.userId).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Message List */}
      <div style={{ border: "1px solid #ddd", padding: "15px" }}>
        <h3>Messages ({messages.length})</h3>
        {messages.length === 0 ? (
          <p style={{ color: "#999" }}>No messages yet. Add one above.</p>
        ) : (
          <div>
            {messages.map((m: Message) => (
              <div key={m.message._id} style={{ borderBottom: "1px solid #ddd", padding: "15px 0" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <strong>{m.message.authorId}</strong>
                  <span style={{ color: "#666", fontSize: "12px" }}>
                    {new Date(m.message.createdAt).toLocaleString()}
                    {m.message.isEdited && " (edited)"}
                    {m.message.isDeleted && " [DELETED]"}
                    {m.message.resolved && " ✓ Resolved"}
                  </span>
                </div>

                {/* Body */}
                <div style={{ marginBottom: "10px" }}>
                  {m.message.isDeleted ? (
                    <em style={{ color: "#999" }}>[This message was deleted]</em>
                  ) : (
                    <span>{m.message.body}</span>
                  )}
                </div>

                {/* Parsed Data */}
                {!m.message.isDeleted && (
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                    {m.message.mentions.length > 0 && (
                      <div>
                        <strong>Mentions:</strong>{" "}
                        {m.message.mentions.map((mention, i) => (
                          <code key={i} style={{ marginRight: "5px" }}>@{mention.userId}</code>
                        ))}
                      </div>
                    )}
                    {m.message.links.length > 0 && (
                      <div>
                        <strong>Links:</strong>{" "}
                        {m.message.links.map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: "5px" }}>
                            {link.url}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reactions */}
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {m.reactions.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => handleReaction(m.message._id, r.emoji)}
                      style={{
                        padding: "4px 8px",
                        border: r.includesMe ? "2px solid #000" : "1px solid #ccc",
                        background: r.includesMe ? "#e0e0e0" : "#fff",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {r.emoji} {r.count}
                    </button>
                  ))}
                  {/* Quick reaction buttons */}
                  <button
                    onClick={() => handleReaction(m.message._id, "👍")}
                    style={{ padding: "4px 8px", border: "1px dashed #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleReaction(m.message._id, "❤️")}
                    style={{ padding: "4px 8px", border: "1px dashed #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => handleReaction(m.message._id, "😄")}
                    style={{ padding: "4px 8px", border: "1px dashed #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    😄
                  </button>
                </div>

                {/* Message Actions */}
                {!m.message.isDeleted && (
                  <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                    {m.message.resolved ? (
                      <button
                        onClick={() => handleUnresolveMessage(m.message._id)}
                        style={{
                          padding: "4px 8px",
                          background: "#f0f0f0",
                          border: "1px solid #ccc",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Unresolve Message
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResolveMessage(m.message._id)}
                        style={{
                          padding: "4px 8px",
                          background: "#e8f5e9",
                          border: "1px solid #4caf50",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Resolve Message
                      </button>
                    )}
                  </div>
                )}

                {/* Message ID for debugging */}
                <div style={{ fontSize: "11px", color: "#999" }}>
                  ID: <code>{m.message._id}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {messagesResult && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          Has more: {messagesResult.hasMore ? "Yes" : "No"} |
          Next cursor: {messagesResult.nextCursor || "None"}
        </div>
      )}
    </div>
  );
}

export default App;
