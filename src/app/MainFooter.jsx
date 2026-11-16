import React from "react";
import { Heart } from "lucide-react";

export function MainFooter() {
  return (
    <footer className="main-footer">
      <span>
        <Heart size={13} /> Những điều nhỏ làm nên kết nối lớn.
      </span>
      <span>Lock Gold Free · Miễn phí mọi công cụ trên web</span>
    </footer>
  );
}
