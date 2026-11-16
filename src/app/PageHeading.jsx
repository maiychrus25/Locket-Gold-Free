import React from "react";
import { titles } from "./navigation.js";
import { Plus } from "lucide-react";

export function PageHeading({ page, setPage }) {
  return (
    <div className="page-heading">
      <div className="eyebrow">
        <span className="tiny-dot" /> YOUR LITTLE MOMENTS, TOGETHER
      </div>
      <div className="heading-row">
        <div>
          <h1>{titles[page][0]}</h1>
          <p>{titles[page][1]}</p>
        </div>
        {page === "home" && (
          <button
            className="button primary"
            onClick={() => setPage("compose")}
          >
            <Plus size={18} />
            Tạo khoảnh khắc
          </button>
        )}
      </div>
    </div>
  );
}
