import React, { useEffect } from "react";

function Login() {
  useEffect(() => {
    // Redirect to backend OAuth
    window.location.href = "/login";
  }, []);

  return <div>Redirecting to Google login...</div>;
}

export default Login;
