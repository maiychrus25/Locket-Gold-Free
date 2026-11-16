import React from "react";
import { ChevronRight, Sun, Moon, UserRound, ArrowUpRight } from "lucide-react";
import { navigation } from "./navigation.js";

export function Topbar({ page, authenticated, setTheme, theme, setPage, setLogin }) {
  return (
    <header className="topbar">
      <span className="breadcrumb">
        Không gian cá nhân <ChevronRight size={14} />
        <strong>{navigation.find((item) => item.id === page).label}</strong>
      </span>
      <div className="topbar-actions">
        <span className={`connection ${authenticated ? "online" : ""}`}>
          <span className="tiny-dot" />
          {authenticated ? "Đã kết nối" : "Chưa kết nối"}
        </span>
        <button
          className="icon-button mobile-theme"
          aria-label="Đổi giao diện"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        {authenticated ? (
          <button
            className="account-button"
            onClick={() => setPage("profile")}
            aria-label="Hồ sơ"
          >
            <UserRound size={18} />
          </button>
        ) : (
          <button
            className="button compact primary"
            onClick={() => setLogin(true)}
          >
            Kết nối tài khoản <ArrowUpRight size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
