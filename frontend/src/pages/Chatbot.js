import React, { useState, useRef, useEffect } from "react";

function Chatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setLoading(true);

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: could not reach server." },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        display: "flex",
        flexDirection: "column",
        height: "80vh",
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
        }}
      >
        Chatbot
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
            <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong> {msg.text}
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
