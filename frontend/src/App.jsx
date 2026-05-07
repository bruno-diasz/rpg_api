import { useState, useEffect, useCallback } from "react";

const GW = "http://localhost:8000";
const HERO_ID = "1";

const DIFF_COLOR = {
  Fácil: "#4ade80",
  Médio: "#facc15",
  Épico: "#f87171",
};

const STATUS_LABEL = {
  available: "Disponível",
  in_progress: "Em Progresso",
  completed: "Concluída",
};

const STATUS_COLOR = {
  available: "#60a5fa",
  in_progress: "#facc15",
  completed: "#4ade80",
};

export default function App() {
  const [hero, setHero] = useState(null);
  const [stats, setStats] = useState(null);
  const [quests, setQuests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const addLog = useCallback((method, path, status, payload) => {
    const entry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString("pt-BR"),
      method,
      path,
      status,
      payload: JSON.stringify(payload, null, 2),
    };
    setLogs((prev) => [entry, ...prev].slice(0, 30));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const apiFetch = useCallback(
    async (method, path, body = null) => {
      const url = `${GW}${path}`;
      const opts = {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      };
      const res = await fetch(url, opts);
      const json = await res.json();
      addLog(method, path, res.status, json);
      if (!res.ok) throw new Error(json.detail || "Erro na requisição");
      return json.data;
    },
    [addLog],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [h, s, q] = await Promise.all([
        apiFetch("GET", `/api/heroes/${HERO_ID}`),
        apiFetch("GET", `/api/heroes/${HERO_ID}/stats`),
        apiFetch("GET", "/api/quests"),
      ]);
      setHero(h);
      setStats(s);
      setQuests(q.quests || []);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const acceptQuest = async (questId) => {
    try {
      const res = await apiFetch("POST", `/api/quests/${questId}/accept`, {
        hero_id: HERO_ID,
      });
      showToast(res.message);
      await loadAll();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const completeQuest = async (quest) => {
    try {
      const res = await apiFetch("POST", `/api/quests/${quest.id}/complete`);
      showToast(res.message);
      await apiFetch("PATCH", `/api/heroes/${HERO_ID}/xp`, {
        amount: quest.reward_xp,
      });
      await loadAll();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const xpPct = hero ? Math.round((hero.xp / hero.xp_next) * 100) : 0;
  const hpPct = hero ? Math.round((hero.hp / hero.max_hp) * 100) : 0;
  const mpPct = hero ? Math.round((hero.mp / hero.max_mp) * 100) : 0;

  return (
    <div style={styles.root}>
      {/* HEADER */}
      <header style={styles.header}>
        <span style={styles.headerTitle}>⚔️ Quadro de Missões</span>
      </header>

      {/* TOAST */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === "error" ? "#ef4444" : "#22c55e",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={styles.body}>
        {/* LEFT — HERO */}
        <aside style={styles.sidebar}>
          {hero ? (
            <div style={styles.heroCard}>
              <div style={styles.heroAvatar}>{hero.avatar}</div>
              <div style={styles.heroName}>{hero.name}</div>
              <div style={styles.heroClass}>{hero.class_name}</div>
              <div style={styles.heroLevel}>Nível {hero.level}</div>

              <div style={styles.bars}>
                <Bar
                  label="HP"
                  value={hero.hp}
                  max={hero.max_hp}
                  pct={hpPct}
                  color="#ef4444"
                />
                <Bar
                  label="MP"
                  value={hero.mp}
                  max={hero.max_mp}
                  pct={mpPct}
                  color="#818cf8"
                />
                <Bar
                  label="XP"
                  value={hero.xp}
                  max={hero.xp_next}
                  pct={xpPct}
                  color="#facc15"
                />
              </div>

              <div style={styles.gold}>💰 {hero.gold} ouro</div>

              {stats && (
                <div style={styles.statsGrid}>
                  <StatBox label="ATK" value={stats.atk} icon="⚔️" />
                  <StatBox label="DEF" value={stats.def_} icon="🛡️" />
                  <StatBox label="SPD" value={stats.spd} icon="💨" />
                  <StatBox label="INT" value={stats.int_} icon="🧠" />
                </div>
              )}
            </div>
          ) : (
            <div style={styles.skeleton}>Carregando herói...</div>
          )}
        </aside>

        {/* CENTER — QUESTS */}
        <main style={styles.main}>
          <h2 style={styles.sectionTitle}>📜 Mural de Missões</h2>
          <div style={styles.questList}>
            {quests.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                onAccept={acceptQuest}
                onComplete={completeQuest}
              />
            ))}
          </div>
        </main>

        {/* RIGHT — LOG */}
        <aside style={styles.logPanel}>
          <h3 style={styles.logTitle}>🔌 API Log</h3>
          <div style={styles.logScroll}>
            {logs.length === 0 && (
              <div style={styles.logEmpty}>Nenhuma requisição ainda...</div>
            )}
            {logs.map((l) => (
              <LogEntry key={l.id} log={l} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Bar({ label, value, max, pct, color }) {
  return (
    <div style={styles.barRow}>
      <span style={styles.barLabel}>{label}</span>
      <div style={styles.barTrack}>
        <div
          style={{ ...styles.barFill, width: `${pct}%`, background: color }}
        />
      </div>
      <span style={styles.barVal}>
        {value}/{max}
      </span>
    </div>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div style={styles.statBox}>
      <span>{icon}</span>
      <span style={styles.statVal}>{value ?? "—"}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function QuestCard({ quest, onAccept, onComplete }) {
  const diffColor = DIFF_COLOR[quest.difficulty] || "#aaa";
  const statusColor = STATUS_COLOR[quest.status] || "#aaa";

  return (
    <div style={styles.questCard}>
      <div style={styles.questHeader}>
        <span style={styles.questIcon}>{quest.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={styles.questTitle}>{quest.title}</div>
          <div style={styles.questDesc}>{quest.description}</div>
        </div>
        <div style={styles.questMeta}>
          <span
            style={{
              ...styles.badge,
              color: diffColor,
              borderColor: diffColor,
            }}
          >
            {quest.difficulty}
          </span>
          <span
            style={{
              ...styles.badge,
              color: statusColor,
              borderColor: statusColor,
            }}
          >
            {STATUS_LABEL[quest.status]}
          </span>
        </div>
      </div>

      <div style={styles.questFooter}>
        <span style={styles.reward}>✨ {quest.reward_xp} XP</span>
        <span style={styles.reward}>💰 {quest.reward_gold} ouro</span>
        <div style={{ marginLeft: "auto" }}>
          {quest.status === "available" && (
            <button style={styles.btnAccept} onClick={() => onAccept(quest.id)}>
              ⚔️ Aceitar
            </button>
          )}
          {quest.status === "in_progress" && (
            <button
              style={styles.btnComplete}
              onClick={() => onComplete(quest)}
            >
              ✅ Concluir
            </button>
          )}
          {quest.status === "completed" && (
            <span style={styles.doneLabel}>🏆 Completa</span>
          )}
        </div>
      </div>
    </div>
  );
}

function LogEntry({ log }) {
  const [open, setOpen] = useState(false);
  const methodColor =
    {
      GET: "#60a5fa",
      POST: "#4ade80",
      PATCH: "#facc15",
      DELETE: "#f87171",
    }[log.method] || "#aaa";
  const ok = log.status < 400;

  return (
    <div style={styles.logEntry} onClick={() => setOpen((o) => !o)}>
      <div style={styles.logLine}>
        <span style={{ ...styles.logMethod, color: methodColor }}>
          {log.method}
        </span>
        <span style={styles.logPath}>{log.path}</span>
        <span
          style={{ ...styles.logStatus, color: ok ? "#4ade80" : "#f87171" }}
        >
          {log.status}
        </span>
        <span style={styles.logTime}>{log.time}</span>
      </div>
      {open && <pre style={styles.logPayload}>{log.payload}</pre>}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0f0e17",
    color: "#e8e6f0",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#1a1830",
    borderBottom: "1px solid #2e2b4a",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: 700, color: "#f5c518" },
  toast: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 999,
    padding: "10px 20px",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
  body: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "260px 1fr 320px",
    gap: 0,
    overflow: "hidden",
  },
  sidebar: {
    background: "#131222",
    borderRight: "1px solid #1e1c35",
    padding: 16,
    overflowY: "auto",
  },
  heroCard: { display: "flex", flexDirection: "column", gap: 10 },
  heroAvatar: { fontSize: 56, textAlign: "center" },
  heroName: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    color: "#f5c518",
  },
  heroClass: { fontSize: 13, textAlign: "center", color: "#a78bfa" },
  heroLevel: {
    textAlign: "center",
    background: "#2e2b4a",
    borderRadius: 20,
    padding: "3px 12px",
    fontSize: 13,
    color: "#e8e6f0",
    alignSelf: "center",
  },
  bars: { display: "flex", flexDirection: "column", gap: 6 },
  barRow: { display: "flex", alignItems: "center", gap: 6 },
  barLabel: { width: 24, fontSize: 11, color: "#888" },
  barTrack: {
    flex: 1,
    height: 6,
    background: "#1e1c35",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  barVal: { fontSize: 10, color: "#666", width: 50, textAlign: "right" },
  gold: { textAlign: "center", fontSize: 14, color: "#facc15" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  statBox: {
    background: "#1a1830",
    border: "1px solid #2e2b4a",
    borderRadius: 8,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  statVal: { fontSize: 18, fontWeight: 700, color: "#e8e6f0" },
  statLabel: { fontSize: 10, color: "#666" },

  skeleton: { color: "#555", textAlign: "center", marginTop: 40 },
  main: {
    padding: "20px 24px",
    overflowY: "auto",
    background: "#0f0e17",
  },
  sectionTitle: { margin: "0 0 12px", fontSize: 18, color: "#f5c518" },

  questList: { display: "flex", flexDirection: "column", gap: 12 },
  questCard: {
    background: "#131222",
    border: "1px solid #1e1c35",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "border-color 0.2s",
  },
  questHeader: { display: "flex", gap: 12, alignItems: "flex-start" },
  questIcon: { fontSize: 28 },
  questTitle: { fontWeight: 700, fontSize: 15, color: "#e8e6f0" },
  questDesc: { fontSize: 13, color: "#888", marginTop: 2 },
  questMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  badge: {
    fontSize: 11,
    border: "1px solid",
    borderRadius: 20,
    padding: "2px 8px",
    whiteSpace: "nowrap",
  },
  questFooter: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  reward: { fontSize: 13, color: "#a78bfa" },
  tag: {
    fontSize: 11,
    background: "#1a1830",
    border: "1px solid #2e2b4a",
    borderRadius: 4,
    padding: "2px 6px",
    color: "#666",
  },
  btnAccept: {
    background: "#1e3a5f",
    border: "1px solid #60a5fa",
    color: "#60a5fa",
    borderRadius: 6,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  btnComplete: {
    background: "#14432a",
    border: "1px solid #4ade80",
    color: "#4ade80",
    borderRadius: 6,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  doneLabel: { fontSize: 13, color: "#4ade80" },
  logPanel: {
    background: "#0a0912",
    borderLeft: "1px solid #1e1c35",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  logTitle: {
    margin: 0,
    padding: "12px 16px",
    fontSize: 14,
    borderBottom: "1px solid #1e1c35",
    color: "#f5c518",
  },
  logScroll: { flex: 1, overflowY: "auto", padding: 8 },
  logEmpty: { color: "#444", fontSize: 12, textAlign: "center", marginTop: 20 },
  logEntry: {
    background: "#131222",
    border: "1px solid #1e1c35",
    borderRadius: 6,
    padding: "6px 8px",
    marginBottom: 6,
    cursor: "pointer",
    fontSize: 12,
  },
  logLine: { display: "flex", gap: 6, alignItems: "center" },
  logMethod: { fontWeight: 700, width: 40, fontSize: 11 },
  logPath: {
    flex: 1,
    color: "#aaa",
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logStatus: { fontWeight: 700, fontSize: 11 },
  logTime: { color: "#444", fontSize: 10 },
  logPayload: {
    marginTop: 6,
    fontSize: 10,
    color: "#777",
    background: "#0a0912",
    padding: 6,
    borderRadius: 4,
    overflow: "auto",
    maxHeight: 200,
  },
};
