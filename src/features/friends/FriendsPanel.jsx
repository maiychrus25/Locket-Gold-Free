import React from "react";
import { useOperation } from "../../lib/useOperation.js";
import { useState, useEffect } from "react";
import { request, records } from "../../lib/api.js";
import { unwrap, personName, identity, imageUrl } from "../../lib/data.js";
import { Search, UserPlus, RefreshCw, Users, Check } from "lucide-react";
import { Details } from "../../components/Details.jsx";
import { Feedback } from "../../components/Feedback.jsx";

export function FriendsPanel({ confirmAction }) {
  const state = useOperation();
  const [tab, setTab] = useState("getAllFriends");
  const [payload, setPayload] = useState(null);
  const [username, setUsername] = useState("");
  const [lookup, setLookup] = useState(null);
  async function load(method = tab) {
    const result = await state.run("friends", method);
    if (result) setPayload(result.value);
  }
  const reportError = state.setError;
  useEffect(() => {
    let cancelled = false;
    request(`/api/operations/friends/${tab}`, {})
      .then((response) => {
        if (!cancelled) setPayload(unwrap(response));
      })
      .catch((error) => {
        if (!cancelled) reportError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, reportError]);
  async function action(method, userUid) {
    const result = await state.run("friends", method, {
      userUid,
    });
    if (result) {
      await load();
      state.setNotice("Máy chủ đã xác nhận thao tác bạn bè.");
    }
  }
  let people = records(payload);
  if (!people.length && payload && typeof payload === "object")
    people = [
      "incoming",
      "outgoing",
      "incoming_requests",
      "outgoing_requests",
      "received",
      "sent",
    ].flatMap((key) =>
      Array.isArray(payload[key])
        ? payload[key].map((person) => ({
            ...person,
            requestDirection: key,
          }))
        : [],
    );
  return (
    <>
      <form
        className="inline-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await state.run("user", "getProfileByUsername", {
            username,
          });
          if (result) setLookup(result.value?.user || result.value);
        }}
      >
        <input
          aria-label="Tìm bạn bằng username"
          placeholder="Tìm bạn bằng username"
          value={username}
          required
          disabled={state.pending}
          onChange={(event) => {
            setUsername(event.target.value);
            setLookup(null);
          }}
        />
        <button className="button primary" disabled={state.pending}>
          <Search size={16} />
          Tìm bạn
        </button>
      </form>
      {lookup && (
        <div className="person-card">
          <h3>{personName(lookup)}</h3>
          <button
            className="button secondary"
            disabled={state.pending || !lookup.uid}
            onClick={async () => {
              const result = await state.run("friends", "sendRequest", {
                userUid: lookup.uid,
              });
              if (result) state.setNotice("Đã gửi lời mời kết bạn.");
            }}
          >
            <UserPlus size={15} />
            Gửi lời mời
          </button>
          <Details value={lookup} />
        </div>
      )}
      <div className="tabs" aria-label="Danh sách bạn bè">
        {[
          ["getAllFriends", "Bạn bè"],
          ["getFriendRequests", "Lời mời"],
          ["getGroupsAndFriends", "Nhóm"],
        ].map(([method, label]) => (
          <button
            key={method}
            disabled={state.pending}
            className={method === tab ? "selected" : ""}
            onClick={() => {
              setPayload(null);
              setTab(method);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Feedback state={state} />
      <div className="daily-toolbar">
        <h3>
          {people.length
            ? `${people.length} mục được trả về`
            : "Vòng tròn của bạn"}
        </h3>
        <button
          className="button secondary"
          disabled={state.pending}
          onClick={() => load()}
        >
          <RefreshCw size={15} />
          Tải lại
        </button>
      </div>
      {payload !== null && !people.length && (
        <div className="empty">
          <Users size={30} />
          <h3>Chưa có mục nào để hiển thị</h3>
          <p>Tìm bạn mới hoặc kiểm tra dữ liệu nhóm bên dưới.</p>
        </div>
      )}
      <div className="people-list">
        {people.map((person, index) => {
          const user = person.user || person;
          const uid = identity(user);
          const avatar = imageUrl(user);
          return (
            <article className="person-card" key={uid || index}>
              <div className="person-heading">
                {avatar ? <img src={avatar} alt="" /> : <Users size={25} />}
                <div>
                  <strong>{personName(user)}</strong>
                  <small>
                    {{
                      incoming: "Lời mời đến",
                      outgoing: "Lời mời đã gửi",
                      received: "Lời mời đến",
                      sent: "Lời mời đã gửi",
                    }[person.requestDirection] ||
                      person.requestDirection ||
                      uid}
                  </small>
                </div>
              </div>
              <div className="action-row">
                {tab === "getFriendRequests" ? (
                  <button
                    className="button primary"
                    disabled={
                      state.pending ||
                      !uid ||
                      /outgoing|sent/.test(person.requestDirection || "")
                    }
                    onClick={() => action("acceptRequest", uid)}
                  >
                    <Check size={14} />
                    Chấp nhận
                  </button>
                ) : (
                  <button
                    className="button secondary"
                    disabled={state.pending || !uid}
                    onClick={() =>
                      confirmAction("Huỷ kết bạn với người này?", () =>
                        action("remove", uid),
                      )
                    }
                  >
                    Huỷ kết bạn
                  </button>
                )}
                <button
                  className="button secondary"
                  disabled={state.pending || !uid}
                  onClick={() =>
                    confirmAction("Chặn người dùng này?", () =>
                      action("block", uid),
                    )
                  }
                >
                  Chặn
                </button>
                <button
                  className="button secondary"
                  disabled={state.pending || !uid}
                  onClick={() => action("unblock", uid)}
                >
                  Bỏ chặn
                </button>
              </div>
              <Details value={person} />
            </article>
          );
        })}
      </div>
      {payload !== null && <Details value={payload} />}
    </>
  );
}
