import React, { useState } from "react";
import { request } from "../../lib/api.js";
import { Modal } from "../../components/Modal.jsx";
import { Heart, ArrowRight, ShieldCheck } from "lucide-react";

export function Login({ close, connected }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function login(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const session = await request("/api/auth/login", {
        email,
        password,
      });
      if (!session.authenticated)
        throw new Error("Chưa đăng nhập được. Bạn vui lòng thử lại.");
      setPassword("");
      connected(session);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title="Kết nối tài khoản Locket"
      close={() => {
        if (!pending) close();
      }}
    >
      <div className="login-symbol">
        <Heart size={30} />
      </div>
      <p className="muted">
        Mang những khoảnh khắc của bạn về một không gian quen thuộc.
      </p>
      <form onSubmit={login}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
          />
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={pending}>
          {pending ? "Đang kết nối…" : "Kết nối tài khoản"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="secure-note">
        <ShieldCheck size={16} />
        Mật khẩu chỉ dùng để đăng nhập và không được lưu trên website.
      </p>
    </Modal>
  );
}
