import React from "react";

export function Feedback({ state }) {
  return (
    <>
      {state.error && (
        <p className="error daily-error" role="alert">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p className="notice" role="status">
          {state.notice}
        </p>
      )}
    </>
  );
}
