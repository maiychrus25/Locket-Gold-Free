import React from "react";
import { Heart, Plus, Sparkles, ArrowUpRight, Sun, Moon } from "lucide-react";
import { navigation } from "./navigation.js";

export function Sidebar({ setPage, page, setTheme, theme }) {
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          setPage("home");
        }}
      >
        <span className="brand-icon">
          <Heart fill="currentColor" size={23} />
        </span>
        <span>
          lock gold<span className="brand-tag">FREE</span>
        </span>
      </a>
      <div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div>
      <nav aria-label="Điều hướng chính">
        {navigation.map(({ id, label, icon: _Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? "active" : ""}`}
            aria-current={page === id ? "page" : undefined}
            onClick={() => setPage(id)}
          >
            <_Icon size={20} />
            <span>{label}</span>
            {id === "compose" && <Plus size={15} className="nav-plus" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="little-note">
          <Sparkles size={20} />
          <strong>Thêm một chút gần gũi.</strong>
          <p>Mọi khoảnh khắc đều đáng được giữ lại.</p>
          <button onClick={() => setPage("compose")}>
            Tạo khoảnh khắc <ArrowUpRight size={16} />
          </button>
        </div>
        <button
          className="theme-button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}</span>
          <span className="theme-switch" />
        </button>
        <div className="sidebar-footer">
          <span className="tiny-dot" />
          Made for your little moments
        </div>
      </div>
    </aside>
  );
}
