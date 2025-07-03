import React, { useState } from "react";
import "../styles/LoginPage.css";

const LoginPage = () => {
  const [step, setStep] = useState("choose"); // choose, register, email, code
  const [form, setForm] = useState({ name: "", email: "", password: "", code: "" });
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleChoose = (newUser) => {
    setIsNew(newUser);
    setStep(newUser ? "register" : "email");
    setError("");
  };

  const handleRegister = e => {
    e.preventDefault();
    // Registration logic here
    setStep("email");
  };

  const handleEmail = e => {
    e.preventDefault();
    // Send code logic here
    setStep("code");
  };

  const handleCode = e => {
    e.preventDefault();
    // Verify code logic here
    alert("Logged in!");
  };

  return (
    <div
      className="login-page"
      style={{
        background: "url('/images/bg.jpg') center center/cover no-repeat",
        minHeight: "100dvh",
        minWidth: "100vw",
        width: "100vw",
        boxSizing: "border-box"
      }}
    >
      <div className="login-box">
        <img src="/images/logo.jpg" alt="Groovy Bugs Logo" className="login-logo" />
        <h2>{step === "register" ? "Register" : "Login"}</h2>
        {step === "choose" && (
          <div className="login-choice">
            <button onClick={() => handleChoose(false)}>Existing Customer</button>
            <button onClick={() => handleChoose(true)}>New User</button>
          </div>
        )}
        {step === "register" && (
          <form onSubmit={handleRegister} className="login-form">
            <input name="name" type="text" placeholder="Name" value={form.name} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <button type="submit">Register</button>
            <button type="button" onClick={() => setStep("choose")}>Back</button>
          </form>
        )}
        {step === "email" && (
          <form onSubmit={handleEmail} className="login-form">
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <button type="submit">Send Code</button>
            <button type="button" onClick={() => setStep(isNew ? "register" : "choose")}>Back</button>
          </form>
        )}
        {step === "code" && (
          <form onSubmit={handleCode} className="login-form">
            <input name="code" type="text" placeholder="Enter 6-digit code" value={form.code} onChange={handleChange} required maxLength={6} />
            <button type="submit">Login</button>
            <button type="button" onClick={() => setStep("email")}>Back</button>
          </form>
        )}
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
};

export default LoginPage; 