import React from "react";
import { sanitize } from "../lib/api.js";

export function Details({ value }) {
  return (
    <details className="raw">
      <summary>Chi tiết dữ liệu</summary>
      <pre>{JSON.stringify(sanitize(value), null, 2)}</pre>
    </details>
  );
}
