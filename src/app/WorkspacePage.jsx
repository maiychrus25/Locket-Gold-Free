import React from "react";
import { navigation } from "./navigation.js";
import { LockKeyhole, UserRound, LogOut, Search } from "lucide-react";
import { Raw } from "../components/Raw.jsx";
import { FriendsPanel } from "../features/friends/FriendsPanel.jsx";
import { ChatPanel } from "../features/chat/ChatPanel.jsx";
import { LiveChat } from "../features/chat/LiveChat.jsx";
import { Workspace } from "../features/tools/Workspace.jsx";

export function WorkspacePage({
  page,
  relevant,
  authenticated,
  setLogin,
  session,
  setLogout,
  confirmAction,
  filter,
  setFilter,
  workspaceProps,
}) {
  return (
    <section className="panel tools-panel">
      <div className="section-heading">
        <h2>{navigation.find((item) => item.id === page).label}</h2>
        <span className="badge">{relevant(page).length} thao tác</span>
      </div>
      {!authenticated && (
        <div className="connect-strip">
          <LockKeyhole size={21} />
          <div>
            <strong>Kết nối để sử dụng không gian này</strong>
            <p>Bạn có thể xem các tính năng trước khi đăng nhập.</p>
          </div>
          <button
            className="button secondary"
            onClick={() => setLogin(true)}
          >
            Kết nối
          </button>
        </div>
      )}
      {page === "profile" && authenticated && (
        <div className="profile-summary">
          <div className="profile-avatar">
            <UserRound size={30} />
          </div>
          <div>
            <h3>{session.user?.email || "Tài khoản của bạn"}</h3>
            <p className="muted">
              UID: {session.user?.uid || "Không có thông tin"}
            </p>
          </div>
          <button
            className="button secondary"
            onClick={() => setLogout(true)}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
          {session.device && <Raw value={session.device} />}
        </div>
      )}
      {page === "friends" && authenticated && (
        <FriendsPanel confirmAction={confirmAction} />
      )}
      {page === "chat" && authenticated && (
        <ChatPanel confirmAction={confirmAction} />
      )}
      {page === "chat" && <LiveChat authenticated={authenticated} />}
      {page === "tools" && (
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Tìm công cụ"
            placeholder="Tìm tên tính năng, nhóm hoặc phương thức…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </label>
      )}
      <Workspace
        key={`${page}-${authenticated}`}
        {...workspaceProps}
        operations={relevant(page).filter(
          (operation) =>
            page !== "tools" ||
            `${operation.label} ${operation.group} ${operation.method}`
              .toLowerCase()
              .includes(filter.toLowerCase()),
        )}
      />
    </section>
  );
}
