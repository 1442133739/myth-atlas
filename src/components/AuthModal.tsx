import { useState } from "react";
import { LogIn, UserPlus, X } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onLogin: (payload: { username: string; password: string }) => Promise<void>;
  onRegister: (payload: { username: string; displayName: string; password: string }) => Promise<void>;
}

export function AuthModal({ onClose, onLogin, onRegister }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await onLogin({ username, password });
      } else {
        await onRegister({ username, displayName, password });
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-backdrop">
      <section className="auth-modal">
        <button className="close-button" onClick={onClose} type="button">
          <X size={18} />
        </button>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
            <LogIn size={16} />
            登录
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            <UserPlus size={16} />
            注册
          </button>
        </div>
        <h2>{mode === "login" ? "登录后参与讨论" : "创建一个本地账号"}</h2>
        <label>
          用户名
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="2-18 位" />
        </label>
        {mode === "register" && (
          <label>
            昵称
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="展示在评论区" />
          </label>
        )}
        <label>
          密码
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-submit" onClick={submit} disabled={busy} type="button">
          {busy ? "处理中" : mode === "login" ? "登录" : "注册并登录"}
        </button>
      </section>
    </div>
  );
}
