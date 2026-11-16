import React from "react";
import { Image } from "lucide-react";

export function Empty({ icon: _Icon = Image, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <_Icon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
