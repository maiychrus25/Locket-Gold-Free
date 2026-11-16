import { useState } from "react";
import { unwrap } from "./data.js";
import { request } from "./api.js";

export function useOperation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function run(group, method, values = {}) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const value = unwrap(
        await request(`/api/operations/${group}/${method}`, values),
      );
      return {
        value,
      };
    } catch (failure) {
      setError(failure.message);
      return null;
    } finally {
      setPending(false);
    }
  }
  return {
    run,
    pending,
    error,
    notice,
    setNotice,
    setError,
  };
}
