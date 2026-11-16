import React, { useEffect, useRef, useState } from "react";
import { request, records } from "../../lib/api.js";
import { identity, personName } from "../../lib/data.js";

export function friendName(person) {
  const name = personName({
    displayName: person?.displayName || person?.display_name,
    username: person?.username,
    firstName: person?.firstName || person?.first_name,
    lastName: person?.lastName || person?.last_name,
  });
  return typeof name === "string" && name !== "Người dùng" ? name : "Bạn bè";
}

export function FriendSelect({ value, onChange, disabled, label, emptyLabel = "Chọn một người bạn", selectedPerson, onLoad }) {
  const [people, setPeople] = useState(null);
  const [knownPeople, setKnownPeople] = useState(() => new Map());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const lifecycle = useRef({ active: true });
  useEffect(() => {
    const current = lifecycle.current;
    current.active = true;
    return () => { current.active = false; };
  }, []);
  async function load() {
    setPending(true);
    setError(false);
    try {
      const response = await request("/api/operations/friends/getAllFriends", {});
      if (lifecycle.current.active) {
        const friends = records(response).map(person => person.user || person);
        const next = [...new Map(friends.filter(person => typeof identity(person) === "string" && identity(person)).map(person => [identity(person), person])).values()];
        setPeople(next);
        setKnownPeople(previous => new Map([...previous, ...next.filter(person => friendName(person) !== "Bạn bè").map(person => [identity(person), person])]));
        onLoad?.(next);
      }
    } catch {
      if (lifecycle.current.active) setError(true);
    } finally {
      if (lifecycle.current.active) setPending(false);
    }
  }
  const selected = knownPeople.get(value) || (identity(selectedPerson) === value ? selectedPerson : null);
  return <div className="field">
    <label>{label}<select aria-label={label} value={value} disabled={disabled || pending} onChange={event => onChange(event.target.value, knownPeople.get(event.target.value) || people?.find(person => identity(person) === event.target.value))}>
      <option value="">{emptyLabel}</option>
      {value && !people?.some(person => identity(person) === value) && <option value={value}>{selected ? friendName(selected) : "Chọn lại người nhận"}</option>}
      {people?.map(person => <option key={identity(person)} value={identity(person)}>{friendName(knownPeople.get(identity(person)) || person)}</option>)}
    </select></label>
    <button type="button" className="button secondary" disabled={disabled || pending} onClick={load}>{pending ? "Đang tải bạn bè…" : "Chọn từ bạn bè"}</button>
    {error && <p role="alert">Chưa tải được bạn bè. Vui lòng thử lại.</p>}
    {people?.length === 0 && <p className="muted">Chưa có bạn bè để chọn.</p>}
  </div>;
}
