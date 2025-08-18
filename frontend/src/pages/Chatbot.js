import React, { useState } from "react";

function Chatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

    const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const formData = new FormData();
    formData.append("message", input);

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
        method: "POST",
        body: formData,
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
        console.error(err);
        setMessages((prev) => [...prev, { sender: "bot", text: "Error: could not reach server." }]);
    }

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
          <div
            key={idx}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flexGrow: 1, padding: 10 }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={{ padding: "10px 20px" }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
