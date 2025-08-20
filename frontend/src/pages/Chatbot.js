import React, { useState, useRef, useEffect } from "react";

function Chatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const AZURE_URL = "https://housesearchingagent-g6h6b4euaxbhfudr.canadacentral-01.azurewebsites.net";

  // Scroll to bottom on new messages or loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${AZURE_URL}/chats`);
        if (!response.ok) throw new Error("Failed to fetch chats");
        const data = await response.json();

        // Chronological order (oldest first)
        const history = data.flatMap((chat) => [
          { sender: "user", text: chat.message, time: chat.time },
          { sender: "bot", text: chat.reply, time: chat.time },
        ]);

        setMessages(history);
      } catch (err) {
        console.error("Error fetching chat history:", err);
      }
    };
    fetchChats();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const now = new Date().toISOString();
    setMessages((prev) => [...prev, { sender: "user", text: input, time: now }]);
    setLoading(true);

    try {
      const response = await fetch(`${AZURE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply, time: now }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: could not reach server.", time: new Date().toISOString() },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  const clearMessages = async () => {
    // Frontend clear
    setMessages([]);

    // TODO: call backend to clear DB
    try {
      const response = await fetch(`${AZURE_URL}/chats`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete messages from server");
      const data = await response.json();
      console.log("Deleted messages:", data.deleted);
    } catch (err) {
      console.error("Error clearing messages from backend:", err);
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        width: "90%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        border: "1px solid #ccc",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          padding: "15px 20px",
          borderBottom: "1px solid #eee",
          backgroundColor: "#f5f5f5",
          fontWeight: "bold",
          fontSize: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Chatbot</span>
        <button
          onClick={clearMessages}
          style={{
            padding: "5px 10px",
            fontSize: 12,
            borderRadius: 8,
            border: "none",
            backgroundColor: "#dc3545",
            color: "white",
            cursor: "pointer",
          }}
        >
          Clear Chat
        </button>
      </div>

      <div
        style={{
          flexGrow: 1,
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          backgroundColor: "#fafafa",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.sender === "user" ? "#d1e7dd" : "#e2e3e5",
              padding: "10px 14px",
              borderRadius: 12,
              maxWidth: "75%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div>
              <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong> {msg.text}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#555",
                textAlign: msg.sender === "user" ? "right" : "left",
              }}
            >
              {new Date(msg.time).toLocaleString()}
            </div>
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              fontStyle: "italic",
              color: "#555",
            }}
          >
            Bot is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          display: "flex",
          borderTop: "1px solid #eee",
          padding: 10,
          backgroundColor: "#f5f5f5",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{
            flexGrow: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            outline: "none",
            fontSize: 16,
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            marginLeft: 10,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#0d6efd",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
