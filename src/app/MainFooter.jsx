import React from "react";
import { Heart } from "lucide-react";

export function MainFooter() {
  return (
    <footer className="main-footer">
      <span>
        <Heart size={13} /> Những điều nhỏ làm nên kết nối lớn.
      </span>
      <span>Lock Gold Free · Không cung cấp mở khóa thuê bao Gold</span>
    </footer>
  );
}
