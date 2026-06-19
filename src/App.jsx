import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_KEY  = import.meta.env.VITE_API_KEY  || "bybit-dashboard-key";

function api(path, opts = {}) {
  return fetch(API_BASE + path, {
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    ...opts,
  }).then(r => r.json());
}

// Upload a photo (with optional caption + winner tag) — sends straight to the group
function uploadPhoto(file, caption, tagUserId) {
  const fd = new FormData();
  fd.append("photo", file);
  if (caption)   fd.append("caption", caption);
  if (tagUserId) fd.append("tagUserId", tagUserId);
  return fetch(API_BASE + "/api/upload-photo", {
    method: "POST",
    headers: { "x-api-key": API_KEY }, // no Content-Type — browser sets multipart boundary
    body: fd,
  }).then(r => r.json());
}

// Reusable photo attach control: pick a file, show only the filename (no preview thumbnail).
function PhotoAttach({ photo, setPhoto }) {
  const inputId = "photo-" + Math.random().toString(36).slice(2, 8);
  function onPick(e) {
    const f = e.target.files?.[0];
    if (f) setPhoto(f);
  }
  return (
    <div className="photo-attach">
      {!photo ? (
        <label htmlFor={inputId} className="photo-attach-btn">
          📷 Foto toevoegen
          <input id={inputId} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
        </label>
      ) : (
        <div className="photo-chip">
          📷 <span className="photo-chip-name">{photo.name}</span>
          <button className="photo-remove" onClick={() => setPhoto(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

// Telegram-style preview + confirm popup. Shows how the message will look in the group.
// `photo` is a File (optional). `note` shows scheduling info. onConfirm/onCancel are callbacks.
function TelegramPreview({ open, title, text, photo, note, confirmLabel, onConfirm, onCancel, sending }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  useEffect(() => {
    if (photo) {
      const url = URL.createObjectURL(photo);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoUrl(null);
  }, [photo]);

  if (!open) return null;

  // Render *bold* markdown as <strong> for the preview
  function renderText(t) {
    if (!t) return null;
    const parts = t.split(/(\*[^*]+\*)/g);
    return parts.map((p, i) =>
      p.startsWith("*") && p.endsWith("*") && p.length > 1
        ? <strong key={i}>{p.slice(1, -1)}</strong>
        : <span key={i}>{p}</span>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal tg-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || "Voorbeeld"}</h3>
          <button className="btn-icon" onClick={onCancel}><Icons.x /></button>
        </div>
        <div className="tg-preview-hint">Zo verschijnt het bericht in de groep:</div>

        {/* Telegram chat mockup */}
        <div className="tg-chat-bg">
          <div className="tg-bubble">
            <div className="tg-bubble-name">Bybit EU Bot</div>
            {photoUrl && <img className="tg-bubble-photo" src={photoUrl} alt="preview" />}
            <div className="tg-bubble-text">{renderText(text)}</div>
            <div className="tg-bubble-time">{new Date().toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
        </div>

        {note && <div className="tg-preview-note">{note}</div>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Annuleer</button>
          <button className="btn-primary" onClick={onConfirm} disabled={sending}>
            <Icons.send /> {sending ? "Bezig..." : (confirmLabel || "Plaatsen")}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Icons ──────────────────────────────────────────────────────────────
const Icons = {
  users:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chart:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  trophy:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="8 21 12 21 16 21"/><path d="M12 21v-4"/><path d="M7 4H17l-1 7a5 5 0 0 1-8 0Z"/><path d="M5 4H3v3a4 4 0 0 0 4 4"/><path d="M19 4h2v3a4 4 0 0 1-4 4"/></svg>,
  message:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  prediction: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  gift:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  shield:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  send:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  clock:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:          () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  shuffle:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  eye:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  plus:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  calendar:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  help:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  server:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  coin:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 9.5a2.5 2 0 0 1 5 0c0 1.5-2.5 1.5-2.5 3"/><line x1="12" y1="16" x2="12" y2="16"/></svg>,
  trash:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  telegram:   () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.477c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.07 14.63l-2.94-.918c-.638-.2-.651-.638.136-.946l11.48-4.43c.532-.194.998.13.816.912z"/></svg>,
};

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="stat-card" style={{ "--accent": color }}>
      <div className="stat-icon"><Icon /></div>
      <div className="stat-body">
        <div className="stat-value">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [step, setStep]         = useState("login"); // login | servers
  const [checking, setChecking] = useState(false);
  const [err, setErr]           = useState("");
  const [servers, setServers]   = useState([]);
  const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || "";

  // Load Telegram Login Widget
  useEffect(() => {
    if (step !== "login" || !BOT_USERNAME) return;
    // Expose the callback Telegram will call
    window.onTelegramAuth = async (user) => {
      setChecking(true);
      setErr("");
      try {
        const res = await api("/api/auth/telegram", { method: "POST", body: JSON.stringify(user) });
        if (!res.ok) throw new Error(res.error || "Login mislukt");
        // Now load servers
        const sv = await api("/api/servers");
        setServers(sv.servers || []);
        window._tgUser = res.user;
        setStep("servers");
      } catch (e) {
        setErr(e.message || "Telegram login mislukt.");
      }
      setChecking(false);
    };
    const container = document.getElementById("tg-login-container");
    if (container && !container.querySelector("script")) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      script.setAttribute("data-telegram-login", BOT_USERNAME);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "6");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      container.appendChild(script);
    }
  }, [step, BOT_USERNAME]);

  // Fallback login (no Telegram widget configured) — direct API key connect
  async function handleFallbackLogin() {
    setChecking(true);
    setErr("");
    try {
      const res = await api("/api/servers");
      if (res.error) throw new Error(res.error);
      setServers(res.servers || []);
      setStep("servers");
    } catch (e) {
      setErr("Kan geen verbinding maken met de bot API. Controleer je instellingen.");
    }
    setChecking(false);
  }

  function selectServer(server) {
    const u = window._tgUser || { name: "Sushil", role: "owner" };
    onLogin({ name: u.name || "Sushil", role: u.role || "owner", username: u.username, server });
  }

  if (step === "servers") {
    return (
      <div className="login-screen">
        <div className="login-card login-card-wide">
          <div className="login-logo">
            <div className="logo-icon">B</div>
          </div>
          <h1>Selecteer een server</h1>
          <p>Servers waar jij beheerder van bent</p>

          <div className="server-list">
            {servers.length === 0 && (
              <div className="server-empty">
                <div className="server-empty-icon">⚠️</div>
                <div>Geen actieve server gevonden.</div>
                <div className="server-empty-sub">Controleer of de bot in je groep zit en of GROUP_CHAT_ID correct is ingesteld in Railway.</div>
              </div>
            )}
            {servers.map(s => (
              <button
                key={s.id}
                className={`server-card ${s.isActive ? "" : "server-inactive"}`}
                onClick={() => s.isActive && selectServer(s)}
                disabled={!s.isActive}
              >
                <div className="server-avatar">{(s.title || "?").charAt(0).toUpperCase()}</div>
                <div className="server-info">
                  <div className="server-name">{s.title}</div>
                  <div className="server-meta">
                    {s.username && <span>@{s.username}</span>}
                    {s.memberCount && <span>{s.memberCount} leden</span>}
                    <span className={`server-status ${s.isActive ? "active" : "inactive"}`}>
                      {s.isActive ? "● Bot actief" : "○ Bot niet actief"}
                    </span>
                  </div>
                </div>
                {s.isActive && <div className="server-arrow">→</div>}
              </button>
            ))}
          </div>

          <button className="btn-secondary" style={{marginTop:"8px"}} onClick={() => setStep("login")}>← Terug</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bybit-login-centered">
      <div className="bybit-login-bg" />
      <div className="bybit-login-card">
        <div className="bybit-card-brand">
          <div className="bybit-brand-mark">B</div>
          <span className="bybit-brand-name">BYBIT</span>
        </div>
        <h1>Welkom terug</h1>
        <p className="bybit-sub">Bybit EU Telegram Bot — log in met je Telegram account</p>

        {BOT_USERNAME ? (
          <>
            <div id="tg-login-container" className="tg-login-container" />
            {checking && <div className="tg-checking">Verifiëren...</div>}
          </>
        ) : (
          <>
            <div className="bybit-field">
              <label>Account</label>
              <div className="bybit-input-static">
                <span className="bybit-crown">👑</span>
                Owner — Sushil
              </div>
            </div>
            <button className="bybit-login-btn" onClick={handleFallbackLogin} disabled={checking}>
              {checking ? "Verbinden..." : "Inloggen"}
            </button>
            <div className="tg-hint">Stel VITE_BOT_USERNAME in voor Telegram login</div>
          </>
        )}

        {err && <div className="error-msg">{err}</div>}

        <div className="bybit-divider"><span>beveiligd via Telegram</span></div>
        <div className="bybit-login-note">Alleen beheerders kunnen inloggen.</div>
        <div className="bybit-card-foot">Beheerd door Sushil 👑</div>
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────
function OverviewTab() {
  const [status, setStatus]   = useState(null);
  const [leader, setLeader]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, l] = await Promise.all([api("/api/status"), api("/api/leaderboard")]);
    setStatus(s);
    setLeader(l.leaderboard || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function toggleFeedback() {
    await api("/api/bot/feedback-toggle", {
      method: "POST",
      body: JSON.stringify({ enabled: !status.feedbackEnabled }),
    });
    load();
  }

  function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}u ${m}m`;
    return `${m}m`;
  }

  if (loading) return <div className="loading">Laden...</div>;

  const g = status?.groupInfo;

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Overzicht</h2>
        <button className="btn-icon" onClick={load}><Icons.refresh /></button>
      </div>

      {/* Bot & Group Status */}
      <div className="status-bar">
        <div className="status-item">
          <div className={`status-dot ${status?.botOnline ? "online" : "offline"}`} />
          <div className="status-info">
            <div className="status-label">Bot status</div>
            <div className="status-value">{status?.botOnline ? "Online" : "Offline"}</div>
          </div>
          {status?.uptime > 0 && <div className="status-extra">Uptime: {formatUptime(status.uptime)}</div>}
        </div>

        <div className="status-divider" />

        <div className="status-item">
          <div className={`status-dot ${g && !g.error ? "online" : "offline"}`} />
          <div className="status-info">
            <div className="status-label">Actieve groep</div>
            <div className="status-value">{g?.title || "Niet gevonden"}</div>
          </div>
          {g?.username && <div className="status-extra">@{g.username}</div>}
          {g?.memberCount && <div className="status-extra">{g.memberCount} leden</div>}
        </div>

        <div className="status-divider" />

        <div className="status-item" style={{cursor:"pointer"}} onClick={async () => {
          const r = await api("/api/bot/reconnect", { method:"POST", body:"{}" });
          if (r.success) { alert("✅ Verbinding hersteld met: " + r.chat?.title); load(); }
          else alert("❌ Herverbinding mislukt: " + r.error);
        }}>
          <div className={`status-dot ${status?.groupInfo && !status?.groupInfo?.error ? "online" : "offline"}`} />
          <div className="status-info">
            <div className="status-label">Actieve groep</div>
            <div className="status-value">{status?.groupInfo?.title || "Niet gevonden"}</div>
          </div>
          <div className="status-extra" title="Klik om te herverbinden">🔄</div>
        </div>

        <div className="status-divider" />

        <div className={`status-item ${status?.activeQuestion ? "status-active" : ""}`}>
          <div className={`status-dot ${status?.activeQuestion ? "active" : "inactive"}`} />
          <div className="status-info">
            <div className="status-label">Predictie</div>
            <div className="status-value">
              {status?.activeQuestion ? `${status.totalVotesActive} stemmen` : "Geen actief"}
            </div>
          </div>
          {status?.activeQuestion && <div className="status-badge-live">LIVE</div>}
        </div>

        <div className="status-divider" />

        <div className={`status-item ${status?.feedbackEnabled ? "status-active" : ""}`}>
          <div className={`status-dot ${status?.feedbackEnabled ? "active" : "inactive"}`} />
          <div className="status-info">
            <div className="status-label">Feedback</div>
            <div className="status-value">
              {status?.feedbackEnabled ? `${status.totalFeedbackWeek} deze week` : "Gesloten"}
            </div>
          </div>
          {status?.feedbackEnabled && <div className="status-badge-live">OPEN</div>}
        </div>
      </div>

      {/* Active prediction banner */}
      {status?.activeQuestion && (
        <div className="card active-question-banner">
          <div className="aq-left">
            <div className="aq-badge">🔮 ACTIEVE PREDICTIE</div>
            <div className="aq-question">"{status.activeQuestion.question}"</div>
            <div className="aq-tags">
              {JSON.parse(status.activeQuestion.valid_tags || "[]").map(t => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
          <div className="aq-right">
            <div className="aq-votes">{status.totalVotesActive}</div>
            <div className="aq-votes-label">stemmen</div>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {status?.feedbackEnabled && (
        <div className="card feedback-banner">
          <div className="fb-left">
            <div className="fb-badge">💡 FEEDBACK OPEN</div>
            <div className="fb-text">Leden kunnen feedback sturen met <code>#FDB</code></div>
          </div>
          <div className="fb-right">
            <div className="fb-count">{status.totalFeedbackWeek}</div>
            <div className="fb-label">inzendingen</div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Leden bijgehouden" value={status?.totalUsers} icon={Icons.users} color="#3b82f6" />
        <StatCard label="Berichten deze week" value={status?.weekMessages} icon={Icons.chart} color="#10b981" />
        <StatCard label="Totaal stemmen" value={status?.totalVotes} icon={Icons.prediction} color="#f59e0b" />
        <StatCard label="Feedback ontvangen" value={status?.totalFeedback} icon={Icons.message} color="#8b5cf6" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🏆 Top 3 meest actief deze week</h3>
        </div>
        <div className="leaderboard">
          {leader.slice(0, 3).map((u, i) => (
            <div key={u.user_id} className="leader-row">
              <div className="leader-rank">{["🥇", "🥈", "🥉"][i]}</div>
              <div className="leader-info">
                <div className="leader-name">{u.username ? "@" + u.username : u.first_name || "Gebruiker"}</div>
                {u.uid && <div className="leader-uid">UID: {u.uid}</div>}
              </div>
              <div className="leader-stats">
                <span>{u.message_count} 💬</span>
                <span>{u.reaction_count || 0} ❤️</span>
              </div>
            </div>
          ))}
          {leader.length === 0 && <div className="empty">Nog geen activiteit deze week</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>⚙️ Bot instellingen</h3>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <div className="settings-label">Feedback collectie</div>
            <div className="settings-desc">Laat leden feedback sturen met #FDB</div>
          </div>
          <button
            className={`toggle ${status?.feedbackEnabled ? "on" : ""}`}
            onClick={toggleFeedback}
          >
            {status?.feedbackEnabled ? "AAN" : "UIT"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Predictions Tab ────────────────────────────────────────────────────
function PredictionsTab() {
  const [predictions, setPredictions] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [voters, setVoters]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [form, setForm]               = useState({ question: "", tags: "", scheduleAt: "", voteType: "text", questionType: "tags", prize: "" });
  const [reveal, setReveal]           = useState({ show: false, qId: null, tags: [], count: 3 });
  const [revealResult, setRevealResult] = useState(null);
  const [announcing, setAnnouncing]   = useState(false);
  const [announceTxt, setAnnounceTxt] = useState("");
  const [announceSent, setAnnounceSent] = useState(false);
  const [announcePhoto, setAnnouncePhoto] = useState(null);
  const [createPreview, setCreatePreview] = useState(false);
  const [announcePreview, setAnnouncePreview] = useState(false);
  const [editPred, setEditPred] = useState(null);
  const [posting, setPosting] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const r = await api("/api/predictions");
    setPredictions(r.predictions || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 12 seconds to show live votes
  useEffect(() => {
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, [load]);

  async function viewVoters(q) {
    setSelected(q);
    const r = await api("/api/predictions/" + q.id + "/voters");
    setVoters(r);
  }

  // Build the preview text exactly like the bot will post it
  function buildPredictionPreview() {
    const tags = form.tags.split(/[\s,]+/).filter(Boolean).map(t => t.startsWith("#") ? t : "#"+t);
    const prizeLine = form.prize ? `\n\n🏆 Te winnen: *${form.prize}*` : "";
    if (form.questionType === "number") {
      const tagWord = tags[0] || "#prijs";
      return `🔢 *${form.question}*${prizeLine}\n\nDoe mee door je antwoord te sturen met ${tagWord}, bijvoorbeeld:\n${tagWord} 67500\n\nWie het dichtst bij zit wint!`;
    }
    return `🚀 *Nieuwe predictie!*\n\n"${form.question}"\n\nStem met: ${tags.join("  ")}${prizeLine}`;
  }

  function openCreatePreview() {
    if (!form.question.trim() || !form.tags.trim()) return;
    setCreatePreview(true);
  }

  function openEditPrediction(q) {
    setEditPred({
      id: q.id,
      question: q.question,
      tags: (q.tags || []).join(" "),
      prize: q.prize || "",
      questionType: q.question_type || "tags",
    });
  }

  function buildEditPredPreview(ep) {
    const tags = (ep.tags||"").split(/[\s,]+/).filter(Boolean).map(t => t.startsWith("#") ? t : "#"+t);
    const prizeLine = ep.prize ? `\n\n\u{1F3C6} Te winnen: *${ep.prize}*` : "";
    if (ep.questionType === "number") {
      const tagWord = tags[0] || "#prijs";
      return `\u{1F522} *${ep.question}*${prizeLine}\n\nDoe mee met ${tagWord}, bijv: ${tagWord} 67500\n\nWie het dichtst zit wint!`;
    }
    return `\u{1F680} *Nieuwe predictie!*\n\n"${ep.question}"\n\nStem met: ${tags.join("  ")}${prizeLine}`;
  }

  async function saveEditPred() {
    const tags = editPred.tags.split(/[\s,]+/).filter(Boolean);
    await api(`/api/predictions/${editPred.id}`, {
      method: "PUT",
      body: JSON.stringify({ question: editPred.question, tags, prize: editPred.prize, questionType: editPred.questionType }),
    });
    setEditPred(null);
    load();
  }

  async function deletePrediction(id) {
    await api(`/api/predictions/${id}`, { method: "DELETE" });
    load();
  }

  async function postPredNow() {
    await api(`/api/predictions/${editPred.id}/post-now`, { method: "POST" });
    setEditPred(null);
    load();
  }

  async function confirmCreate() {
    setPosting(true);
    const tags = form.tags.split(/[\s,]+/).filter(Boolean);
    await api("/api/predictions/create", {
      method: "POST",
      body: JSON.stringify({
        question: form.question, tags, scheduleAt: form.scheduleAt || null,
        voteType: form.voteType, questionType: form.questionType, prize: form.prize || null,
      }),
    });
    setPosting(false);
    setCreatePreview(false);
    setCreating(false);
    setForm({ question: "", tags: "", scheduleAt: "", voteType: "text", questionType: "tags", prize: "" });
    load();
  }

  async function doReveal() {
    if (!reveal.correctTag) return;
    const r = await api("/api/predictions/" + reveal.qId + "/reveal", {
      method: "POST",
      body: JSON.stringify({ correctTag: reveal.correctTag, winnersCount: reveal.count }),
    });
    r.qId = reveal.qId;
    // Tag the first winner so the bot can build a safe @mention from {winner}
    if (r.winners?.length) r.tagUserId = r.winners[0].user_id;
    setRevealResult(r);
    setReveal(prev => ({ ...prev, show: false }));
    setAnnounceSent(false);

    // Auto-fill announcement text with winners
    const q = predictions.find(p => p.id === reveal.qId);
    const answer = r.correct?.replace("#","").toUpperCase();
    const prize = q?.prize ? ` Je wint *${q.prize}*!` : "";
    let txt = `🎯 *Uitslag!*\n\nDe vraag was: "${q?.question || ""}"\nHet juiste antwoord: *${answer}*\n\n`;
    if (r.winners?.length) {
      // Use {winner} for the first winner so the bot makes a clean, escaped mention
      txt += `🏆 *Winnaar:* {winner}${prize}\n`;
      if (r.winners.length > 1) {
        txt += `\nOok goed:\n`;
        r.winners.slice(1).forEach((w, i) => {
          const name = w.username ? "@"+w.username : w.first_name;
          txt += `${i+2}. ${name}\n`;
        });
      }
      txt += `\nGefeliciteerd! 🎉`;
    } else {
      txt += `Niemand had het juiste antwoord dit keer!`;
    }
    setAnnounceTxt(txt);
    load();
  }

  function openAnnouncePreview() {
    if (!announceTxt.trim() && !announcePhoto) return;
    setAnnouncePreview(true);
  }

  async function announce() {
    setAnnouncing(true);
    let r;
    if (announcePhoto) {
      r = await uploadPhoto(announcePhoto, announceTxt, revealResult?.tagUserId || null);
    } else {
      r = await api("/api/predictions/" + revealResult?.qId + "/announce", {
        method: "POST",
        body: JSON.stringify({ message: announceTxt, tagUserId: revealResult?.tagUserId || null }),
      });
    }
    setAnnouncing(false);
    setAnnouncePreview(false);
    if (r?.sent_status === "failed" || r?.error) {
      alert("Het bericht kon niet naar de groep worden gestuurd: " + (r?.error || "onbekende fout") + "\n\nControleer of de bot in de groep zit en probeer opnieuw.");
      setAnnounceSent(false);
    } else {
      setAnnounceSent(true);
    }
  }

  async function doRevealNumber() {
    if (reveal.correctValue === "" || reveal.correctValue == null) return;
    const r = await api("/api/predictions/" + reveal.qId + "/reveal-number", {
      method: "POST",
      body: JSON.stringify({ correctValue: reveal.correctValue, winnersCount: reveal.count }),
    });
    r.qId = reveal.qId;
    r.numeric = true;
    // Tag the closest winner
    if (r.winners?.length) r.tagUserId = r.winners[0].user_id;
    setRevealResult(r);
    setReveal(prev => ({ ...prev, show: false }));
    setAnnounceSent(false);

    const q = predictions.find(p => p.id === reveal.qId);
    const prize = q?.prize ? ` Je wint *${q.prize}*!` : "";
    let txt = `🔢 *Uitslag!*\n\nDe vraag was: "${q?.question || ""}"\nHet juiste antwoord: *${r.correctValue}*\n\n`;
    if (r.winners?.length) {
      txt += `🏆 *Winnaar:* {winner}${prize}\nMet een gok van ${r.winners[0].guess_value} (${r.winners[0].diff} ernaast)\n\n`;
      if (r.winners.length > 1) {
        txt += `Eervolle vermeldingen:\n`;
        r.winners.slice(1).forEach((w,i) => {
          txt += `${i+2}. ${w.username ? "@"+w.username : w.first_name} — ${w.guess_value}\n`;
        });
      }
      txt += `\nGefeliciteerd! 🎉`;
    } else {
      txt += `Niemand heeft meegedaan dit keer!`;
    }
    setAnnounceTxt(txt);
    load();
  }

  if (loading) return <div className="loading">Laden...</div>;

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Predicties</h2>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button className={`btn-icon ${refreshing ? "spinning" : ""}`} onClick={() => load(true)} title="Ververs">
            <Icons.refresh />
          </button>
          <span className="live-indicator"><span className="live-dot" /> Live</span>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Icons.plus /> Nieuwe predictie
          </button>
        </div>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nieuwe predictie</h3>
              <button className="btn-icon" onClick={() => setCreating(false)}><Icons.x /></button>
            </div>
            <div className="form-group">
              <label>Type voorspelling</label>
              <div className="votetype-toggle">
                <button
                  className={`votetype-btn ${form.questionType !== "number" ? "selected" : ""}`}
                  onClick={() => setForm(p => ({ ...p, questionType: "tags" }))}
                >
                  <div className="vt-title">🏷️ Keuze</div>
                  <div className="vt-desc">Kiezen uit opties (#ja #nee)</div>
                </button>
                <button
                  className={`votetype-btn ${form.questionType === "number" ? "selected" : ""}`}
                  onClick={() => setForm(p => ({ ...p, questionType: "number", voteType: "text" }))}
                >
                  <div className="vt-title">🔢 Getal</div>
                  <div className="vt-desc">Dichtst bij de prijs wint</div>
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Vraag</label>
              <input
                className="input"
                placeholder={form.questionType === "number" ? 'Bijv. "Wat is de BTC prijs om 12:00?"' : 'Bijv. "Gaat BTC deze week omhoog?"'}
                value={form.question}
                onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>{form.questionType === "number" ? "Deelname-hashtag" : "Stemopties (gescheiden door spatie)"}</label>
              <input
                className="input"
                placeholder={form.questionType === "number" ? "#prijs" : "#ja #nee  of  #bullish #bearish"}
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              />
              {form.questionType === "number" && (
                <div className="field-hint">Leden sturen bijv. <code>#prijs 67500</code> om mee te doen</div>
              )}
            </div>
            <div className="form-group">
              <label>Prijs (optioneel)</label>
              <input
                className="input"
                placeholder="Bijv. 10 USDC"
                value={form.prize}
                onChange={e => setForm(p => ({ ...p, prize: e.target.value }))}
              />
            </div>
            {form.questionType !== "number" && (
              <div className="form-group">
                <label>Hoe stemmen?</label>
                <div className="votetype-toggle">
                  <button
                    className={`votetype-btn ${form.voteType !== "buttons" ? "selected" : ""}`}
                    onClick={() => setForm(p => ({ ...p, voteType: "text" }))}
                  >
                    <div className="vt-title">💬 Hashtag</div>
                    <div className="vt-desc">Leden typen #ja in een bericht</div>
                  </button>
                  <button
                    className={`votetype-btn ${form.voteType === "buttons" ? "selected" : ""}`}
                    onClick={() => setForm(p => ({ ...p, voteType: "buttons" }))}
                  >
                    <div className="vt-title">🔘 Knoppen</div>
                    <div className="vt-desc">Leden tikken op een knop</div>
                  </button>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Inplannen (optioneel)</label>
              <input
                className="input"
                type="datetime-local"
                value={form.scheduleAt}
                onChange={e => setForm(p => ({ ...p, scheduleAt: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setCreating(false)}>Annuleer</button>
              <button className="btn-primary" onClick={openCreatePreview} disabled={!form.question.trim() || !form.tags.trim()}>
                {form.scheduleAt ? <><Icons.clock /> Voorbeeld & inplannen</> : <><Icons.send /> Voorbeeld & posten</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create preview popup */}
      <TelegramPreview
        open={createPreview}
        title={form.scheduleAt ? "Voorbeeld — inplannen" : "Voorbeeld — nu posten"}
        text={buildPredictionPreview()}
        note={form.scheduleAt
          ? `Wordt automatisch geplaatst op ${new Date(form.scheduleAt).toLocaleString("nl-NL",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}`
          : "Wordt direct in de groep geplaatst"}
        confirmLabel={form.scheduleAt ? "Inplannen" : "Nu posten"}
        sending={posting}
        onConfirm={confirmCreate}
        onCancel={() => setCreatePreview(false)}
      />

      {/* Reveal modal */}
      {reveal.show && (
        <div className="modal-overlay" onClick={() => setReveal(p => ({ ...p, show: false }))}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{reveal.numeric ? "Vul het juiste getal in" : "Onthul correct antwoord"}</h3>
              <button className="btn-icon" onClick={() => setReveal(p => ({ ...p, show: false }))}><Icons.x /></button>
            </div>
            {reveal.numeric ? (
              <div className="form-group">
                <label>Werkelijke waarde</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  placeholder="Bijv. 67432"
                  value={reveal.correctValue ?? ""}
                  onChange={e => setReveal(p => ({ ...p, correctValue: e.target.value }))}
                />
                <div className="field-hint">Het dashboard berekent wie het dichtst zat.</div>
              </div>
            ) : (
              <div className="form-group">
                <label>Correct antwoord</label>
                <div className="tag-select">
                  {reveal.tags.map(tag => (
                    <button
                      key={tag}
                      className={`tag-btn ${reveal.correctTag === tag ? "selected" : ""}`}
                      onClick={() => setReveal(p => ({ ...p, correctTag: tag }))}
                    >
                      {tag.replace("#", "").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Aantal winnaars</label>
              <div className="number-input">
                {[1,2,3,5,10].map(n => (
                  <button
                    key={n}
                    className={`number-btn ${reveal.count === n ? "selected" : ""}`}
                    onClick={() => setReveal(p => ({ ...p, count: n }))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setReveal(p => ({ ...p, show: false }))}>Annuleer</button>
              {reveal.numeric ? (
                <button className="btn-primary" onClick={doRevealNumber} disabled={reveal.correctValue===""||reveal.correctValue==null}>
                  <Icons.check /> Bereken winnaars
                </button>
              ) : (
                <button className="btn-primary" onClick={doReveal} disabled={!reveal.correctTag}>
                  <Icons.check /> Onthullen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reveal result */}
      {revealResult && (
        <div className="card result-card">
          <div className="card-header">
            <h3>🏆 Resultaat</h3>
            <button className="btn-icon" onClick={() => { setRevealResult(null); setAnnounceSent(false); }}><Icons.x /></button>
          </div>
          {revealResult.numeric ? (
            <>
              <div className="result-correct">Juiste waarde: <strong>{revealResult.correctValue}</strong></div>
              <div className="result-total">{revealResult.winners?.length} winnaars · {revealResult.total} deelnemers</div>
              <div className="result-section-label">🏆 Dichtst bij</div>
              <div className="winners-list">
                {revealResult.winners?.length === 0 && <div className="empty">Geen deelnemers</div>}
                {revealResult.winners?.map((w, i) => (
                  <div key={i} className="winner-row">
                    <span className="winner-rank">{["🥇","🥈","🥉"][i] || `#${i+1}`}</span>
                    <span className="winner-name">{w.username ? "@"+w.username : w.first_name}</span>
                    <span className="winner-guess">gok: {w.guess_value}</span>
                    <span className="winner-diff">±{w.diff}</span>
                    {w.uid && <span className="winner-uid">{w.uid}</span>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="result-correct">Juiste antwoord: <strong>{revealResult.correct?.replace("#","").toUpperCase()}</strong></div>
              <div className="result-total">{revealResult.winners?.length} winnaars · {revealResult.total} stemmen totaal</div>
              {revealResult.tally && (
                <div className="result-tally">
                  {revealResult.tally.map(t => {
                    const pct = revealResult.total > 0 ? Math.round((t.count/revealResult.total)*100) : 0;
                    return (
                      <div key={t.tag} className="result-tally-row">
                        <span className="rt-tag" style={{color: t.tag===revealResult.correct?"var(--green)":"var(--text-2)"}}>
                          {t.tag.replace("#","").toUpperCase()}{t.tag===revealResult.correct?" ✓":""}
                        </span>
                        <div className="rt-bar-wrap"><div className="rt-bar" style={{width:pct+"%", background:t.tag===revealResult.correct?"var(--green)":"var(--yellow)"}}/></div>
                        <span className="rt-count">{t.count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="result-section-label">🏆 Winnaars</div>
              <div className="winners-list">
                {revealResult.winners?.length === 0 && <div className="empty">Niemand had het juiste antwoord</div>}
                {revealResult.winners?.map((w, i) => (
                  <div key={i} className="winner-row">
                    <span className="winner-rank">{["🥇","🥈","🥉"][i] || `#${i+1}`}</span>
                    <span className="winner-name">{w.username ? "@"+w.username : w.first_name}</span>
                    {w.uid && <span className="winner-uid">UID: {w.uid}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Editable announcement */}
          <div className="result-section-label">📢 Aankondiging naar de groep</div>
          <div className="announce-hint">Tip: gebruik <code>{"{winner}"}</code> om de winnaar te taggen. Dit bericht gaat naar de groep.</div>
          <textarea
            className="input"
            rows={6}
            placeholder="Typ je aankondiging..."
            value={announceTxt}
            onChange={e => setAnnounceTxt(e.target.value)}
          />
          <PhotoAttach photo={announcePhoto} setPhoto={setAnnouncePhoto} />
          {announceSent ? (
            <div className="announce-confirm">✅ Verstuurd naar de groep!</div>
          ) : (
            <button className="btn-primary" onClick={openAnnouncePreview} disabled={announcing || (!announceTxt.trim() && !announcePhoto)} style={{marginTop:"0.5rem"}}>
              <Icons.send /> Voorbeeld & versturen
            </button>
          )}
        </div>
      )}

      {/* Announce preview popup */}
      <TelegramPreview
        open={announcePreview}
        title="Voorbeeld aankondiging"
        text={announceTxt}
        photo={announcePhoto}
        note="Wordt direct in de groep geplaatst"
        confirmLabel="Versturen"
        sending={announcing}
        onConfirm={announce}
        onCancel={() => setAnnouncePreview(false)}
      />

      {/* Voters sidebar */}
      {selected && voters && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setVoters(null); }}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{voters.numeric ? "Antwoorden" : "Stemmen"} — "{selected.question}"</h3>
              <button className="btn-icon" onClick={() => { setSelected(null); setVoters(null); }}><Icons.x /></button>
            </div>
            {voters.numeric ? (
              <>
                <div className="numeric-info">
                  {voters.total} deelnemers{selected.correct_value != null ? ` · juiste waarde: ${selected.correct_value}` : " · nog geen juiste waarde ingevuld"}
                </div>
                <div className="voters-list">
                  {voters.voters?.map((v, i) => (
                    <div key={v.user_id} className="voter-row">
                      {selected.correct_value != null && <span className="voter-rank">#{i+1}</span>}
                      <span className="voter-guess">{v.guess_value}</span>
                      <span className="voter-name">{v.username ? "@"+v.username : v.first_name}</span>
                      {v.diff != null && <span className="voter-diff">±{v.diff}</span>}
                      {v.uid && <span className="voter-uid">{v.uid}</span>}
                    </div>
                  ))}
                  {voters.voters?.length === 0 && <div className="empty">Nog geen antwoorden</div>}
                </div>
              </>
            ) : (
              <>
                <div className="voters-tally">
                  {selected.tally.map(t => {
                    const pct = selected.total > 0 ? Math.round((t.count / selected.total) * 100) : 0;
                    return (
                      <div key={t.tag} className="tally-row">
                        <span className="tally-tag">{t.tag.replace("#","").toUpperCase()}</span>
                        <div className="tally-bar-wrap">
                          <div className="tally-bar" style={{ width: pct + "%" }} />
                        </div>
                        <span className="tally-count">{t.count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
                <div className="voters-list">
                  {voters.voters?.map(v => (
                    <div key={v.user_id} className="voter-row">
                      <span className="voter-tag">{v.tag?.replace("#","").toUpperCase()}</span>
                      <span className="voter-name">{v.username ? "@"+v.username : v.first_name}</span>
                      {v.uid && <span className="voter-uid">{v.uid}</span>}
                      <span className="voter-time">{new Date(v.voted_at).toLocaleTimeString("nl-NL")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Predictions list */}
      <div className="predictions-list">
        {predictions.map(q => {
          const isNumeric = q.question_type === "number";
          const isCalendar = q.source === "calendar";
          return (
          <div key={q.id} className={`prediction-card ${q.closed === 0 ? "active" : ""}`}>
            <div className="pred-header">
              <div className="pred-status">
                {q.closed === 0 ? <span className="badge badge-green">Actief</span>
                 : q.closed === 2 ? <span className="badge badge-yellow">Gepland</span>
                 : (q.correct_tag || q.correct_value != null) ? <span className="badge badge-blue">Onthuld</span>
                 : <span className="badge badge-gray">Gesloten</span>}
                {isNumeric && <span className="badge badge-purple">🔢 Getal</span>}
                {isCalendar && <span className="badge badge-cal">📅 Kalender</span>}
                {q.sent_status === "failed" && <span className="send-dot failed">● Niet geplaatst</span>}
                {q.sent_status === "posted" && q.closed === 0 && <span className="send-dot posted">● Geplaatst</span>}
              </div>
              <div className="pred-week">{q.week}</div>
            </div>
            <div className="pred-question">"{q.question}"</div>
            {q.prize && <div className="pred-prize">🏆 {q.prize}</div>}
            <div className="pred-tags">
              {q.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div className="pred-stats">
              <span>{q.total} {isNumeric ? "antwoorden" : "stemmen"}</span>
              {q.correct_tag && <span className="correct-tag">✅ {q.correct_tag.replace("#","").toUpperCase()}</span>}
              {q.correct_value != null && <span className="correct-tag">✅ {q.correct_value}</span>}
            </div>
            {!isNumeric && (
              <div className="pred-tally">
                {q.tally.map(t => {
                  const pct = q.total > 0 ? Math.round((t.count / q.total) * 100) : 0;
                  return (
                    <div key={t.tag} className="mini-tally">
                      <span>{t.tag.replace("#","").toUpperCase()}</span>
                      <div className="mini-bar-wrap">
                        <div className="mini-bar" style={{ width: pct + "%", background: t.tag === q.correct_tag ? "#02C076" : "#F7A600" }} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="pred-actions">
              {isCalendar ? (
                <span className="cal-managed-hint">Beheer deze via de Content Kalender →</span>
              ) : (
                <>
                  <button className="btn-sm" onClick={() => viewVoters(q)}>
                    <Icons.eye /> {isNumeric ? "Antwoorden" : "Stemmen"}
                  </button>
                  {q.closed === 0 && (
                    <button className="btn-sm btn-primary" onClick={() => setReveal({ show: true, qId: q.id, tags: q.tags, count: 3, correctTag: "", correctValue: "", numeric: isNumeric })}>
                      <Icons.trophy /> {isNumeric ? "Winnaars" : "Onthullen"}
                    </button>
                  )}
                  {q.closed === 2 && (
                    <button className="btn-sm btn-primary" onClick={() => openEditPrediction(q)}>
                      <Icons.edit /> Bekijk & bewerk
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );})}
        {predictions.length === 0 && <div className="empty">Nog geen predicties aangemaakt</div>}
      </div>

      {/* Edit scheduled prediction modal */}
      {editPred && (
        <div className="modal-overlay" onClick={() => setEditPred(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ingeplande predictie bewerken</h3>
              <button className="btn-icon" onClick={() => setEditPred(null)}><Icons.x /></button>
            </div>
            <div className="tg-chat-bg" style={{marginBottom:"14px"}}>
              <div className="tg-bubble">
                <div className="tg-bubble-name">Bybit EU Bot</div>
                <div className="tg-bubble-text">{buildEditPredPreview(editPred)}</div>
              </div>
            </div>
            <div className="form-group">
              <label>Vraag</label>
              <input className="input" value={editPred.question} onChange={e => setEditPred(p=>({...p,question:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Stemopties</label>
              <input className="input" value={editPred.tags} onChange={e => setEditPred(p=>({...p,tags:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Prijs (optioneel)</label>
              <input className="input" value={editPred.prize} onChange={e => setEditPred(p=>({...p,prize:e.target.value}))} />
            </div>
            <div className="modal-actions" style={{justifyContent:"space-between"}}>
              <button className="btn-danger-text" onClick={() => { deletePrediction(editPred.id); setEditPred(null); }}>Verwijder</button>
              <div style={{display:"flex",gap:"8px"}}>
                <button className="btn-secondary" onClick={saveEditPred}>Opslaan</button>
                <button className="btn-primary" onClick={postPredNow}><Icons.send /> Nu plaatsen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard Tab ────────────────────────────────────────────────────
function LeaderboardTab() {
  const [data, setData]     = useState({ leaderboard: [], availableWeeks: [] });
  const [week, setWeek]     = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (w) => {
    setLoading(true);
    const r = await api("/api/leaderboard" + (w ? "?week=" + w : ""));
    setData(r);
    setWeek(r.week);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Activiteit</h2>
        <select className="select" value={week} onChange={e => load(e.target.value)}>
          {data.availableWeeks.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Laden...</div> : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Gebruiker</th>
                <th>Bybit UID</th>
                <th>Berichten</th>
                <th>Reacties</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((u, i) => (
                <tr key={u.user_id} className={i < 3 ? "top-row" : ""}>
                  <td><span className="rank-badge">{i < 3 ? ["🥇","🥈","🥉"][i] : i+1}</span></td>
                  <td><span className="user-name">{u.username ? "@"+u.username : u.first_name || "—"}</span></td>
                  <td><span className="uid-cell">{u.uid || "—"}</span></td>
                  <td><strong>{u.message_count}</strong></td>
                  <td>{u.reaction_count || 0}</td>
                </tr>
              ))}
              {data.leaderboard.length === 0 && (
                <tr><td colSpan={5} className="empty">Geen activiteit voor deze week</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Feedback Tab ───────────────────────────────────────────────────────
function FeedbackTab() {
  const [sessions, setSessions]   = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selected, setSelected]   = useState(new Set());
  const [winners, setWinners]     = useState(null);
  const [count, setCount]         = useState(3);
  const [loading, setLoading]     = useState(true);
  const [starting, setStarting]   = useState(false);
  const [duration, setDuration]   = useState(1);
  const [viewSession, setViewSession] = useState(null);
  const [fbPrize, setFbPrize]             = useState("");
  const [fbAnnounceTxt, setFbAnnounceTxt] = useState("");
  const [fbPreview, setFbPreview]         = useState(false);
  const [fbSending, setFbSending]         = useState(false);
  const [fbAnnounceSent, setFbAnnounceSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sr, fr] = await Promise.all([api("/api/feedback/sessions"), api("/api/feedback")]);
    setSessions(sr.sessions || []);
    setFeedbacks(fr.feedbacks || []);
    setActiveSession((sr.sessions || []).find(s => s.active));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startSession() {
    setStarting(true);
    await api("/api/feedback/start-session", { method:"POST", body: JSON.stringify({ durationDays: duration }) });
    setStarting(false);
    load();
  }

  async function closeSession() {
    await api("/api/feedback/close-session", { method:"POST", body: JSON.stringify({}) });
    load();
  }

  function toggleSelect(id) {
    setSelected(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  async function pickWinners() {
    const ids = selected.size > 0 ? [...selected] : [];
    const r = await api("/api/feedback/pick-winners", { method:"POST", body: JSON.stringify({ count, ids }) });
    setWinners(r.winners);
    setFbAnnounceSent(false);
    // Auto-fill the announcement text
    const prizeLine = fbPrize ? ` Jullie winnen elk *${fbPrize}*!` : "";
    setFbAnnounceTxt(`💡 *Bedankt voor alle feedback!*\n\nWe hebben alle inzendingen doorgenomen en de winnaars zijn:\n\n{winners}\n\nGefeliciteerd!${prizeLine} 🎉\n\nDM ons om je prijs te claimen!`);
  }

  // Build the preview text with the prize line kept in sync
  function buildFbAnnounce() {
    let txt = fbAnnounceTxt;
    // Show {winners} as readable names in the preview
    if (winners && winners.length) {
      const names = winners.map(w => w.username ? "@"+w.username : w.first_name).join(", ");
      txt = txt.replace(/\{winners\}/g, names);
    }
    return txt;
  }

  async function announceFbWinners() {
    if (!winners || !winners.length) return;
    setFbSending(true);
    // Append prize line if the user set a prize but didn't include it in the text
    let msg = fbAnnounceTxt;
    const winnerIds = winners.map(w => w.user_id).filter(Boolean);
    const r = await api("/api/feedback/announce-winners", {
      method: "POST",
      body: JSON.stringify({ message: msg, winnerIds, prize: fbPrize || null }),
    });
    setFbSending(false);
    setFbPreview(false);
    if (r?.sent_status === "failed" || r?.error) {
      alert("Het bericht kon niet worden verstuurd: " + (r?.error || "onbekende fout"));
    } else {
      setFbAnnounceSent(true);
    }
  }

  function exportSession(sessionId) {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const API_KEY  = import.meta.env.VITE_API_KEY  || "bybit-dashboard-key";
    window.open(`${API_BASE}/api/feedback/export/${sessionId}?key=${API_KEY}`, '_blank');
  }

  const displayFeedbacks = viewSession
    ? feedbacks.filter(f => {
        const s = sessions.find(s => s.id === viewSession);
        if (!s) return true;
        return f.submitted_at >= s.started_at && (!s.closed_at || f.submitted_at <= s.closed_at);
      })
    : feedbacks;

  const DURATION_OPTIONS = [
    { days: 1, label: "1 dag" },
    { days: 2, label: "2 dagen" },
    { days: 3, label: "3 dagen" },
    { days: 5, label: "5 dagen" },
    { days: 7, label: "1 week" },
  ];

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Feedback</h2>
        <button className="btn-icon" onClick={load}><Icons.refresh /></button>
      </div>

      {/* Active session or start new */}
      {activeSession ? (
        <div className="card feedback-active-card">
          <div className="fa-left">
            <div className="fa-badge">💡 FEEDBACK OPEN</div>
            <div className="fa-title">Actieve feedback sessie</div>
            <div className="fa-meta">
              Gestart: {new Date(activeSession.started_at).toLocaleString("nl-NL")}
            </div>
            <div className="fa-meta">
              Sluit automatisch: <strong>{new Date(activeSession.ends_at).toLocaleString("nl-NL")}</strong>
            </div>
            <div className="fa-count">{activeSession.count} inzendingen</div>
          </div>
          <div className="fa-actions">
            <button className="btn-secondary" onClick={() => exportSession(activeSession.id)}>
              <Icons.send /> Exporteer CSV
            </button>
            <button className="btn-sm btn-danger-outline" onClick={closeSession}>
              Sluit vroeg
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><h3>Nieuwe feedback sessie starten</h3></div>
          <div className="duration-select">
            <div className="form-group">
              <label>Hoe lang mag feedback ingestuurd worden?</label>
              <div className="duration-options">
                {DURATION_OPTIONS.map(o => (
                  <button
                    key={o.days}
                    className={`duration-btn ${duration===o.days?"selected":""}`}
                    onClick={() => setDuration(o.days)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={startSession} disabled={starting}>
              {starting ? "Starten..." : <><Icons.check /> Start feedback sessie</>}
            </button>
          </div>
        </div>
      )}

      {/* Sessions history */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Feedback sessies</h3></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Gestart</th>
                <th>Gesloten</th>
                <th>Inzendingen</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className={viewSession===s.id?"selected-row":""}>
                  <td>{s.duration_days} {s.duration_days===1?"dag":"dagen"}</td>
                  <td>{new Date(s.started_at).toLocaleDateString("nl-NL")}</td>
                  <td>{s.closed_at ? new Date(s.closed_at).toLocaleDateString("nl-NL") : "—"}</td>
                  <td><strong>{s.count}</strong></td>
                  <td>{s.active ? <span className="badge badge-yellow">Open</span> : <span className="badge badge-gray">Gesloten</span>}</td>
                  <td>
                    <div style={{display:"flex",gap:"6px"}}>
                      <button className="btn-sm" onClick={() => setViewSession(viewSession===s.id?null:s.id)}>
                        <Icons.eye /> {viewSession===s.id?"Verberg":"Bekijk"}
                      </button>
                      <button className="btn-sm" onClick={() => exportSession(s.id)}>
                        ↓ CSV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Winner picker */}
      <div className="card winner-controls">
        <div className="winner-ctrl-row">
          <div>
            <div className="ctrl-label">Winnaars kiezen</div>
            <div className="ctrl-desc">{selected.size > 0 ? `${selected.size} geselecteerd` : "Willekeurig uit huidige weergave"}</div>
          </div>
          <div className="number-input">
            {[1,2,3,5].map(n => (
              <button key={n} className={`number-btn ${count===n?"selected":""}`} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={pickWinners}><Icons.shuffle /> Kies winnaars</button>
        </div>
        {winners && (
          <div className="winners-result">
            <div className="winners-title">🎉 Geselecteerde winnaars</div>
            {winners.map((w,i) => (
              <div key={i} className="winner-row">
                <span className="winner-rank">{["🥇","🥈","🥉"][i]||`#${i+1}`}</span>
                <span className="winner-name">{w.username?"@"+w.username:w.first_name}</span>
                {w.uid && <span className="winner-uid">UID: {w.uid}</span>}
                <span className="winner-msg">"{w.message}"</span>
              </div>
            ))}

            {/* Announce to group */}
            <div className="fb-announce">
              <div className="result-section-label">🏆 Prijs & aankondiging</div>
              <div className="form-group">
                <label>Prijs per winnaar (optioneel)</label>
                <input className="input" placeholder="Bijv. 10 USDC" value={fbPrize} onChange={e => {
                  const newPrize = e.target.value;
                  setFbPrize(newPrize);
                  const prizeLine = newPrize ? ` Jullie winnen elk *${newPrize}*!` : "";
                  setFbAnnounceTxt(`\u{1F4A1} *Bedankt voor alle feedback!*\n\nWe hebben alle inzendingen doorgenomen en de winnaars zijn:\n\n{winners}\n\nGefeliciteerd!${prizeLine} \u{1F389}\n\nDM ons om je prijs te claimen!`);
                }} />
              </div>
              <div className="form-group">
                <label>Bericht naar de groep</label>
                <div className="announce-hint">Gebruik <code>{"{winners}"}</code> om de winnaars te taggen.</div>
                <textarea className="input" rows={5} value={fbAnnounceTxt} onChange={e => setFbAnnounceTxt(e.target.value)} />
              </div>
              {fbAnnounceSent ? (
                <div className="announce-confirm">✅ Verstuurd naar de groep!</div>
              ) : (
                <button className="btn-primary" onClick={() => setFbPreview(true)} disabled={!fbAnnounceTxt.trim()}>
                  <Icons.send /> Voorbeeld & versturen
                </button>
              )}
            </div>

            <button className="btn-sm" style={{marginTop:"8px"}} onClick={() => { setWinners(null); setFbAnnounceSent(false); }}>Sluiten</button>
          </div>
        )}
      </div>

      {/* Feedback winner announcement preview */}
      <TelegramPreview
        open={fbPreview}
        title="Voorbeeld feedback-aankondiging"
        text={buildFbAnnounce()}
        note="Wordt direct in de groep geplaatst"
        confirmLabel="Versturen"
        sending={fbSending}
        onConfirm={announceFbWinners}
        onCancel={() => setFbPreview(false)}
      />

      {/* Feedback list */}
      {loading ? <div className="loading">Laden...</div> : (
        <div className="card">
          {viewSession && <div className="session-filter-bar">Weergave: sessie #{viewSession} — <button className="btn-link" onClick={() => setViewSession(null)}>Toon alles</button></div>}
          <div className="feedback-list">
            {displayFeedbacks.map(f => (
              <div key={f.id} className={`feedback-row ${selected.has(f.id)?"selected":""}`} onClick={() => toggleSelect(f.id)}>
                <div className="feedback-check">
                  {selected.has(f.id) ? <Icons.check /> : <div className="check-empty" />}
                </div>
                <div className="feedback-body">
                  <div className="feedback-msg">"{f.message}"</div>
                  <div className="feedback-meta">
                    <span>{f.username?"@"+f.username:f.first_name}</span>
                    {f.uid && <span>UID: {f.uid}</span>}
                    <span>{new Date(f.submitted_at).toLocaleDateString("nl-NL")}</span>
                  </div>
                </div>
              </div>
            ))}
            {displayFeedbacks.length === 0 && <div className="empty">Geen feedback gevonden</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/users").then(r => { setUsers(r.users || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    !search || (u.username||"").toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (u.uid||"").includes(search)
  );

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Gebruikers</h2>
        <input className="input search-input" placeholder="Zoek op naam of UID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading">Laden...</div> : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Username</th>
                <th>Bybit UID</th>
                <th>Berichten</th>
                <th>Lid sinds</th>
                <th>Laatste activiteit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.user_id}>
                  <td>{u.first_name || "—"}</td>
                  <td>{u.username ? "@"+u.username : "—"}</td>
                  <td><span className={`uid-cell ${u.uid ? "has-uid" : ""}`}>{u.uid || "—"}</span></td>
                  <td><strong>{u.total_messages}</strong></td>
                  <td>{u.first_seen?.slice(0,10)}</td>
                  <td>{u.last_seen?.slice(0,10)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="empty">Geen gebruikers gevonden</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Chat Log Tab ──────────────────────────────────────────────────────────
function ChatLogTab() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]       = useState("public");
  const limit = 50;

  const load = useCallback(async (p=0, q="") => {
    setLoading(true);
    const r = await api(`/api/chatlog?limit=${limit}&offset=${p*limit}${q ? "&search="+encodeURIComponent(q) : ""}`);
    setLogs(r.logs || []);
    setTotal(r.total || 0);
    setMode(r.mode || "public");
    setPage(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeMode(newMode) {
    setMode(newMode);
    await api("/api/chatlog/mode", { method: "POST", body: JSON.stringify({ mode: newMode }) });
    load(0, search);
  }

  const typeIcon = { text: "💬", photo: "📸", sticker: "🎭", voice: "🎤" };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Chat Log</h2>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <span className="log-info">Auto-delete na 30 dagen</span>
          <input
            className="input search-input"
            placeholder="Zoeken in berichten..."
            value={search}
            onChange={e => { setSearch(e.target.value); load(0, e.target.value); }}
          />
          <button className="btn-icon" onClick={() => load(page, search)}><Icons.refresh /></button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="card chatlog-mode-card">
        <div className="cml-info">
          <div className="cml-title">Wat wordt gelogd?</div>
          <div className="cml-desc">
            {mode === "public"
              ? "Alle berichten in de groep worden gelogd."
              : "Alleen berichten van leden die meedoen aan een predictie, quiz of feedback worden gelogd."}
          </div>
        </div>
        <div className="chatlog-mode-toggle">
          <button className={`cml-btn ${mode==="public"?"selected":""}`} onClick={() => changeMode("public")}>
            🌐 Public
          </button>
          <button className={`cml-btn ${mode==="activity"?"selected":""}`} onClick={() => changeMode("activity")}>
            🎯 Alleen activiteit
          </button>
        </div>
      </div>

      <div className="card">
        <div className="log-stats">
          <span>{total} berichten opgeslagen</span>
          <span>Toont {logs.length} van {total}</span>
        </div>
        {loading ? <div className="loading">Laden...</div> : (
          <div className="log-list">
            {logs.map(l => (
              <div key={l.id} className="log-row">
                <div className="log-type">{typeIcon[l.message_type] || "💬"}</div>
                <div className="log-body">
                  <div className="log-user">
                    {l.username ? "@"+l.username : l.first_name || "Gebruiker"}
                  </div>
                  <div className="log-text">{l.message_text || <em style={{color:"var(--text-3)"}}>Geen tekst</em>}</div>
                </div>
                <div className="log-time">{new Date(l.sent_at).toLocaleString("nl-NL", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            ))}
            {logs.length === 0 && <div className="empty">Geen berichten gevonden</div>}
          </div>
        )}
        {total > limit && (
          <div className="pagination">
            <button className="btn-sm" disabled={page===0} onClick={() => load(page-1, search)}>← Vorige</button>
            <span>Pagina {page+1} van {Math.ceil(total/limit)}</span>
            <button className="btn-sm" disabled={(page+1)*limit >= total} onClick={() => load(page+1, search)}>Volgende →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Roles Tab ──────────────────────────────────────────────────────────
function RolesTab() {
  const [roles, setRoles]   = useState([]);
  const [form, setForm]     = useState({ userId: "", username: "", role: "mod", mode: "preset", permissions: {} });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await api("/api/roles");
    setRoles(r.roles || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const PERMISSIONS = [
    { key: "predictions",  label: "Predicties aanmaken & onthullen" },
    { key: "calendar",     label: "Content kalender beheren" },
    { key: "feedback",     label: "Feedback sessies beheren" },
    { key: "automessages", label: "Automatische berichten sturen" },
    { key: "templates",    label: "Berichtsjablonen aanpassen" },
    { key: "roles",        label: "Rollen & rechten beheren" },
    { key: "view",         label: "Statistieken & leaderboard bekijken" },
  ];

  async function addRole() {
    if (!form.userId.trim()) return;
    const payload = {
      userId: form.userId, username: form.username, role: form.role,
      permissions: form.mode === "custom" ? form.permissions : null,
    };
    await api("/api/roles", { method: "POST", body: JSON.stringify(payload) });
    setForm({ userId: "", username: "", role: "mod", mode: "preset", permissions: {} });
    load();
  }

  async function removeRole(userId) {
    await api("/api/roles/" + userId, { method: "DELETE" });
    load();
  }

  const ROLE_LABELS = { owner: "Owner 👑", mod: "Moderator 🛡️", viewer: "Viewer 👁️", custom: "Custom ⚙️" };
  const ROLE_PERMS  = {
    owner:  ["Alles beheren", "Predicties aanmaken & onthullen", "Feedback beheren", "Rollen beheren", "Bot instellingen"],
    mod:    ["Predicties aanmaken & onthullen", "Content kalender beheren", "Feedback beheren", "Auto berichten sturen"],
    viewer: ["Statistieken bekijken", "Leaderboard bekijken"],
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Rollen & Rechten</h2>
      </div>

      <div className="roles-grid">
        {Object.entries(ROLE_PERMS).map(([role, perms]) => (
          <div key={role} className="role-card">
            <div className="role-title">{ROLE_LABELS[role]}</div>
            <ul className="role-perms">
              {perms.map(p => <li key={p}><Icons.check /> {p}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><h3>Rol toevoegen</h3></div>
        <div className="add-role-form">
          <input className="input" placeholder="Telegram User ID" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} />
          <input className="input" placeholder="@username (optioneel)" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
        </div>

        <div className="role-mode-toggle" style={{marginTop:"12px"}}>
          <button className={`rmt-btn ${form.mode==="preset"?"selected":""}`} onClick={() => setForm(p=>({...p,mode:"preset"}))}>Vaste rol</button>
          <button className={`rmt-btn ${form.mode==="custom"?"selected":""}`} onClick={() => setForm(p=>({...p,mode:"custom"}))}>⚙️ Custom rechten</button>
        </div>

        {form.mode === "preset" ? (
          <div className="form-group">
            <label>Rol</label>
            <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="mod">Moderator (kan alles aanmaken)</option>
              <option value="viewer">Viewer (alleen bekijken)</option>
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label>Kies precies wat deze persoon mag</label>
            <div className="perm-grid">
              {PERMISSIONS.map(perm => (
                <div key={perm.key} className="perm-row">
                  <label htmlFor={"perm-"+perm.key}>{perm.label}</label>
                  <input
                    id={"perm-"+perm.key}
                    className="perm-toggle"
                    type="checkbox"
                    checked={!!form.permissions[perm.key]}
                    onChange={e => setForm(p => ({ ...p, permissions: { ...p.permissions, [perm.key]: e.target.checked } }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={addRole} style={{marginTop:"8px"}}><Icons.plus /> Toevoegen</button>
      </div>

      {loading ? <div className="loading">Laden...</div> : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Gebruiker</th><th>Rol</th><th>Rechten</th><th>Toegevoegd</th><th></th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.user_id}>
                  <td>{r.username || r.user_id}</td>
                  <td><span className="role-badge">{ROLE_LABELS[r.role] || r.role}</span></td>
                  <td style={{fontSize:"11px",color:"var(--text-3)"}}>
                    {r.permissions ? Object.keys(r.permissions).filter(k=>r.permissions[k]).join(", ") || "geen" : "standaard"}
                  </td>
                  <td>{r.created_at?.slice(0,10)}</td>
                  <td><button className="btn-icon btn-danger" onClick={() => removeRole(r.user_id)}><Icons.x /></button></td>
                </tr>
              ))}
              {roles.length === 0 && <tr><td colSpan={5} className="empty">Nog geen rollen ingesteld</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────
// ── Content Calendar Tab ────────────────────────────────────────────────
function CalendarTab() {
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
  const [month, setMonth]       = useState(todayStr.slice(0,7));
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedDay, setSelectedDay] = useState(null); // "YYYY-MM-DD"
  const [form, setForm]         = useState({ type:"quiz", questionType:"tags", question:"", tags:"", prizeAmount:"", prizeCurrency:"USDC", teaserMinutes:20, time:"18:00" });
  const [winnerModal, setWinnerModal] = useState(null);
  const [winnerData, setWinnerData]   = useState(null);
  const [correctTag, setCorrectTag]   = useState("");
  const [correctValue, setCorrectValue] = useState("");
  const [calPhoto, setCalPhoto]       = useState(null);
  const [calPreview, setCalPreview]   = useState(null);
  const [calPosting, setCalPosting]   = useState(false);
  const [editEvent, setEditEvent]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api(`/api/calendar?month=${month}`);
    setEvents(r.events || []);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDay = (new Date(y, m-1, 1).getDay() + 6) % 7; // Monday-first
  const monthName = new Date(y, m-1, 1).toLocaleDateString("nl-NL", { month:"long", year:"numeric" });

  function eventsForDay(day) {
    const dateStr = `${month}-${String(day).padStart(2,"0")}`;
    return events.filter(e => e.event_date === dateStr);
  }

  function changeMonth(delta) {
    // Build YYYY-MM string without timezone drift
    let ny = y, nm = m + delta;
    if (nm < 1) { nm = 12; ny--; }
    if (nm > 12) { nm = 1; ny++; }
    setMonth(`${ny}-${String(nm).padStart(2,"0")}`);
    setSelectedDay(null);
  }

  function selectDay(day) {
    const dateStr = `${month}-${String(day).padStart(2,"0")}`;
    setSelectedDay(dateStr);
    setForm({ type:"quiz", questionType:"tags", question:"", tags:"", prizeAmount:"", prizeCurrency:"USDC", teaserMinutes:20, time:"18:00" });
  }

  function buildCalPreview(f) {
    const tags = (f.tags||"").split(/[\s,]+/).filter(Boolean).map(t => t.startsWith("#") ? t : "#"+t);
    const prize = f.prizeAmount ? `${f.prizeAmount} ${f.prizeCurrency||"USDC"}` : "";
    if ((f.questionType||"tags") === "number") {
      const tagWord = tags[0] || "#prijs";
      return `🔢 *${f.question}*${prize?`\n\n🏆 Win ${prize}!`:""}\n\nStuur je antwoord met ${tagWord}, bijv: ${tagWord} 67500\n\nWie het dichtst zit wint!`;
    }
    return `🎯 *VRAAG TIJD!*${prize?` Win ${prize}! 💰`:""}\n\n"${f.question}"\n\nStem met: ${tags.join("  ")}\n\nTyp je keuze in een bericht!`;
  }

  function openCreatePreview(postNow) {
    if (!form.question.trim() || !form.tags.trim()) return;
    setCalPreview({ mode: postNow ? "now" : "schedule", form: { ...form }, photo: calPhoto });
  }

  async function confirmCreate() {
    const postNow = calPreview.mode === "now";
    setCalPosting(true);
    const tags = form.tags.split(/[\s,]+/).filter(Boolean);
    const scheduledTime = new Date(`${selectedDay}T${form.time}:00`).toISOString();
    await api("/api/calendar/create", {
      method:"POST",
      body: JSON.stringify({
        eventDate: selectedDay, question: form.question, tags,
        prizeAmount: form.prizeAmount, prizeCurrency: form.prizeCurrency,
        teaserMinutes: parseInt(form.teaserMinutes), scheduledTime,
        eventType: form.type, questionType: form.questionType || "tags",
        postNow,
      })
    });
    if (postNow && calPhoto) await uploadPhoto(calPhoto, "", null);
    setCalPosting(false);
    setCalPreview(null);
    setForm(p => ({ ...p, question:"", tags:"", prizeAmount:"" }));
    setCalPhoto(null);
    load();
  }

  // Open a scheduled event for editing
  function openEdit(ev) {
    setEditEvent({
      id: ev.id,
      type: ev.event_type || "quiz",
      questionType: ev.question_type || "tags",
      question: ev.question,
      tags: (ev.tags || JSON.parse(ev.valid_tags || "[]")).join(" "),
      prizeAmount: ev.prize_amount || "",
      prizeCurrency: ev.prize_currency || "USDC",
      teaserMinutes: ev.teaser_minutes ?? 20,
      time: ev.scheduled_time ? new Date(ev.scheduled_time).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}) : "18:00",
      scheduledTime: ev.scheduled_time,
      event_date: ev.event_date,
    });
  }

  async function saveEdit() {
    const tags = editEvent.tags.split(/[\s,]+/).filter(Boolean);
    const scheduledTime = new Date(`${editEvent.event_date}T${editEvent.time}:00`).toISOString();
    await api(`/api/calendar/${editEvent.id}`, {
      method: "PUT",
      body: JSON.stringify({
        question: editEvent.question, tags,
        prizeAmount: editEvent.prizeAmount, prizeCurrency: editEvent.prizeCurrency,
        teaserMinutes: parseInt(editEvent.teaserMinutes), scheduledTime,
        eventType: editEvent.type, questionType: editEvent.questionType,
      })
    });
    setEditEvent(null);
    load();
  }

  async function postScheduledNow() {
    await api(`/api/calendar/${editEvent.id}/post-now`, { method: "POST" });
    setEditEvent(null);
    load();
  }

  async function createEvent(postNow = false) {
    // kept for backwards-compat; routed through preview
    openCreatePreview(postNow);
  }

  async function deleteEvent(id) {
    if (!confirm("Dit event verwijderen?")) return;
    await api(`/api/calendar/${id}`, { method:"DELETE" });
    load();
  }

  async function openWinner(ev) {
    setWinnerModal(ev);
    setCorrectTag("");
    setCorrectValue("");
    setWinnerData(null);
    // For numeric quizzes, load all answers right away (no "enter correct value" step)
    if ((ev.question_type || "tags") === "number") {
      const r = await api(`/api/calendar/${ev.id}/pick-winner`, { method:"POST", body: JSON.stringify({}) });
      setWinnerData({
        numeric: true,
        correctVoters: Array.isArray(r?.correctVoters) ? r.correctVoters : [],
        totalCorrect: r?.totalCorrect ?? 0,
      });
    }
  }

  async function pickWinner() {
    // Only used for tag-based quizzes (pick the correct tag, then see who voted it)
    if (!correctTag) return;
    const r = await api(`/api/calendar/${winnerModal.id}/pick-winner`, {
      method:"POST",
      body: JSON.stringify({ correctTag }),
    });
    setWinnerData({
      numeric: false,
      correctVoters: Array.isArray(r?.correctVoters) ? r.correctVoters : [],
      totalCorrect: r?.totalCorrect ?? 0,
    });
  }

  async function confirmWinner(userId, announce) {
    const r = await api(`/api/calendar/${winnerModal.id}/confirm-winner`, {
      method:"POST",
      body: JSON.stringify({ correctTag, correctValue, winnerUserId: userId, announce }),
    });
    if (announce && r?.sent_status === "failed") {
      alert("De winnaar is opgeslagen, maar het bericht kon niet naar de groep worden gestuurd. Probeer het opnieuw of plaats handmatig.");
    }
    setWinnerModal(null); setWinnerData(null); load();
  }

  const selectedDayEvents = selectedDay ? events.filter(e => e.event_date === selectedDay) : [];
  // All this month's events sorted by scheduled time (for the timeline panel)
  const upcomingEvents = [...events].sort((a, b) => {
    const ta = a.scheduled_time ? new Date(a.scheduled_time).getTime() : new Date(a.event_date).getTime();
    const tb = b.scheduled_time ? new Date(b.scheduled_time).getTime() : new Date(b.event_date).getTime();
    return ta - tb;
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Content Kalender</h2>
        <div className="cal-nav">
          <button className="btn-icon" onClick={() => changeMonth(-1)}>←</button>
          <span className="cal-month">{monthName}</span>
          <button className="btn-icon" onClick={() => changeMonth(1)}>→</button>
        </div>
      </div>

      <div className="cal-layout with-panel">
        {/* Calendar grid */}
        {loading ? <div className="loading">Laden...</div> : (
          <div className="calendar-grid">
            {["Ma","Di","Wo","Do","Vr","Za","Zo"].map(d => (
              <div key={d} className="cal-weekday">{d}</div>
            ))}
            {Array.from({length: firstDay}).map((_, i) => <div key={"e"+i} className="cal-empty" />)}
            {Array.from({length: daysInMonth}).map((_, i) => {
              const day = i+1;
              const dateStr = `${month}-${String(day).padStart(2,"0")}`;
              const dayEvents = eventsForDay(day);
              const today = todayStr === dateStr;
              const isSelected = selectedDay === dateStr;
              const hasEvents = dayEvents.length > 0;
              const hasLive = dayEvents.some(ev => ev.question_sent && !ev.closed);
              return (
                <button
                  key={day}
                  className={`cal-day ${today ? "today" : ""} ${isSelected ? "selected" : ""} ${hasEvents ? "has-events" : ""} ${hasLive ? "active-glow" : ""}`}
                  onClick={() => selectDay(day)}
                >
                  <div className="cal-day-num">{day}</div>
                  {hasEvents && (
                    <div className="cal-day-bars">
                      {dayEvents.slice(0,3).map(ev => (
                        <div key={ev.id} className={`cal-bar ${ev.closed ? "done" : ev.question_sent ? "live" : "planned"}`} />
                      ))}
                      {dayEvents.length > 3 && <div className="cal-more">+{dayEvents.length-3}</div>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Day detail panel */}
        {selectedDay && (
          <div className="cal-panel">
            <div className="cal-panel-header">
              <div>
                <div className="cal-panel-date">{new Date(selectedDay+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"})}</div>
                <div className="cal-panel-sub">{selectedDayEvents.length} {selectedDayEvents.length===1?"item":"items"} gepland</div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedDay(null)}><Icons.x /></button>
            </div>

            {/* History for this day */}
            {selectedDayEvents.length > 0 && (
              <div className="cal-panel-history">
                <div className="cal-panel-label">Geschiedenis</div>
                {selectedDayEvents.map(ev => (
                  <div key={ev.id} className={`cal-hist-item ${ev.closed ? "done" : ev.question_sent ? "live" : "planned"}`}>
                    <div className="chi-top">
                      <span className="chi-time">{ev.scheduled_time ? new Date(ev.scheduled_time).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}) : ""}</span>
                      <span className="chi-type">{ev.event_type === "prediction" ? "📊 Predictie" : "🎯 Quiz"}</span>
                      <span className={`chi-status ${ev.closed?"done":ev.question_sent?"live":"planned"}`}>
                        {ev.closed ? "Afgerond" : ev.question_sent ? "LIVE" : ev.teaser_sent ? "Teaser" : "Gepland"}
                      </span>
                    </div>
                    <div className="chi-q">{ev.question}</div>
                    <div className="chi-meta">
                      {ev.prize_amount && <span className="chi-prize">💰 {ev.prize_amount} {ev.prize_currency}</span>}
                      {ev.question_sent && !ev.closed && <span>{ev.voteCount} stemmen</span>}
                      {ev.closed && ev.winner_username && <span className="chi-winner">🏆 {ev.winner_username}{ev.winner_uid?` (${ev.winner_uid})`:""}</span>}
                    </div>
                    <div className="chi-actions">
                      {ev.question_sent && !ev.closed && <button className="btn-xs btn-primary" onClick={() => openWinner(ev)}>Winnaar kiezen</button>}
                      {!ev.question_sent && !ev.closed && <button className="btn-xs btn-primary" onClick={() => openEdit(ev)}>✏️ Bekijk & bewerk</button>}
                      {!ev.closed && <button className="btn-xs" onClick={() => deleteEvent(ev.id)}>Verwijder</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create form */}
            <div className="cal-panel-create">
              <div className="cal-panel-label">Nieuw aanmaken</div>
              <div className="cal-type-toggle">
                <button className={`ctt-btn ${form.type==="quiz"?"selected":""}`} onClick={() => setForm(p=>({...p,type:"quiz"}))}>🎯 Quiz (met prijs)</button>
                <button className={`ctt-btn ${form.type==="prediction"?"selected":""}`} onClick={() => setForm(p=>({...p,type:"prediction"}))}>📊 Predictie</button>
              </div>
              <div className="cal-type-toggle">
                <button className={`ctt-btn ${form.questionType!=="number"?"selected":""}`} onClick={() => setForm(p=>({...p,questionType:"tags"}))}>🏷️ Keuze</button>
                <button className={`ctt-btn ${form.questionType==="number"?"selected":""}`} onClick={() => setForm(p=>({...p,questionType:"number"}))}>🔢 Getal (dichtst wint)</button>
              </div>

              <div className="form-group">
                <label>Vraag</label>
                <input className="input" placeholder='Bijv. "Gaat BTC boven 100k?"' value={form.question} onChange={e => setForm(p=>({...p,question:e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Stemopties</label>
                <input className="input" placeholder="#ja #nee" value={form.tags} onChange={e => setForm(p=>({...p,tags:e.target.value}))} />
              </div>

              {form.type === "quiz" && (
                <div className="form-row">
                  <div className="form-group" style={{flex:1}}>
                    <label>Prijs</label>
                    <input className="input" placeholder="10" value={form.prizeAmount} onChange={e => setForm(p=>({...p,prizeAmount:e.target.value}))} />
                  </div>
                  <div className="form-group" style={{width:"90px"}}>
                    <label>Munt</label>
                    <input className="input" value={form.prizeCurrency} onChange={e => setForm(p=>({...p,prizeCurrency:e.target.value}))} />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group" style={{flex:1}}>
                  <label>Tijd</label>
                  <input className="input" type="time" value={form.time} onChange={e => setForm(p=>({...p,time:e.target.value}))} />
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label>Teaser (min)</label>
                  <div className="number-input">
                    {[0,10,20,30].map(n => (
                      <button key={n} className={`number-btn ${form.teaserMinutes===n?"selected":""}`} onClick={() => setForm(p=>({...p,teaserMinutes:n}))}>{n||"−"}</button>
                    ))}
                  </div>
                </div>
              </div>

              {form.type === "quiz" && form.teaserMinutes > 0 && (
                <div className="cal-preview">
                  <div className="cal-preview-label">Teaser voorbeeld:</div>
                  <div className="cal-preview-text">"⏰ Over {form.teaserMinutes} min een vraag — win {form.prizeAmount||"X"} {form.prizeCurrency}!"</div>
                </div>
              )}

              <PhotoAttach photo={calPhoto} setPhoto={setCalPhoto} />
              <div className="cal-photo-hint">{calPhoto ? "Foto wordt meegestuurd bij 'Nu plaatsen'" : ""}</div>

              <div className="cal-create-actions">
                <button className="btn-secondary" onClick={() => openCreatePreview(false)} disabled={!form.question.trim() || !form.tags.trim()}>
                  <Icons.clock /> Inplannen
                </button>
                <button className="btn-primary" onClick={() => openCreatePreview(true)} disabled={!form.question.trim() || !form.tags.trim()}>
                  <Icons.send /> Nu plaatsen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming schedule timeline — shown when no specific day is selected */}
        {!selectedDay && !loading && (
          <div className="cal-panel">
            <div className="cal-panel-header">
              <div>
                <div className="cal-panel-date">📅 Ingepland deze maand</div>
                <div className="cal-panel-sub">Op volgorde van tijd</div>
              </div>
            </div>
            <div className="cal-timeline">
              {upcomingEvents.length === 0 ? (
                <div className="empty">Nog niets ingepland deze maand. Klik op een dag om iets toe te voegen.</div>
              ) : (
                upcomingEvents.map(ev => {
                  const d = ev.scheduled_time ? new Date(ev.scheduled_time) : null;
                  const status = ev.closed ? "done" : ev.question_sent ? "live" : "planned";
                  return (
                    <div key={ev.id} className={`tl-item ${status}`}>
                      <div className="tl-when">
                        <span className="tl-date">{d ? d.toLocaleDateString("nl-NL",{day:"numeric",month:"short"}) : "—"}</span>
                        <span className="tl-time">{d ? d.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}) : ""}</span>
                      </div>
                      <div className={`tl-line ${status}`} />
                      <div className="tl-body">
                        <div className="tl-top">
                          <span className="tl-type">{ev.event_type === "prediction" ? "📊 Predictie" : "🎯 Quiz"}</span>
                          <span className={`chi-status ${status}`}>
                            {ev.closed ? "Afgerond" : ev.question_sent ? "LIVE" : "Gepland"}
                          </span>
                        </div>
                        <div className="tl-q">{ev.question}</div>
                        <div className="chi-meta">
                          {ev.prize_amount && <span className="chi-prize">💰 {ev.prize_amount} {ev.prize_currency}</span>}
                          {ev.closed && ev.winner_username && <span className="chi-winner">🏆 {ev.winner_username}</span>}
                        </div>
                        <div className="chi-actions">
                          {ev.question_sent && !ev.closed && <button className="btn-xs btn-primary" onClick={() => openWinner(ev)}>Winnaar kiezen</button>}
                          {!ev.question_sent && !ev.closed && <button className="btn-xs btn-primary" onClick={() => openEdit(ev)}>✏️ Bewerk</button>}
                          {!ev.closed && <button className="btn-xs" onClick={() => deleteEvent(ev.id)}>Verwijder</button>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create preview popup */}
      <TelegramPreview
        open={!!calPreview}
        title={calPreview?.mode === "now" ? "Voorbeeld — nu plaatsen" : "Voorbeeld — inplannen"}
        text={calPreview ? buildCalPreview(calPreview.form) : ""}
        photo={calPreview?.mode === "now" ? calPreview?.photo : null}
        note={calPreview?.mode === "now"
          ? "Wordt direct in de groep geplaatst"
          : `Wordt geplaatst op ${selectedDay ? new Date(selectedDay+"T"+form.time+":00").toLocaleString("nl-NL",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}) : ""}`}
        confirmLabel={calPreview?.mode === "now" ? "Nu plaatsen" : "Inplannen"}
        sending={calPosting}
        onConfirm={confirmCreate}
        onCancel={() => setCalPreview(null)}
      />

      {/* Edit scheduled event modal */}
      {editEvent && (
        <div className="modal-overlay" onClick={() => setEditEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ingeplande post bewerken</h3>
              <button className="btn-icon" onClick={() => setEditEvent(null)}><Icons.x /></button>
            </div>

            {/* Live preview of the edited message */}
            <div className="tg-chat-bg" style={{marginBottom:"14px"}}>
              <div className="tg-bubble">
                <div className="tg-bubble-name">Bybit EU Bot</div>
                <div className="tg-bubble-text">{buildCalPreview(editEvent)}</div>
              </div>
            </div>

            <div className="form-group">
              <label>Vraag</label>
              <input className="input" value={editEvent.question} onChange={e => setEditEvent(p=>({...p,question:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Stemopties</label>
              <input className="input" value={editEvent.tags} onChange={e => setEditEvent(p=>({...p,tags:e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group" style={{flex:1}}>
                <label>Prijs</label>
                <input className="input" value={editEvent.prizeAmount} onChange={e => setEditEvent(p=>({...p,prizeAmount:e.target.value}))} />
              </div>
              <div className="form-group" style={{width:"90px"}}>
                <label>Munt</label>
                <input className="input" value={editEvent.prizeCurrency} onChange={e => setEditEvent(p=>({...p,prizeCurrency:e.target.value}))} />
              </div>
              <div className="form-group" style={{width:"110px"}}>
                <label>Tijd</label>
                <input className="input" type="time" value={editEvent.time} onChange={e => setEditEvent(p=>({...p,time:e.target.value}))} />
              </div>
            </div>
            <div className="modal-actions" style={{justifyContent:"space-between"}}>
              <button className="btn-danger-text" onClick={() => { deleteEvent(editEvent.id); setEditEvent(null); }}>Verwijder</button>
              <div style={{display:"flex",gap:"8px"}}>
                <button className="btn-secondary" onClick={saveEdit}>Opslaan</button>
                <button className="btn-primary" onClick={postScheduledNow}><Icons.send /> Nu plaatsen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Winner picker modal */}
      <CalendarWinnerModal
        event={winnerModal}
        winnerData={winnerData}
        correctTag={correctTag}
        setCorrectTag={setCorrectTag}
        correctValue={correctValue}
        setCorrectValue={setCorrectValue}
        onPick={pickWinner}
        onConfirm={confirmWinner}
        onClose={() => { setWinnerModal(null); setWinnerData(null); }}
      />

      <CalendarWinners />
    </div>
  );
}

// ── Calendar winner picker modal (simple, crash-proof) ─────────────────
function CalendarWinnerModal({ event, winnerData, correctTag, setCorrectTag, correctValue, setCorrectValue, onPick, onConfirm, onClose }) {
  if (!event) return null;
  const isNumeric = (event.question_type || "tags") === "number";
  const tags = Array.isArray(event.tags) ? event.tags : [];
  const voters = winnerData && Array.isArray(winnerData.correctVoters) ? winnerData.correctVoters : [];

  function nameOf(v) {
    if (!v) return "Onbekend";
    if (v.username) return "@" + v.username;
    return v.first_name || ("ID " + v.user_id);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Winnaar kiezen</h3>
          <button className="btn-icon" onClick={onClose}><Icons.x /></button>
        </div>
        <div className="winner-q">"{event.question}"</div>

        {/* Juiste antwoord invoeren */}
        <div className="form-group">
          <label>Wat is het juiste antwoord?</label>
          {isNumeric ? (
            <input
              className="input"
              type="number"
              step="any"
              placeholder="Vul het juiste getal in, bijv. 234987"
              value={correctValue}
              onChange={e => setCorrectValue(e.target.value)}
            />
          ) : (
            <div className="winner-answer-row">
              <div className="tag-select">
                {tags.map(tag => (
                  <button key={tag} className={`tag-btn ${correctTag === tag ? "selected" : ""}`} onClick={() => setCorrectTag(tag)}>
                    {String(tag).replace("#", "").toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                className="input winner-value-input"
                placeholder="of typ zelf het juiste antwoord"
                value={correctValue}
                onChange={e => setCorrectValue(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Tag quizzes need a button to load the voters for the chosen tag */}
        {!isNumeric && (
          <button className="btn-secondary" style={{ width: "100%", marginBottom: "14px" }} onClick={onPick} disabled={!correctTag}>
            <Icons.shuffle /> Toon deelnemers van dit antwoord
          </button>
        )}

        {/* Answer list */}
        {(isNumeric || winnerData) && (
          <div className="winner-candidates">
            <div className="wc-header">
              {voters.length} {isNumeric ? "antwoorden" : "deelnemers"} \u2014 klik op iemand om als winnaar te kiezen
            </div>
            {voters.length === 0 ? (
              <div className="empty">Nog geen antwoorden binnen</div>
            ) : (
              <div className="wc-list">
                {voters.map((v, i) => {
                  // Show whatever answer the user gave: a number guess, or their tag
                  const answer = (v.guess_value != null && v.guess_value !== "")
                    ? v.guess_value
                    : (v.tag ? String(v.tag).replace("#","").toUpperCase() : null);
                  return (
                    <div key={v.user_id || i} className="wc-row">
                      <span className="wc-rank">#{i + 1}</span>
                      {answer != null && <span className="wc-guess">{answer}</span>}
                      <span className="wc-name">{nameOf(v)}</span>
                      {v.uid && <span className="wc-uid">{v.uid}</span>}
                      <button className="btn-xs btn-primary" onClick={() => onConfirm(v.user_id, true)}>Kies & tag in groep</button>
                      <button className="btn-xs" onClick={() => onConfirm(v.user_id, false)}>Stil kiezen</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Calendar Winners overview
function CalendarWinners() {
  const [period, setPeriod]   = useState("week");
  const [winners, setWinners] = useState([]);

  const load = useCallback(async () => {
    const r = await api(`/api/calendar/winners?period=${period}`);
    setWinners(r.winners || []);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="card" style={{marginTop:"16px"}}>
      <div className="card-header">
        <h3>🏆 Winnaars overzicht</h3>
        <div className="period-filter">
          {[["day","Vandaag"],["week","Deze week"],["month","Deze maand"],["all","Alles"]].map(([k,l]) => (
            <button key={k} className={`period-btn ${period===k?"selected":""}`} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
      </div>
      {winners.length === 0 ? (
        <div className="empty">Nog geen winnaars in deze periode</div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Datum</th><th>Vraag</th><th>Winnaar</th><th>Bybit UID</th><th>Prijs</th></tr></thead>
          <tbody>
            {winners.map(w => (
              <tr key={w.id}>
                <td>{new Date(w.event_date).toLocaleDateString("nl-NL",{day:"2-digit",month:"2-digit"})}</td>
                <td className="winner-q-cell">{w.question}</td>
                <td><strong>{w.winner_username}</strong></td>
                <td><span className="uid-cell has-uid">{w.winner_uid || "—"}</span></td>
                <td>{w.prize_amount ? <span className="prize-cell">💰 {w.prize_amount} {w.prize_currency}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Help Tab ────────────────────────────────────────────────────────────
function HelpTab() {
  const commands = [
    { cmd:"/start", desc:"Open het admin menu (in je DM met de bot)", who:"Admin" },
    { cmd:"/menu", desc:"Zelfde als /start — opent het admin menu", who:"Admin" },
    { cmd:"/ping", desc:"Test of de bot actief is — antwoord komt in je DM", who:"Admin" },
    { cmd:"/results", desc:"Bekijk de live stemresultaten van de actieve predictie", who:"Iedereen" },
    { cmd:"/leaderboard", desc:"Top 10 meest actieve leden van deze week", who:"Iedereen" },
    { cmd:"/photos", desc:"Top foto's van deze week op basis van reacties", who:"Iedereen" },
    { cmd:"/mystats", desc:"Je eigen statistieken: berichten, totaal, UID", who:"Iedereen" },
    { cmd:"/setuid", desc:"Sla je Bybit UID op, bijv: /setuid 12345678", who:"Iedereen" },
    { cmd:"/help", desc:"Toon alle beschikbare commando's", who:"Iedereen" },
  ];

  const hashtags = [
    { tag:"#ja #nee (of eigen tags)", desc:"Stem op de actieve predictie door de tag in een bericht te typen" },
    { tag:"#FDB", desc:"Stuur feedback als de feedback periode open is, bijv: 'Mooie events #FDB'" },
    { tag:"Foto + #tag", desc:"Stuur een foto met hashtag onderschrift voor de foto contest" },
    { tag:"uid: 12345678", desc:"Je UID wordt automatisch opgeslagen als je dit ergens typt" },
  ];

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Help & Commando's</h2>
      </div>

      <div className="card help-intro">
        <div className="help-intro-icon">👑</div>
        <div>
          <div className="help-intro-title">Bybit Community Bot</div>
          <div className="help-intro-text">Dit dashboard en de bot worden beheerd door <strong>Sushil</strong>. Hieronder vind je alle commando's die werken in de Telegram groep.</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>💬 Commando's</h3></div>
        <table className="data-table">
          <thead><tr><th>Commando</th><th>Wat het doet</th><th>Wie</th></tr></thead>
          <tbody>
            {commands.map(c => (
              <tr key={c.cmd}>
                <td><code className="cmd-code">{c.cmd}</code></td>
                <td>{c.desc}</td>
                <td><span className={`who-badge ${c.who==="Admin"?"admin":""}`}>{c.who}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header"><h3>#️⃣ Hashtag functies</h3></div>
        <table className="data-table">
          <thead><tr><th>Hashtag</th><th>Wat het doet</th></tr></thead>
          <tbody>
            {hashtags.map(h => (
              <tr key={h.tag}>
                <td><code className="cmd-code">{h.tag}</code></td>
                <td>{h.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card help-footer">
        <div>Gemaakt met ❤️ voor de Bybit community</div>
        <div className="help-footer-sub">Beheerd door Sushil 👑</div>
      </div>
    </div>
  );
}

// ── Templates Tab ───────────────────────────────────────────────────────
function TemplatesTab() {
  const [tpl, setTpl]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api("/api/templates");
    setTpl(r);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await api("/api/templates", { method:"POST", body: JSON.stringify(tpl) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !tpl) return <div className="loading">Laden...</div>;

  const fields = [
    { key:"prediction", title:"🎯 Nieuwe predictie", desc:"Verstuurd als je een predictie post", vars:["{question}","{tags}"] },
    { key:"feedback_open", title:"💡 Feedback geopend", desc:"Verstuurd als je een feedback sessie start", vars:["{enddate}"] },
    { key:"feedback_close", title:"🔒 Feedback gesloten", desc:"Verstuurd als de feedback sessie sluit", vars:[] },
    { key:"winner", title:"🏆 Winnaar (quiz)", desc:"Verstuurd bij een content kalender winnaar", vars:["{question}","{answer}","{winner}","{prize}"] },
    { key:"teaser", title:"⏰ Teaser", desc:"Verstuurd X minuten voor een geplande quiz", vars:["{minutes}","{prize}"] },
  ];

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Berichten Aanpassen</h2>
        <button className="btn-primary" onClick={save}>
          {saved ? <><Icons.check /> Opgeslagen!</> : "Opslaan"}
        </button>
      </div>

      <div className="card tpl-intro">
        Pas hier de automatische berichten aan die de bot in de groep stuurt. Gebruik de variabelen tussen accolades — die worden automatisch ingevuld.
      </div>

      {fields.map(f => (
        <div key={f.key} className="card">
          <div className="tpl-header">
            <div>
              <div className="tpl-title">{f.title}</div>
              <div className="tpl-desc">{f.desc}</div>
            </div>
          </div>
          {f.vars.length > 0 && (
            <div className="tpl-vars">
              {f.vars.map(v => (
                <button key={v} className="tpl-var" onClick={() => setTpl(p => ({...p, [f.key]: (p[f.key]||"") + " " + v}))}>
                  {v}
                </button>
              ))}
            </div>
          )}
          <textarea
            className="input tpl-textarea"
            rows={4}
            value={tpl[f.key] || ""}
            onChange={e => setTpl(p => ({...p, [f.key]: e.target.value}))}
          />
        </div>
      ))}

      <div className="card tpl-help">
        <strong>Opmaak tips:</strong> Gebruik *tekst* voor vetgedrukt, en \\n voor een nieuwe regel. De variabelen zoals {"{question}"} worden vervangen door de echte waarde.
      </div>
    </div>
  );
}

// ── Auto Messages Tab ───────────────────────────────────────────────────
function AutoMessagesTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null); // {id?, title, body, tagWinner}
  const [sendStatus, setSendStatus] = useState({}); // id -> 'posted'|'failed'
  const [tagInput, setTagInput] = useState({}); // id -> userId
  const [photoInput, setPhotoInput] = useState({}); // id -> File
  const [previewMsg, setPreviewMsg] = useState(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api("/api/automessages");
    setMessages(r.messages || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveMsg() {
    if (!editing.title?.trim() || !editing.body?.trim()) return;
    await api("/api/automessages", { method:"POST", body: JSON.stringify(editing) });
    setEditing(null);
    load();
  }

  async function deleteMsg(id) {
    if (!confirm("Dit bericht verwijderen?")) return;
    await api(`/api/automessages/${id}`, { method:"DELETE" });
    load();
  }

  function openSendPreview(m) {
    const tagUserId = m.tag_winner ? (tagInput[m.id] || "").trim() : null;
    setPreviewMsg({ ...m, _tagUserId: tagUserId, _photo: photoInput[m.id] || null });
  }

  async function sendMsg(m) {
    const tagUserId = m.tag_winner ? (tagInput[m.id] || "").trim() : null;
    const photo = photoInput[m.id];
    let r;
    if (photo) {
      r = await uploadPhoto(photo, m.body, tagUserId);
    } else {
      r = await api(`/api/automessages/${m.id}/send`, { method:"POST", body: JSON.stringify({ tagUserId }) });
    }
    setSendStatus(p => ({ ...p, [m.id]: r.sent_status || (r.success ? "posted" : "failed") }));
    setPhotoInput(p => { const n = {...p}; delete n[m.id]; return n; });
    setPreviewMsg(null);
    load();
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Automatische Berichten</h2>
        <button className="btn-primary" onClick={() => setEditing({ title:"", body:"", tagWinner:false })}>
          <Icons.plus /> Nieuw bericht
        </button>
      </div>

      <div className="card tpl-intro">
        Maak hier kant-en-klare berichten die jij of een moderator met één klik naar de groep kan sturen. Gebruik <code>{"{winner}"}</code> in je tekst om automatisch een winnaar te taggen.
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing.id ? "Bericht bewerken" : "Nieuw bericht"}</h3>
              <button className="btn-icon" onClick={() => setEditing(null)}><Icons.x /></button>
            </div>
            <div className="form-group">
              <label>Titel (alleen voor jou)</label>
              <input className="input" placeholder="Bijv. Welkomstbericht" value={editing.title} onChange={e => setEditing(p=>({...p,title:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Bericht</label>
              <textarea className="input tpl-textarea" rows={5} placeholder="Typ je bericht... gebruik *vet* en {winner} voor een tag" value={editing.body} onChange={e => setEditing(p=>({...p,body:e.target.value}))} />
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={!!editing.tagWinner} onChange={e => setEditing(p=>({...p,tagWinner:e.target.checked}))} />
              <span>Dit bericht tagt een winnaar (gebruik {"{winner}"} in de tekst)</span>
            </label>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditing(null)}>Annuleer</button>
              <button className="btn-primary" onClick={saveMsg}>Opslaan</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Laden...</div> : (
        <div className="am-list">
          {messages.length === 0 && <div className="card"><div className="empty">Nog geen automatische berichten. Maak er een aan!</div></div>}
          {messages.map(m => (
            <div key={m.id} className="card am-card">
              <div className="am-header">
                <div className="am-title">{m.title}</div>
                <div className="am-actions">
                  <button className="btn-sm" onClick={() => setEditing({ id:m.id, title:m.title, body:m.body, tagWinner:!!m.tag_winner })}>Bewerk</button>
                  <button className="btn-icon btn-danger" onClick={() => deleteMsg(m.id)}><Icons.trash /></button>
                </div>
              </div>
              <div className="am-body">{m.body}</div>
              <PhotoAttach photo={photoInput[m.id] || null} setPhoto={f => setPhotoInput(p => ({ ...p, [m.id]: f }))} />
              {m.tag_winner ? (
                <div className="am-tag-row">
                  <input
                    className="input"
                    placeholder="Telegram User ID van winnaar"
                    value={tagInput[m.id] || ""}
                    onChange={e => setTagInput(p=>({...p,[m.id]:e.target.value}))}
                  />
                  <button className="btn-primary" onClick={() => openSendPreview(m)}><Icons.send /> Verstuur</button>
                  <SendDot status={sendStatus[m.id] || m.last_status} />
                </div>
              ) : (
                <div className="am-send-row">
                  <button className="btn-primary" onClick={() => openSendPreview(m)}><Icons.send /> Verstuur naar groep</button>
                  <SendDot status={sendStatus[m.id] || m.last_status} />
                  {m.last_sent && <span className="am-last">Laatst: {new Date(m.last_sent).toLocaleString("nl-NL",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <TelegramPreview
        open={!!previewMsg}
        title="Voorbeeld bericht"
        text={previewMsg?.body}
        photo={previewMsg?._photo}
        note={previewMsg?._tagUserId ? `Winnaar (ID ${previewMsg._tagUserId}) wordt getagd` : "Wordt direct in de groep geplaatst"}
        confirmLabel="Versturen"
        sending={sending}
        onConfirm={async () => { setSending(true); await sendMsg(previewMsg); setSending(false); }}
        onCancel={() => setPreviewMsg(null)}
      />
    </div>
  );
}
function SendDot({ status }) {
  if (!status) return null;
  if (status === "posted") return <span className="send-dot posted" title="Verzonden naar groep">● Geplaatst</span>;
  return <span className="send-dot failed" title="Niet geplaatst in groep">● Niet geplaatst</span>;
}

// Winners Tab (all-time leaderboard of prize winners)
function WinnersTab() {
  const [winners, setWinners]     = useState([]);
  const [totalPrizes, setTotal]   = useState(0);
  const [totalWinners, setTotalW] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [preview, setPreview]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [msg, setMsg]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api("/api/winners/all");
    setWinners(r.winners || []);
    setTotal(r.totalPrizes || 0);
    setTotalW(r.totalWinners || 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setMsg(`\u{1F381} *Community Giveaway Update!*\n\nIn totaal hebben we al *{total} prijzen* weggegeven aan *{winners_count} verschillende leden*! \u{1F525}\n\nBedankt voor jullie deelname \u2014 er komen nog veel meer kansen om te winnen! \u{1F680}`);
  }, []);

  function previewText() {
    return msg.replace(/\{total\}/g, totalPrizes).replace(/\{winners_count\}/g, totalWinners);
  }

  async function sendTotal() {
    setSending(true);
    const r = await api("/api/winners/announce-total", { method:"POST", body: JSON.stringify({ message: msg }) });
    setSending(false);
    setPreview(false);
    if (r?.sent_status === "failed" || r?.error) {
      alert("Versturen mislukt: " + (r?.error || "onbekende fout"));
    } else {
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Winnaars</h2>
        <button className="btn-icon" onClick={load}><Icons.refresh /></button>
      </div>

      <div className="winners-summary">
        <div className="ws-card">
          <div className="ws-num">{totalPrizes}</div>
          <div className="ws-label">Prijzen weggegeven</div>
        </div>
        <div className="ws-card">
          <div className="ws-num">{totalWinners}</div>
          <div className="ws-label">Unieke winnaars</div>
        </div>
      </div>

      <div className="card">
        <div className="result-section-label">📢 Totaal-bericht naar de groep</div>
        <div className="announce-hint">Gebruik <code>{"{total}"}</code> voor het aantal prijzen en <code>{"{winners_count}"}</code> voor het aantal winnaars.</div>
        <textarea className="input" rows={5} value={msg} onChange={e => setMsg(e.target.value)} />
        {sent ? (
          <div className="announce-confirm">✅ Verstuurd naar de groep!</div>
        ) : (
          <button className="btn-primary" style={{marginTop:"8px"}} onClick={() => setPreview(true)} disabled={!msg.trim()}>
            <Icons.send /> Voorbeeld & versturen
          </button>
        )}
      </div>

      {loading ? <div className="loading">Laden...</div> : (
        <div className="card">
          <div className="card-header"><h3>🏆 Ranglijst — meeste prijzen</h3></div>
          {winners.length === 0 ? (
            <div className="empty">Nog geen winnaars geregistreerd. Winnaars verschijnen hier zodra je ze kiest bij predicties, quizzes of feedback.</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>#</th><th>Winnaar</th><th>Bybit UID</th><th>Keer gewonnen</th></tr></thead>
              <tbody>
                {winners.map((w, i) => (
                  <tr key={w.user_id}>
                    <td>{["🥇","🥈","🥉"][i] || (i+1)}</td>
                    <td><strong>{w.username ? "@"+w.username : w.first_name || ("ID "+w.user_id)}</strong></td>
                    <td><span className="uid-cell has-uid">{w.uid || "—"}</span></td>
                    <td><span className="win-count-badge">{w.win_count}×</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <TelegramPreview
        open={preview}
        title="Voorbeeld totaal-bericht"
        text={previewText()}
        note="Wordt direct in de groep geplaatst"
        confirmLabel="Versturen"
        sending={sending}
        onConfirm={sendTotal}
        onCancel={() => setPreview(false)}
      />
    </div>
  );
}

const TABS = [
  { id: "overview",     label: "Overzicht",      icon: Icons.chart      },
  { id: "calendar",     label: "Content Kalender", icon: Icons.calendar },
  { id: "predictions",  label: "Predicties",     icon: Icons.prediction },
  { id: "leaderboard",  label: "Activiteit",     icon: Icons.trophy     },
  { id: "winners",      label: "Winnaars",       icon: Icons.trophy     },
  { id: "feedback",     label: "Feedback",       icon: Icons.message    },
  { id: "users",        label: "Gebruikers",     icon: Icons.users      },
  { id: "chatlog",      label: "Chat Log",       icon: Icons.server     },
  { id: "templates",    label: "Berichten",      icon: Icons.edit       },
  { id: "automessages", label: "Auto Berichten", icon: Icons.send       },
  { id: "roles",        label: "Rechten",        icon: Icons.shield     },
  { id: "help",         label: "Help",           icon: Icons.help       },
];

export default function App() {
  const [user, setUser]     = useState(null);
  const [activeTab, setTab] = useState("overview");

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">B</div>
          <div className="logo-text">
            <div className="logo-title">Bybit</div>
            <div className="logo-sub">Community</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setTab(tab.id)}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{user.role === "owner" ? "👑" : "🛡️"}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role === "owner" ? "Owner" : user.role === "mod" ? "Moderator" : "Viewer"}</div>
          </div>
          <button className="logout-btn" onClick={() => setUser(null)} title="Uitloggen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === "overview"    && <OverviewTab />}
        {activeTab === "predictions" && <PredictionsTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
        {activeTab === "winners"     && <WinnersTab />}
        {activeTab === "feedback"    && <FeedbackTab />}
        {activeTab === "users"       && <UsersTab />}
        {activeTab === "calendar"    && <CalendarTab />}
        {activeTab === "roles"       && <RolesTab />}
        {activeTab === "chatlog"     && <ChatLogTab />}
        {activeTab === "templates"   && <TemplatesTab />}
        {activeTab === "automessages" && <AutoMessagesTab />}
        {activeTab === "help"        && <HelpTab />}
      </main>
    </div>
  );
}
