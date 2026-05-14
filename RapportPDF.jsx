// ============================================================
//  RapportPDF.jsx  –  Vaccine Chain PDF Export Module
//  Drop this component anywhere in your App.jsx and pass the
//  Supabase client as a prop:  <RapportPDF supabase={supabase} />
// ============================================================
import { useState, useRef } from "react";

// ─── tiny helpers ────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => {
  if (!d) return "–";
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};
const today = () => {
  const d = new Date();
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

// ─── colour palette ──────────────────────────────────────────
const C = {
  primary: "#1B4F72",
  secondary: "#2E86AB",
  accent: "#A8D8EA",
  danger: "#C0392B",
  warning: "#E67E22",
  success: "#1E8449",
  light: "#F4F6F9",
  mid: "#D5D8DC",
  dark: "#1A1A2E",
  text: "#2C3E50",
};

// ─── CSS injected into every print/export window ─────────────
const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans', sans-serif; font-size: 11px;
         color: ${C.text}; background: #fff; }
  .page { width: 210mm; min-height: 297mm; padding: 14mm 16mm;
          margin: 0 auto; page-break-after: always; }
  .page:last-child { page-break-after: avoid; }

  /* ── COVER ── */
  .cover { display: flex; flex-direction: column; justify-content: center;
           align-items: center; min-height: 297mm; background: ${C.primary};
           color: #fff; text-align: center; gap: 24px; }
  .cover .logo-row { display: flex; gap: 32px; align-items: center;
                     margin-bottom: 16px; }
  .cover img { height: 72px; filter: brightness(0) invert(1); object-fit: contain; }
  .cover h1 { font-family: 'Playfair Display', serif; font-size: 32px;
              letter-spacing: 1px; line-height: 1.2; }
  .cover .sub { font-size: 14px; opacity: .75; letter-spacing: 2px;
                text-transform: uppercase; }
  .cover .meta { margin-top: 32px; border-top: 1px solid rgba(255,255,255,.3);
                 padding-top: 20px; font-size: 12px; opacity: .8; line-height: 2; }
  .cover .stripe { position: absolute; bottom: 0; left: 0; right: 0;
                   height: 8px;
                   background: linear-gradient(90deg,${C.secondary},${C.accent}); }

  /* ── SECTION HEADER ── */
  .section-header { display: flex; align-items: center; gap: 10px;
                    margin-bottom: 14px; padding-bottom: 8px;
                    border-bottom: 2px solid ${C.primary}; }
  .section-icon { width: 28px; height: 28px; border-radius: 6px;
                  background: ${C.primary}; color: #fff;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 14px; flex-shrink: 0; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 16px;
                   color: ${C.primary}; }
  .section-sub { font-size: 10px; color: #888; margin-top: 1px; }

  /* ── SUMMARY CARDS ── */
  .cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px;
           margin-bottom: 16px; }
  .card { border-radius: 8px; padding: 12px 14px;
          border-left: 4px solid ${C.primary}; background: ${C.light}; }
  .card.danger { border-color: ${C.danger}; }
  .card.warning { border-color: ${C.warning}; }
  .card.success { border-color: ${C.success}; }
  .card .num { font-size: 22px; font-weight: 600; color: ${C.primary}; }
  .card.danger .num { color: ${C.danger}; }
  .card.warning .num { color: ${C.warning}; }
  .card.success .num { color: ${C.success}; }
  .card .lbl { font-size: 9px; text-transform: uppercase;
               letter-spacing: 1px; color: #888; margin-top: 2px; }

  /* ── TABLES ── */
  table { width: 100%; border-collapse: collapse; font-size: 10px;
          margin-bottom: 16px; }
  thead tr { background: ${C.primary}; color: #fff; }
  thead th { padding: 7px 8px; text-align: left; font-weight: 600;
             letter-spacing: .5px; text-transform: uppercase; font-size: 9px; }
  tbody tr:nth-child(even) { background: ${C.light}; }
  tbody td { padding: 6px 8px; border-bottom: 1px solid ${C.mid}; }
  tbody tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px;
           font-size: 9px; font-weight: 600; text-transform: uppercase; }
  .badge-ok    { background: #D5F5E3; color: ${C.success}; }
  .badge-warn  { background: #FAD7A0; color: ${C.warning}; }
  .badge-err   { background: #FADBD8; color: ${C.danger}; }
  .badge-info  { background: #D6EAF8; color: ${C.secondary}; }
  .no-data { text-align: center; color: #aaa; padding: 20px;
             font-style: italic; }

  /* ── FOOTER ── */
  .page-footer { position: fixed; bottom: 10mm; left: 16mm; right: 16mm;
                 display: flex; justify-content: space-between;
                 font-size: 9px; color: #aaa;
                 border-top: 1px solid ${C.mid}; padding-top: 6px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
`;

// ─── build the full HTML document ────────────────────────────
function buildHTML({ sections, logoUni, logoApp, reportDate, author, periode }) {
  const escape = (s) =>
    String(s ?? "–")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const badge = (val, type) =>
    `<span class="badge badge-${type}">${escape(val)}</span>`;

  const statusBadge = (s) => {
    s = String(s ?? "").toLowerCase();
    if (s.includes("ok") || s.includes("normal") || s.includes("valide"))
      return badge(s, "ok");
    if (s.includes("warn") || s.includes("alerte") || s.includes("faible"))
      return badge(s, "warn");
    if (s.includes("err") || s.includes("critique") || s.includes("expir"))
      return badge(s, "err");
    return badge(s, "info");
  };

  // ── page template
  const page = (content, idx) => `
    <div class="page">
      ${content}
      <div class="page-footer">
        <span>Système de Gestion Chaîne du Froid – Vaccins</span>
        <span>Rapport du ${reportDate} &nbsp;|&nbsp; Page ${idx}</span>
      </div>
    </div>`;

  // ── cover page
  const cover = `
    <div class="page cover" style="position:relative;">
      <div class="logo-row">
        ${logoUni ? `<img src="${logoUni}" alt="Université">` : ""}
        ${logoApp ? `<img src="${logoApp}" alt="App">` : ""}
      </div>
      <div class="sub">République Tunisienne – Ministère de la Santé</div>
      <h1>Rapport de Gestion<br>Chaîne du Froid Vaccins</h1>
      <div class="meta">
        <div><strong>Date de génération :</strong> ${reportDate}</div>
        ${periode ? `<div><strong>Période :</strong> ${escape(periode)}</div>` : ""}
        ${author ? `<div><strong>Généré par :</strong> ${escape(author)}</div>` : ""}
        <div><strong>Sections incluses :</strong> ${sections.map((s) => s.title).join(", ")}</div>
      </div>
      <div class="stripe"></div>
    </div>`;

  // ── each data section
  const dataPages = sections.map((sec, i) => {
    const cards = sec.cards
      ? `<div class="cards">${sec.cards
          .map(
            (c) =>
              `<div class="card ${c.type || ""}">
                <div class="num">${escape(c.value)}</div>
                <div class="lbl">${escape(c.label)}</div>
               </div>`
          )
          .join("")}</div>`
      : "";

    let tableHtml = "";
    if (sec.rows && sec.rows.length > 0) {
      const cols = sec.columns || Object.keys(sec.rows[0]);
      tableHtml = `
        <table>
          <thead><tr>${cols
            .map((c) => `<th>${escape(c.label ?? c)}</th>`)
            .join("")}</tr></thead>
          <tbody>
            ${sec.rows
              .map((row) => {
                const cells = cols.map((c) => {
                  const key = c.key ?? c;
                  const val = row[key];
                  if (c.badge) return `<td>${statusBadge(val)}</td>`;
                  if (c.date) return `<td>${fmtDate(val)}</td>`;
                  return `<td>${escape(val)}</td>`;
                });
                return `<tr>${cells.join("")}</tr>`;
              })
              .join("")}
          </tbody>
        </table>`;
    } else {
      tableHtml = `<div class="no-data">Aucune donnée disponible pour cette section.</div>`;
    }

    const header = `
      <div class="section-header">
        <div class="section-icon">${sec.icon ?? "📋"}</div>
        <div>
          <div class="section-title">${escape(sec.title)}</div>
          ${sec.subtitle ? `<div class="section-sub">${escape(sec.subtitle)}</div>` : ""}
        </div>
      </div>`;

    return page(header + cards + tableHtml, i + 2);
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport – Chaîne du Froid Vaccins</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${cover}
  ${dataPages.join("\n")}
</body>
</html>`;
}

// ─── Main component ───────────────────────────────────────────
export default function RapportPDF({ supabase, logoUni, logoApp }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [author, setAuthor] = useState("");
  const [periode, setPeriode] = useState("");

  // Section toggles
  const [inclStock, setInclStock] = useState(true);
  const [inclNotif, setInclNotif] = useState(true);
  const [inclLog, setInclLog] = useState(true);
  const [inclReleve, setInclReleve] = useState(true);
  const [inclExpiry, setInclExpiry] = useState(true);

  // Date filter
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const printRef = useRef(null);

  // ── fetch all data from Supabase ──────────────────────────
  async function fetchAll() {
    const filter = (q) => {
      if (dateFrom) q = q.gte("created_at", dateFrom);
      if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
      return q;
    };

    const [stock, notif, logs, releve, vaccins] = await Promise.all([
      inclStock
        ? supabase.from("stocks").select("*").order("created_at", { ascending: false })
        : { data: [] },
      inclNotif
        ? filter(supabase.from("notifications").select("*").order("created_at", { ascending: false }))
        : { data: [] },
      inclLog
        ? filter(supabase.from("logs").select("*").order("created_at", { ascending: false }))
        : { data: [] },
      inclReleve
        ? filter(supabase.from("releves_temperature").select("*").order("created_at", { ascending: false }))
        : { data: [] },
      inclExpiry
        ? supabase.from("vaccins").select("*").order("date_expiration", { ascending: true })
        : { data: [] },
    ]);

    return {
      stock: stock.data ?? [],
      notif: notif.data ?? [],
      logs: logs.data ?? [],
      releve: releve.data ?? [],
      vaccins: vaccins.data ?? [],
    };
  }

  // ── derive summary cards ──────────────────────────────────
  function buildCards(data) {
    return {
      stock: [
        { label: "Produits en stock", value: data.stock.length, type: "" },
        {
          label: "Stock critique (< 10)",
          value: data.stock.filter((s) => (s.quantite ?? s.quantity ?? 0) < 10).length,
          type: "danger",
        },
        {
          label: "Stock suffisant",
          value: data.stock.filter((s) => (s.quantite ?? s.quantity ?? 0) >= 10).length,
          type: "success",
        },
        {
          label: "Total unités",
          value: data.stock.reduce((a, s) => a + (s.quantite ?? s.quantity ?? 0), 0),
          type: "",
        },
      ],
      notif: [
        { label: "Total notifications", value: data.notif.length, type: "" },
        {
          label: "Non lues",
          value: data.notif.filter((n) => !n.lu && !n.read).length,
          type: "warning",
        },
        {
          label: "Critiques",
          value: data.notif.filter(
            (n) => (n.type ?? n.niveau ?? "").toLowerCase().includes("crit")
          ).length,
          type: "danger",
        },
        {
          label: "Résolues",
          value: data.notif.filter((n) => n.lu || n.read).length,
          type: "success",
        },
      ],
      releve: [
        { label: "Relevés", value: data.releve.length, type: "" },
        {
          label: "Hors plage (>8°C)",
          value: data.releve.filter((r) => (r.temperature ?? r.temp ?? 0) > 8).length,
          type: "danger",
        },
        {
          label: "Hors plage (<2°C)",
          value: data.releve.filter((r) => (r.temperature ?? r.temp ?? 0) < 2).length,
          type: "warning",
        },
        {
          label: "Dans la norme",
          value: data.releve.filter(
            (r) => (r.temperature ?? r.temp ?? 0) >= 2 && (r.temperature ?? r.temp ?? 0) <= 8
          ).length,
          type: "success",
        },
      ],
    };
  }

  // ── assemble sections ─────────────────────────────────────
  function buildSections(data) {
    const cards = buildCards(data);
    const secs = [];

    if (inclStock) {
      const stockCols = [
        { key: "nom", label: "Vaccin / Produit" },
        { key: "quantite", label: "Quantité" },
        { key: "lot", label: "N° Lot" },
        { key: "localisation", label: "Localisation" },
        { key: "statut", label: "Statut", badge: true },
        { key: "created_at", label: "Mis à jour", date: true },
      ];
      secs.push({
        icon: "💉",
        title: "Gestion des Stocks",
        subtitle: `${data.stock.length} produit(s) enregistré(s)`,
        cards: cards.stock,
        columns: stockCols,
        rows: data.stock,
      });
    }

    if (inclExpiry && data.vaccins.length > 0) {
      const now = new Date();
      const expCols = [
        { key: "nom", label: "Vaccin" },
        { key: "fabricant", label: "Fabricant" },
        { key: "lot", label: "N° Lot" },
        { key: "quantite", label: "Qté" },
        { key: "date_expiration", label: "Date expiration", date: true },
        { key: "jours_restants", label: "Jours restants" },
        { key: "_status", label: "Statut", badge: true },
      ];
      const expRows = data.vaccins.map((v) => {
        const exp = v.date_expiration ? new Date(v.date_expiration) : null;
        const diff = exp ? Math.ceil((exp - now) / 86400000) : null;
        return {
          ...v,
          jours_restants: diff !== null ? diff : "–",
          _status:
            diff === null
              ? "inconnu"
              : diff < 0
              ? "expiré"
              : diff < 30
              ? "expire bientôt"
              : "valide",
        };
      });
      secs.push({
        icon: "⏳",
        title: "Suivi des Expirations",
        subtitle: "Vaccins classés par date d'expiration",
        columns: expCols,
        rows: expRows,
      });
    }

    if (inclReleve) {
      const relCols = [
        { key: "created_at", label: "Date & heure", date: true },
        { key: "equipement", label: "Équipement" },
        { key: "temperature", label: "Température (°C)" },
        { key: "humidite", label: "Humidité (%)" },
        { key: "operateur", label: "Opérateur" },
        { key: "statut", label: "Statut", badge: true },
      ];
      secs.push({
        icon: "🌡",
        title: "Relevés de Température",
        subtitle: `${data.releve.length} relevé(s) – Plage normale : 2°C à 8°C`,
        cards: cards.releve,
        columns: relCols,
        rows: data.releve,
      });
    }

    if (inclNotif) {
      const notifCols = [
        { key: "created_at", label: "Date", date: true },
        { key: "titre", label: "Titre" },
        { key: "message", label: "Message" },
        { key: "type", label: "Type", badge: true },
        { key: "source", label: "Source" },
        { key: "lu", label: "Lue", badge: true },
      ];
      const notifRows = data.notif.map((n) => ({
        ...n,
        lu: n.lu || n.read ? "oui" : "non",
      }));
      secs.push({
        icon: "🔔",
        title: "Notifications & Alertes",
        subtitle: `${data.notif.length} notification(s)`,
        cards: cards.notif,
        columns: notifCols,
        rows: notifRows,
      });
    }

    if (inclLog) {
      const logCols = [
        { key: "created_at", label: "Date", date: true },
        { key: "action", label: "Action" },
        { key: "utilisateur", label: "Utilisateur" },
        { key: "details", label: "Détails" },
        { key: "ip", label: "IP" },
        { key: "module", label: "Module" },
      ];
      secs.push({
        icon: "📜",
        title: "Journal d'Activité (Logs)",
        subtitle: `${data.logs.length} entrée(s) de journal`,
        columns: logCols,
        rows: data.logs,
      });
    }

    return secs;
  }

  // ── generate & open print window ─────────────────────────
  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAll();
      const sections = buildSections(data);
      if (sections.length === 0) {
        setError("Sélectionnez au moins une section à inclure.");
        setLoading(false);
        return;
      }
      const html = buildHTML({
        sections,
        logoUni,
        logoApp,
        reportDate: today(),
        author,
        periode,
      });

      // open print window
      const w = window.open("", "_blank", "width=900,height=700");
      w.document.write(html);
      w.document.close();
      w.onload = () => {
        setTimeout(() => {
          w.focus();
          w.print();
        }, 600);
      };
    } catch (e) {
      setError("Erreur lors de la génération : " + e.message);
    }
    setLoading(false);
  }

  // ─────────────────────────────────────────────────────────────
  //  RENDER  (modal trigger + panel)
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          background: C.primary,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(27,79,114,.3)",
          transition: "all .2s",
        }}
        onMouseEnter={(e) => (e.target.style.background = C.secondary)}
        onMouseLeave={(e) => (e.target.style.background = C.primary)}
      >
        📄 Générer Rapport PDF
      </button>

      {/* ── modal overlay ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "min(560px, 96vw)",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,.3)",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            {/* header */}
            <div
              style={{
                background: C.primary,
                color: "#fff",
                padding: "20px 24px",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  📄 Rapport PDF – Chaîne du Froid
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                  Sélectionnez les sections à exporter
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,.15)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {/* body */}
            <div style={{ padding: "24px" }}>
              {/* sections */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "#888",
                    marginBottom: 12,
                  }}
                >
                  Sections à inclure
                </div>
                {[
                  { label: "💉 Gestion des Stocks", state: inclStock, set: setInclStock },
                  { label: "⏳ Suivi des Expirations", state: inclExpiry, set: setInclExpiry },
                  { label: "🌡 Relevés de Température", state: inclReleve, set: setInclReleve },
                  { label: "🔔 Notifications & Alertes", state: inclNotif, set: setInclNotif },
                  { label: "📜 Journal d'Activité (Logs)", state: inclLog, set: setInclLog },
                ].map(({ label, state, set }) => (
                  <label
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      marginBottom: 6,
                      borderRadius: 8,
                      background: state ? "#EBF5FB" : "#F8F9FA",
                      border: `1.5px solid ${state ? C.secondary : "#E0E0E0"}`,
                      cursor: "pointer",
                      transition: "all .15s",
                      fontSize: 13,
                      fontWeight: state ? 600 : 400,
                      color: state ? C.primary : "#555",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={(e) => set(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: C.primary }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* filters */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "#888",
                    marginBottom: 12,
                  }}
                >
                  Filtres de période
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { lbl: "Du", val: dateFrom, set: setDateFrom, type: "date" },
                    { lbl: "Au", val: dateTo, set: setDateTo, type: "date" },
                  ].map(({ lbl, val, set, type }) => (
                    <div key={lbl}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{lbl}</div>
                      <input
                        type={type}
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 7,
                          border: "1.5px solid #DDD",
                          fontSize: 13,
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* metadata */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "#888",
                    marginBottom: 12,
                  }}
                >
                  Informations du rapport
                </div>
                {[
                  { lbl: "Généré par (nom)", val: author, set: setAuthor, ph: "Ex: Dr. Ben Ali" },
                  { lbl: "Période (description)", val: periode, set: setPeriode, ph: "Ex: Janvier – Mars 2025" },
                ].map(({ lbl, val, set, ph }) => (
                  <div key={lbl} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{lbl}</div>
                    <input
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder={ph}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 7,
                        border: "1.5px solid #DDD",
                        fontSize: 13,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* error */}
              {error && (
                <div
                  style={{
                    background: "#FADBD8",
                    color: C.danger,
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              {/* action */}
              <button
                onClick={generate}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading ? "#95A5A6" : C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background .2s",
                }}
              >
                {loading ? (
                  <>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                    Chargement des données…
                  </>
                ) : (
                  <>📥 Générer & Télécharger PDF</>
                )}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
