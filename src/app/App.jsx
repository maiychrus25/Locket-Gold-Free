import React, { useRef, useState, useEffect } from "react";
import { request } from "../lib/api.js";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { PageHeading } from "./PageHeading.jsx";
import { RefreshCw } from "lucide-react";
import { HomePage } from "../features/feed/HomePage.jsx";
import { ComposePage } from "../features/moments/ComposePage.jsx";
import { WorkspacePage } from "./WorkspacePage.jsx";
import { MainFooter } from "./MainFooter.jsx";
import { Modal } from "../components/Modal.jsx";
import { Login } from "../features/auth/Login.jsx";

export function App() {
  const sessionRevision = useRef(0);
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState(() => {
    try {
      return (
        localStorage.getItem("lock-theme") ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      );
    } catch {
      return "light";
    }
  });
  const [catalog, setCatalog] = useState({
    operations: [],
    presets: [],
    reactions: [],
  });
  const [session, setSession] = useState({
    authenticated: false,
  });
  const [login, setLogin] = useState(false);
  const [logout, setLogout] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [actionConfirm, setActionConfirm] = useState(null);
  const confirmAction = (title, action) =>
    setActionConfirm({
      title,
      action,
    });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const generation = session.generation || "guest";
  const [draftGeneration, setDraftGeneration] = useState(generation);
  useEffect(() => {
    setDrafts({});
    setActionConfirm(null);
    setLogout(false);
    setDraftGeneration(generation);
  }, [generation]);
  const [feedTab, setFeedTab] = useState("latest");
  const [filter, setFilter] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("lock-theme", theme);
    } catch {
      /* Browser storage may be disabled. */
    }
  }, [theme]);
  async function load() {
    const revision = ++sessionRevision.current;
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      request("/api/catalog"),
      request("/api/auth/session"),
    ]);
    if (revision !== sessionRevision.current) return;
    if (results[0].status === "fulfilled") setCatalog(results[0].value);
    if (results[1].status === "fulfilled") setSession(results[1].value);
    const failure = results.find((result) => result.status === "rejected");
    if (failure) setError(failure.reason.message);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const expired = () => {
      sessionRevision.current++;
      setLoading(false);
      setActionConfirm(null);
      setLogout(false);
      setSession({
        authenticated: false,
      });
      setError(
        "Phiên đăng nhập đã hết hạn. Kết nối lại để tiếp tục; bản nháp đã được xoá để bảo vệ tài khoản.",
      );
    };
    window.addEventListener("lock-session-expired", expired);
    return () => window.removeEventListener("lock-session-expired", expired);
  }, []);
  const operations = catalog.operations || [];
  const authenticated = session.authenticated;
  function relevant(target) {
    return operations.filter((operation) => {
      const key = `${operation.group}.${operation.method}`;
      if (target === "compose") return operation.media === "post";
      if (target === "friends")
        return /friend|group|block|lookup|searchUser|request/i.test(key);
      if (target === "chat") return /chat|conversation|message/i.test(key);
      if (target === "profile")
        return (
          /user|profile|device|session|client|notification|birth|name|avatar/i.test(
            key,
          ) && !/friend|chat|message/i.test(key)
        );
      if (target === "home")
        return (
          /post|feed|history|moment|reaction|comment|view/i.test(key) &&
          !operation.media &&
          !/chat|message/i.test(key)
        );
      return true;
    });
  }
  const workspaceProps = {
    catalog,
    authenticated,
    connect: () => setLogin(true),
    drafts: draftGeneration === generation ? drafts : {},
    setDrafts,
  };
  async function endSession() {
    sessionRevision.current++;
    setLoading(false);
    setLogoutPending(true);
    try {
      await request("/api/auth/logout", {});
      setSession({
        authenticated: false,
      });
      setDrafts({});
      setLogout(false);
      setPage("home");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLogoutPending(false);
    }
  }
  return (
    <div className="app-shell">
      <Sidebar setPage={setPage} page={page} setTheme={setTheme} theme={theme} />
      <div className="main-shell">
        <Topbar
          page={page}
          authenticated={authenticated}
          setTheme={setTheme}
          theme={theme}
          setPage={setPage}
          setLogin={setLogin}
        />
        <main key={generation}>
          <PageHeading page={page} setPage={setPage} />
          {error && (
            <div className="error banner" role="alert">
              <span>{error}</span>
              <button
                className="button secondary"
                disabled={loading}
                onClick={load}
              >
                Thử lại
              </button>
            </div>
          )}
          {loading && (
            <p role="status" className="loading">
              <RefreshCw size={17} className="spin" /> Đang kết nối không gian
              của bạn…
            </p>
          )}
          {page === "home" && (
            <HomePage
              authenticated={authenticated}
              setPage={setPage}
              setLogin={setLogin}
              loading={loading}
              load={load}
              feedTab={feedTab}
              setFeedTab={setFeedTab}
              session={session}
              confirmAction={confirmAction}
              workspaceProps={workspaceProps}
              relevant={relevant}
            />
          )}
          {page === "compose" && (
            <ComposePage
              workspaceProps={workspaceProps}
              relevant={relevant}
              catalog={catalog}
            />
          )}
          {["friends", "chat", "profile", "tools"].includes(page) && (
            <WorkspacePage
              page={page}
              relevant={relevant}
              authenticated={authenticated}
              setLogin={setLogin}
              session={session}
              setLogout={setLogout}
              confirmAction={confirmAction}
              filter={filter}
              setFilter={setFilter}
              workspaceProps={workspaceProps}
            />
          )}
          <MainFooter />
        </main>
      </div>
      {actionConfirm && draftGeneration === generation && (
        <Modal title={actionConfirm.title} close={() => setActionConfirm(null)}>
          <p>Vui lòng xác nhận trước khi thực hiện thay đổi này.</p>
          <div className="button-row">
            <button
              className="button secondary"
              onClick={() => setActionConfirm(null)}
            >
              Huỷ
            </button>
            <button
              className="button danger"
              onClick={() => {
                const action = actionConfirm.action;
                setActionConfirm(null);
                action();
              }}
            >
              Xác nhận
            </button>
          </div>
        </Modal>
      )}
      {login && (
        <Login
          key={generation}
          close={() => setLogin(false)}
          connected={(value) => {
            sessionRevision.current++;
            setLoading(false);
            setError("");
            setSession(value);
            setLogin(false);
          }}
        />
      )}
      {logout && (
        <Modal
          title="Đăng xuất tài khoản?"
          close={() => {
            if (!logoutPending) setLogout(false);
          }}
        >
          <p>
            Phiên kết nối và bản nháp trên trang sẽ được xoá khỏi không gian
            này.
          </p>
          <div className="button-row">
            <button
              className="button secondary"
              disabled={logoutPending}
              onClick={() => setLogout(false)}
            >
              Ở lại
            </button>
            <button
              className="button danger"
              disabled={logoutPending}
              onClick={endSession}
            >
              {logoutPending ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
