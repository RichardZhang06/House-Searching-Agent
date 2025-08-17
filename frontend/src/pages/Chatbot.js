import React, { useState, useRef, useEffect } from "react";

function Chatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);

  useEffect(() => {
    // Use ws if you want real-time
    const wsUrl = `ws://${window.location.host}/ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      setMessages((prev) => [...prev, { sender: "bot", text: event.data }]);
    };

    ws.current.onclose = () => console.log("WebSocket closed");
    return () => ws.current.close();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    // Fallback POST for production or if WebSocket fails
    const formData = new FormData();
    formData.append("message", input);

    const response = await fetch("/chat", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);

    setInput("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Chatbot</h1>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 10,
          padding: 10,
          height: 400,
          overflowY: "auto",
          marginBottom: 10,
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === "user" ? "right" : "left" }}>
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "80%", padding: 10 }}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage} style={{ width: "18%", padding: 10 }}>
        Send
      </button>
    </div>
  );
}

export default Chatbot;
