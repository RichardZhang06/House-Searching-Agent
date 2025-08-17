import React from "react";
import { Link } from "react-router-dom";

function Home({ user }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to the House Searching Chatbot</h1>
      {user ? (
        <>
          <p>Hello, {user.name}!</p>
          <Link to="/chat">
            <button>Go to Chatbot</button>
          </Link>
          <a href="/logout">
            <button style={{ marginLeft: 10 }}>Logout</button>
          </a>
        </>
      ) : (
        <a href="/login">
          <button>Login with Google</button>
        </a>
      )}
    </div>
  );
}

export default Home;
