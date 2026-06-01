import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_KEY  = import.meta.env.VITE_API_KEY  || "bybit-dashboard-key";

function api(path, opts = {}) {
  return fetch(API_BASE + path, {
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    ...opts,
  }).then(r => r.json());
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

  async function handleLogin() {
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
    onLogin({ name: "Sushil", role: "owner", server });
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
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">B</div>
        </div>
        <h1>Bybit Community</h1>
        <p>Dashboard voor community managers</p>
        <button className="btn-primary btn-large" onClick={handleLogin} disabled={checking}>
          {checking ? "Verbinden..." : "Inloggen"}
        </button>
        {err && <div className="error-msg">{err}</div>}
        <div className="login-note">
          Beheerd door Sushil 👑
        </div>
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
  const [form, setForm]               = useState({ question: "", tags: "", scheduleAt: "" });
  const [reveal, setReveal]           = useState({ show: false, qId: null, tags: [], count: 3 });
  const [revealResult, setRevealResult] = useState(null);
  const [announcing, setAnnouncing]   = useState(false);
  const [announceTxt, setAnnounceTxt] = useState("");

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

  async function createPrediction() {
    if (!form.question.trim() || !form.tags.trim()) return;
    const tags = form.tags.split(/[\s,]+/).filter(Boolean);
    await api("/api/predictions/create", {
      method: "POST",
      body: JSON.stringify({ question: form.question, tags, scheduleAt: form.scheduleAt || null }),
    });
    setCreating(false);
    setForm({ question: "", tags: "", scheduleAt: "" });
    load();
  }

  async function doReveal() {
    if (!reveal.correctTag) return;
    const r = await api("/api/predictions/" + reveal.qId + "/reveal", {
      method: "POST",
      body: JSON.stringify({ correctTag: reveal.correctTag, winnersCount: reveal.count }),
    });
    setRevealResult(r);
    setReveal(prev => ({ ...prev, show: false }));
    load();
  }

  async function announce() {
    if (!announceTxt.trim()) return;
    setAnnouncing(true);
    await api("/api/predictions/" + selected?.id + "/announce", {
      method: "POST",
      body: JSON.stringify({ message: announceTxt }),
    });
    setAnnouncing(false);
    setAnnounceTxt("");
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
              <label>Vraag</label>
              <input
                className="input"
                placeholder='Bijv. "Gaat BTC deze week omhoog?"'
                value={form.question}
                onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Stemopties (gescheiden door spatie)</label>
              <input
                className="input"
                placeholder="#ja #nee  of  #bullish #bearish #sideways"
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              />
            </div>
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
              <button className="btn-primary" onClick={createPrediction}>
                {form.scheduleAt ? <><Icons.clock /> Inplannen</> : <><Icons.send /> Nu posten</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal modal */}
      {reveal.show && (
        <div className="modal-overlay" onClick={() => setReveal(p => ({ ...p, show: false }))}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Onthul correct antwoord</h3>
              <button className="btn-icon" onClick={() => setReveal(p => ({ ...p, show: false }))}><Icons.x /></button>
            </div>
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
              <button className="btn-primary" onClick={doReveal} disabled={!reveal.correctTag}>
                <Icons.check /> Onthullen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal result */}
      {revealResult && (
        <div className="card result-card">
          <div className="card-header">
            <h3>🏆 Resultaat</h3>
            <button className="btn-icon" onClick={() => setRevealResult(null)}><Icons.x /></button>
          </div>
          <div className="result-correct">Correct: <strong>{revealResult.correct?.replace("#","").toUpperCase()}</strong></div>
          <div className="result-total">{revealResult.winners?.length} van {revealResult.total} hadden het goed</div>
          <div className="winners-list">
            {revealResult.winners?.map((w, i) => (
              <div key={i} className="winner-row">
                <span className="winner-rank">{["🥇","🥈","🥉"][i] || `#${i+1}`}</span>
                <span className="winner-name">{w.username ? "@"+w.username : w.first_name}</span>
                {w.uid && <span className="winner-uid">UID: {w.uid}</span>}
              </div>
            ))}
          </div>
          <div className="form-group" style={{marginTop:"1rem"}}>
            <label>Aankondiging sturen naar groep</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Typ je aankondiging..."
              value={announceTxt}
              onChange={e => setAnnounceTxt(e.target.value)}
            />
            <button className="btn-primary" onClick={announce} disabled={announcing} style={{marginTop:"0.5rem"}}>
              <Icons.send /> {announcing ? "Versturen..." : "Stuur naar groep"}
            </button>
          </div>
        </div>
      )}

      {/* Voters sidebar */}
      {selected && voters && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setVoters(null); }}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stemmen — "{selected.question}"</h3>
              <button className="btn-icon" onClick={() => { setSelected(null); setVoters(null); }}><Icons.x /></button>
            </div>
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
                  <span className="voter-tag">{v.tag.replace("#","").toUpperCase()}</span>
                  <span className="voter-name">{v.username ? "@"+v.username : v.first_name}</span>
                  {v.uid && <span className="voter-uid">{v.uid}</span>}
                  <span className="voter-time">{new Date(v.voted_at).toLocaleTimeString("nl-NL")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Predictions list */}
      <div className="predictions-list">
        {predictions.map(q => (
          <div key={q.id} className={`prediction-card ${q.closed === 0 ? "active" : ""}`}>
            <div className="pred-header">
              <div className="pred-status">
                {q.closed === 0 ? <span className="badge badge-green">Actief</span>
                 : q.correct_tag ? <span className="badge badge-blue">Onthuld</span>
                 : <span className="badge badge-gray">Gesloten</span>}
              </div>
              <div className="pred-week">{q.week}</div>
            </div>
            <div className="pred-question">"{q.question}"</div>
            <div className="pred-tags">
              {q.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div className="pred-stats">
              <span>{q.total} stemmen</span>
              {q.correct_tag && <span className="correct-tag">✅ {q.correct_tag.replace("#","").toUpperCase()}</span>}
            </div>
            <div className="pred-tally">
              {q.tally.map(t => {
                const pct = q.total > 0 ? Math.round((t.count / q.total) * 100) : 0;
                return (
                  <div key={t.tag} className="mini-tally">
                    <span>{t.tag.replace("#","").toUpperCase()}</span>
                    <div className="mini-bar-wrap">
                      <div className="mini-bar" style={{ width: pct + "%", background: t.tag === q.correct_tag ? "#10b981" : "#3b82f6" }} />
                    </div>
                    <span>{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="pred-actions">
              <button className="btn-sm" onClick={() => viewVoters(q)}>
                <Icons.eye /> Stemmen
              </button>
              {q.closed === 0 && (
                <button className="btn-sm btn-primary" onClick={() => setReveal({ show: true, qId: q.id, tags: q.tags, count: 3, correctTag: "" })}>
                  <Icons.trophy /> Onthullen
                </button>
              )}
            </div>
          </div>
        ))}
        {predictions.length === 0 && <div className="empty">Nog geen predicties aangemaakt</div>}
      </div>
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
            <button className="btn-sm" style={{marginTop:"8px"}} onClick={() => setWinners(null)}>Sluiten</button>
          </div>
        )}
      </div>

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
  const limit = 50;

  const load = useCallback(async (p=0, q="") => {
    setLoading(true);
    const r = await api(`/api/chatlog?limit=${limit}&offset=${p*limit}${q ? "&search="+encodeURIComponent(q) : ""}`);
    setLogs(r.logs || []);
    setTotal(r.total || 0);
    setPage(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
  const [form, setForm]     = useState({ userId: "", username: "", role: "mod" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await api("/api/roles");
    setRoles(r.roles || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addRole() {
    if (!form.userId.trim()) return;
    await api("/api/roles", { method: "POST", body: JSON.stringify(form) });
    setForm({ userId: "", username: "", role: "mod" });
    load();
  }

  async function removeRole(userId) {
    await api("/api/roles/" + userId, { method: "DELETE" });
    load();
  }

  const ROLE_LABELS = { owner: "Owner 👑", mod: "Moderator 🛡️", viewer: "Viewer 👁️" };
  const ROLE_PERMS  = {
    owner:  ["Alles beheren", "Predicties aanmaken & onthullen", "Feedback beheren", "Rollen beheren", "Bot instellingen"],
    mod:    ["Predicties bekijken", "Stemmen bekijken", "Feedback bekijken", "Leaderboard bekijken"],
    viewer: ["Statistieken bekijken", "Leaderboard bekijken"],
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>Rollen & Rechten</h2>
      </div>

      <div className="roles-grid">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} className="role-card">
            <div className="role-title">{label}</div>
            <ul className="role-perms">
              {ROLE_PERMS[role].map(p => <li key={p}><Icons.check /> {p}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><h3>Rol toevoegen</h3></div>
        <div className="add-role-form">
          <input className="input" placeholder="Telegram User ID" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} />
          <input className="input" placeholder="@username (optioneel)" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="mod">Moderator</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="btn-primary" onClick={addRole}><Icons.plus /> Toevoegen</button>
        </div>
      </div>

      {loading ? <div className="loading">Laden...</div> : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Gebruiker</th><th>Rol</th><th>Toegevoegd</th><th></th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.user_id}>
                  <td>{r.username || r.user_id}</td>
                  <td><span className="role-badge">{ROLE_LABELS[r.role] || r.role}</span></td>
                  <td>{r.created_at?.slice(0,10)}</td>
                  <td><button className="btn-icon btn-danger" onClick={() => removeRole(r.user_id)}><Icons.x /></button></td>
                </tr>
              ))}
              {roles.length === 0 && <tr><td colSpan={4} className="empty">Nog geen rollen ingesteld</td></tr>}
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
  const [month, setMonth]       = useState(new Date().toISOString().slice(0,7));
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(null); // date string when creating
  const [form, setForm]         = useState({ question:"", tags:"", prizeAmount:"", prizeCurrency:"USDC", teaserMinutes:20, time:"18:00" });
  const [winnerModal, setWinnerModal] = useState(null); // event being judged
  const [winnerData, setWinnerData]   = useState(null);
  const [correctTag, setCorrectTag]   = useState("");

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
  const monthName = new Date(y, m-1).toLocaleDateString("nl-NL", { month:"long", year:"numeric" });

  function eventsForDay(day) {
    const dateStr = `${month}-${String(day).padStart(2,"0")}`;
    return events.filter(e => e.event_date === dateStr);
  }

  function openCreate(day) {
    const dateStr = `${month}-${String(day).padStart(2,"0")}`;
    setForm({ question:"", tags:"", prizeAmount:"", prizeCurrency:"USDC", teaserMinutes:20, time:"18:00" });
    setCreating(dateStr);
  }

  async function createEvent() {
    if (!form.question.trim() || !form.tags.trim()) return;
    const tags = form.tags.split(/[\s,]+/).filter(Boolean);
    const scheduledTime = new Date(`${creating}T${form.time}:00`).toISOString();
    await api("/api/calendar/create", {
      method:"POST",
      body: JSON.stringify({
        eventDate: creating, question: form.question, tags,
        prizeAmount: form.prizeAmount, prizeCurrency: form.prizeCurrency,
        teaserMinutes: parseInt(form.teaserMinutes), scheduledTime
      })
    });
    setCreating(null);
    load();
  }

  async function deleteEvent(id) {
    if (!confirm("Dit event verwijderen?")) return;
    await api(`/api/calendar/${id}`, { method:"DELETE" });
    load();
  }

  async function openWinner(ev) {
    setWinnerModal(ev);
    setCorrectTag("");
    setWinnerData(null);
  }

  async function pickWinner() {
    if (!correctTag) return;
    const r = await api(`/api/calendar/${winnerModal.id}/pick-winner`, {
      method:"POST", body: JSON.stringify({ correctTag })
    });
    setWinnerData(r);
  }

  async function confirmWinner(userId, announce) {
    await api(`/api/calendar/${winnerModal.id}/confirm-winner`, {
      method:"POST",
      body: JSON.stringify({ correctTag, winnerUserId: userId, announce })
    });
    setWinnerModal(null);
    setWinnerData(null);
    load();
  }

  function changeMonth(delta) {
    const d = new Date(y, m-1+delta, 1);
    setMonth(d.toISOString().slice(0,7));
  }

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

      {loading ? <div className="loading">Laden...</div> : (
        <div className="calendar-grid">
          {["Ma","Di","Wo","Do","Vr","Za","Zo"].map(d => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}
          {Array.from({length: firstDay}).map((_, i) => <div key={"e"+i} className="cal-empty" />)}
          {Array.from({length: daysInMonth}).map((_, i) => {
            const day = i+1;
            const dayEvents = eventsForDay(day);
            const today = new Date().toISOString().slice(0,10) === `${month}-${String(day).padStart(2,"0")}`;
            return (
              <div key={day} className={`cal-day ${today ? "today" : ""}`}>
                <div className="cal-day-num">{day}</div>
                <div className="cal-day-events">
                  {dayEvents.map(ev => (
                    <div key={ev.id} className={`cal-event ${ev.closed ? "done" : ev.question_sent ? "live" : ""}`}>
                      <div className="cal-event-time">{ev.scheduled_time ? new Date(ev.scheduled_time).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}) : ""}</div>
                      <div className="cal-event-q">{ev.question}</div>
                      {ev.prize_amount && <div className="cal-event-prize">💰 {ev.prize_amount} {ev.prize_currency}</div>}
                      <div className="cal-event-status">
                        {ev.closed ? `🏆 ${ev.winner_username || "Winnaar gekozen"}` :
                         ev.question_sent ? `🔴 LIVE · ${ev.voteCount} stemmen` :
                         ev.teaser_sent ? "⏰ Teaser verstuurd" : "📅 Gepland"}
                      </div>
                      <div className="cal-event-actions">
                        {ev.question_sent && !ev.closed && (
                          <button className="btn-xs btn-primary" onClick={() => openWinner(ev)}>Winnaar</button>
                        )}
                        {!ev.closed && <button className="btn-xs" onClick={() => deleteEvent(ev.id)}>✕</button>}
                      </div>
                    </div>
                  ))}
                  <button className="cal-add-btn" onClick={() => openCreate(day)}>+ Quiz</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create event modal */}
      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quiz inplannen — {new Date(creating).toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}</h3>
              <button className="btn-icon" onClick={() => setCreating(null)}><Icons.x /></button>
            </div>
            <div className="form-group">
              <label>Vraag</label>
              <input className="input" placeholder='Bijv. "Gaat BTC boven 100k sluiten?"' value={form.question} onChange={e => setForm(p=>({...p,question:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Stemopties</label>
              <input className="input" placeholder="#ja #nee" value={form.tags} onChange={e => setForm(p=>({...p,tags:e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group" style={{flex:1}}>
                <label>Prijs bedrag</label>
                <input className="input" placeholder="10" value={form.prizeAmount} onChange={e => setForm(p=>({...p,prizeAmount:e.target.value}))} />
              </div>
              <div className="form-group" style={{width:"100px"}}>
                <label>Munt</label>
                <input className="input" value={form.prizeCurrency} onChange={e => setForm(p=>({...p,prizeCurrency:e.target.value}))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{flex:1}}>
                <label>Tijd van de vraag</label>
                <input className="input" type="time" value={form.time} onChange={e => setForm(p=>({...p,time:e.target.value}))} />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label>Teaser (min ervoor)</label>
                <div className="number-input">
                  {[10,15,20,30].map(n => (
                    <button key={n} className={`number-btn ${form.teaserMinutes===n?"selected":""}`} onClick={() => setForm(p=>({...p,teaserMinutes:n}))}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="cal-preview">
              <div className="cal-preview-label">Voorbeeld teaser:</div>
              <div className="cal-preview-text">"⏰ Over {form.teaserMinutes} minuten komt er een vraag waarmee je {form.prizeAmount||"X"} {form.prizeCurrency} kan winnen!"</div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setCreating(null)}>Annuleer</button>
              <button className="btn-primary" onClick={createEvent}><Icons.calendar /> Inplannen</button>
            </div>
          </div>
        </div>
      )}

      {/* Winner picker modal */}
      {winnerModal && (
        <div className="modal-overlay" onClick={() => setWinnerModal(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Winnaar kiezen</h3>
              <button className="btn-icon" onClick={() => setWinnerModal(null)}><Icons.x /></button>
            </div>
            <div className="winner-q">"{winnerModal.question}"</div>
            {!winnerData ? (
              <>
                <div className="form-group">
                  <label>Wat is het juiste antwoord?</label>
                  <div className="tag-select">
                    {winnerModal.tags.map(tag => (
                      <button key={tag} className={`tag-btn ${correctTag===tag?"selected":""}`} onClick={() => setCorrectTag(tag)}>
                        {tag.replace("#","").toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-primary" onClick={pickWinner} disabled={!correctTag}>
                    <Icons.shuffle /> Toon kandidaten
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="winner-result-info">
                  {winnerData.totalCorrect} mensen hadden het juiste antwoord ({correctTag.replace("#","").toUpperCase()})
                </div>
                {winnerData.suggestedWinner && (
                  <div className="suggested-winner">
                    <div className="sw-label">🤖 Bot stelt voor:</div>
                    <div className="sw-card">
                      <div className="sw-name">{winnerData.suggestedWinner.username ? "@"+winnerData.suggestedWinner.username : winnerData.suggestedWinner.first_name}</div>
                      {winnerData.suggestedWinner.uid && <div className="sw-uid">UID: {winnerData.suggestedWinner.uid}</div>}
                      <div className="sw-actions">
                        <button className="btn-sm btn-primary" onClick={() => confirmWinner(winnerData.suggestedWinner.user_id, true)}>
                          ✓ Kies & kondig aan
                        </button>
                        <button className="btn-sm" onClick={() => confirmWinner(winnerData.suggestedWinner.user_id, false)}>
                          Kies zonder aankondiging
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="all-candidates">
                  <div className="ac-label">Of kies zelf uit alle {winnerData.totalCorrect} kandidaten:</div>
                  <div className="ac-list">
                    {winnerData.correctVoters.map((v, i) => (
                      <div key={v.user_id} className="ac-row">
                        <span className="ac-order">#{i+1}</span>
                        <span className="ac-name">{v.username ? "@"+v.username : v.first_name}</span>
                        {v.uid && <span className="ac-uid">{v.uid}</span>}
                        <span className="ac-time">{new Date(v.voted_at).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}</span>
                        <button className="btn-xs btn-primary" onClick={() => confirmWinner(v.user_id, true)}>Kies</button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <CalendarWinners />
    </div>
  );
}

// ── Calendar Winners overview ───────────────────────────────────────────
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
          {[["day","Vandaag"],["week","Deze week"],["month","Deze maand"]].map(([k,l]) => (
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

const TABS = [
  { id: "overview",     label: "Overzicht",      icon: Icons.chart      },
  { id: "calendar",     label: "Content Kalender", icon: Icons.calendar },
  { id: "predictions",  label: "Predicties",     icon: Icons.prediction },
  { id: "leaderboard",  label: "Activiteit",     icon: Icons.trophy     },
  { id: "feedback",     label: "Feedback",       icon: Icons.message    },
  { id: "users",        label: "Gebruikers",     icon: Icons.users      },
  { id: "chatlog",      label: "Chat Log",       icon: Icons.server     },
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
          <div className="user-avatar">👑</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">Owner</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === "overview"    && <OverviewTab />}
        {activeTab === "predictions" && <PredictionsTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
        {activeTab === "feedback"    && <FeedbackTab />}
        {activeTab === "users"       && <UsersTab />}
        {activeTab === "calendar"    && <CalendarTab />}
        {activeTab === "roles"       && <RolesTab />}
        {activeTab === "chatlog"     && <ChatLogTab />}
        {activeTab === "help"        && <HelpTab />}
      </main>
    </div>
  );
}
