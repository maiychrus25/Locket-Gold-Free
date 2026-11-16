import React from "react";
import { sanitize } from "../lib/api.js";

export function Raw({ value }) {
  return (
    <details className="raw">
      <summary>Xem dữ liệu JSON</summary>
      <pre>{JSON.stringify(sanitize(value), null, 2)}</pre>
    </details>
  );
}
