// RapportPDF.jsx
// Usage: import RapportPDF from './RapportPDF';
// Then add: <RapportPDF vaccins={vaccins} releves={releves} users={users} alertes={alertes} />

import { useState } from "react";

async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => res(window.jspdf.jsPDF);
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function generatePDF(sections, vaccins, releves, users, alertes) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR");
  const W = 210;
  let y = 0;

  // ── HEADER ──────────────────────────────────────────
  doc.setFillColor(10, 37, 64);
  doc.rect(0, 0, W, 32, "F");
  doc.setFillColor(26, 86, 219);
  doc.rect(0, 32, W, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("VaccineChain Pro", 14, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("I.S.S.I.G Gabès  —  Rapport généré le : " + today, 14, 22);

  // Sections included label
  const sectionNames = sections.map(s => ({
    stock: "Stock", temperature: "Température", notifications: "Alertes",
    releves: "Relevés", login: "Utilisateurs"
  }[s])).join(", ");
  doc.setFontSize(8);
  doc.setTextColor(147, 197, 253);
  doc.text("Sections : " + sectionNames, 14, 29);

  y = 42;

  // ── HELPER FUNCTIONS ────────────────────────────────
  function sectionHeader(title, r, g, b) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(r, g, b);
    doc.rect(0, y, W, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, y + 6);
    y += 14;
  }

  function tableHeader(cols, widths, r, g, b) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(r, g, b);
    doc.rect(14, y, 182, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    let x = 15;
    cols.forEach((col, i) => {
      doc.text(col, x, y + 5);
      x += widths[i];
    });
    y += 7;
  }

  function tableRow(cells, widths, rowIndex, colors) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
    doc.rect(14, y, 182, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    let x = 15;
    cells.forEach((cell, i) => {
      const color = colors && colors[i] ? colors[i] : [30, 41, 59];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(String(cell || "—").slice(0, 25), x, y + 5);
      x += widths[i];
    });
    y += 7;
  }

  // ── STOCK SECTION ───────────────────────────────────
  if (sections.includes("stock")) {
    sectionHeader("📦  STOCK VACCINAL", 10, 37, 64);

    // Summary boxes
    const total = vaccins.length;
    const faible = vaccins.filter(v => v.statut === "faible").length;
    const ok = total - faible;

    doc.setFillColor(240, 253, 250);
    doc.rect(14, y, 55, 18, "F");
    doc.setFillColor(5, 150, 105);
    doc.rect(14, y, 55, 4, "F");
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(String(total), 35, y + 13);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Total vaccins", 17, y + 17);

    doc.setFillColor(255, 247, 237);
    doc.rect(75, y, 55, 18, "F");
    doc.setFillColor(234, 88, 12);
    doc.rect(75, y, 55, 4, "F");
    doc.setTextColor(234, 88, 12);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(String(faible), 96, y + 13);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Stock faible", 78, y + 17);

    doc.setFillColor(240, 253, 244);
    doc.rect(136, y, 55, 18, "F");
    doc.setFillColor(22, 163, 74);
    doc.rect(136, y, 55, 4, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(String(ok), 157, y + 13);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Stock OK", 139, y + 17);

    y += 24;

    tableHeader(["Vaccin", "Lot", "Qté", "Seuil min", "Péremption", "Statut"],
      [38, 24, 18, 22, 32, 20], 10, 37, 64);

    vaccins.forEach((v, i) => {
      const statColor = v.statut === "faible" ? [180, 83, 9] : [5, 150, 105];
      const statText = v.statut === "faible" ? "Faible" : "OK";
      tableRow(
        [v.nom, v.lot || "—", v.quantite, v.seuil_min, v.peremption || "—", statText],
        [38, 24, 18, 22, 32, 20], i,
        [null, null, null, null, null, statColor]
      );
    });
    y += 8;
  }

  // ── TEMPERATURE SECTION ─────────────────────────────
  if (sections.includes("temperature")) {
    if (y > 220) { doc.addPage(); y = 20; }
    sectionHeader("🌡️  RELEVÉS TEMPÉRATURE", 14, 159, 110);

    const relTemp = releves.filter(r => r.temp !== undefined);
    if (relTemp.length > 0) {
      const temps = relTemp.map(r => parseFloat(r.temp));
      const avg = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
      const max = Math.max(...temps).toFixed(1);
      const min = Math.min(...temps).toFixed(1);
      const anomalies = relTemp.filter(r => r.temp > 8 || r.temp < 2).length;

      // Summary
      [
        { label: "Moy.", val: avg + "°C", color: [14, 159, 110] },
        { label: "Max", val: max + "°C", color: [185, 28, 28] },
        { label: "Min", val: min + "°C", color: [26, 86, 219] },
        { label: "Anomalies", val: String(anomalies), color: [180, 83, 9] },
      ].forEach((box, i) => {
        const bx = 14 + i * 47;
        doc.setFillColor(248, 250, 252);
        doc.rect(bx, y, 43, 14, "F");
        doc.setTextColor(box.color[0], box.color[1], box.color[2]);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(box.val, bx + 8, y + 9);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(box.label, bx + 8, y + 13);
      });
      y += 20;
    }

    tableHeader(["Date", "Heure", "Temp (°C)", "Statut", "Responsable", "Observations"],
      [28, 20, 24, 22, 38, 30], 14, 159, 110);

    releves.slice(0, 30).forEach((r, i) => {
      const ok = r.temp >= 2 && r.temp <= 8;
      const lim = r.temp > 6.5 && r.temp <= 8;
      const statColor = !ok ? [185, 28, 28] : lim ? [180, 83, 9] : [5, 150, 105];
      const statText = !ok ? "Anormal" : lim ? "Limite" : "Normal";
      tableRow(
        [r.date, r.heure, r.temp + "°C", statText, r.nom || "—", r.obs || "—"],
        [28, 20, 24, 22, 38, 30], i,
        [null, null, null, statColor, null, null]
      );
    });
    y += 8;
  }

  // ── NOTIFICATIONS / ALERTES SECTION ─────────────────
  if (sections.includes("notifications")) {
    if (y > 220) { doc.addPage(); y = 20; }
    sectionHeader("🚨  ALERTES & NOTIFICATIONS", 185, 28, 28);

    const alerts = alertes || [];
    if (alerts.length === 0) {
      doc.setFillColor(240, 253, 244);
      doc.rect(14, y, 182, 12, "F");
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("✓  Aucune alerte active — Système opérationnel", 20, y + 8);
      y += 18;
    } else {
      tableHeader(["Type", "Message", "Date", "Priorité"],
        [35, 80, 35, 22], 185, 28, 28);
      alerts.forEach((a, i) => {
        const prioColor = a.priorite === "haute" ? [185, 28, 28] : [180, 83, 9];
        tableRow(
          [a.type || "—", a.message || "—", a.date || "—", a.priorite || "—"],
          [35, 80, 35, 22], i,
          [null, null, null, prioColor]
        );
      });
      y += 8;
    }
  }

  // ── RELEVES SECTION ──────────────────────────────────
  if (sections.includes("releves")) {
    if (y > 220) { doc.addPage(); y = 20; }
    sectionHeader("📋  HISTORIQUE DES RELEVÉS", 26, 86, 219);

    tableHeader(["Date", "Heure", "Temp", "Statut", "Infirmier", "Obs"],
      [28, 20, 18, 22, 42, 32], 26, 86, 219);

    releves.forEach((r, i) => {
      const ok = r.temp >= 2 && r.temp <= 8;
      const lim = r.temp > 6.5 && r.temp <= 8;
      const statColor = !ok ? [185, 28, 28] : lim ? [180, 83, 9] : [5, 150, 105];
      const statText = !ok ? "Anormal" : lim ? "Limite" : "Normal";
      tableRow(
        [r.date, r.heure, r.temp + "°C", statText, r.nom || "—", r.obs || "—"],
        [28, 20, 18, 22, 42, 32], i,
        [null, null, null, statColor, null, null]
      );
    });
    y += 8;
  }

  // ── LOGIN / USERS SECTION ────────────────────────────
  if (sections.includes("login")) {
    if (y > 220) { doc.addPage(); y = 20; }
    sectionHeader("👥  UTILISATEURS DU SYSTÈME", 109, 40, 217);

    tableHeader(["Nom", "Email", "Rôle", "Statut"],
      [50, 70, 32, 20], 109, 40, 217);

    (users || []).forEach((u, i) => {
      const roleColor = u.role === "admin" ? [180, 83, 9] : [26, 86, 219];
      tableRow(
        [u.nom || u.name || "—", u.email || "—", u.role || "—", u.actif ? "Actif" : "Inactif"],
        [50, 70, 32, 20], i,
        [null, null, roleColor, null]
      );
    });
    y += 8;
  }

  // ── FOOTER ──────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 244, 248);
    doc.rect(0, 284, W, 13, "F");
    doc.setFillColor(26, 86, 219);
    doc.rect(0, 284, W, 1, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("VaccineChain Pro  ·  I.S.S.I.G Gabès  ·  Confidentiel", 14, 291);
    doc.text("Page " + i + " / " + pages, W - 14, 291, { align: "right" });
  }

  doc.save("VaccineChain_Rapport_" + today.replace(/\//g, "-") + ".pdf");
}

// ── REACT COMPONENT ─────────────────────────────────
export default function RapportPDF({ vaccins = [], releves = [], users = [], alertes = [] }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({
    stock: true,
    temperature: true,
    notifications: true,
    releves: true,
    login: false,
  });

  const options = [
    { key: "stock", label: "📦 Stock vaccinal", desc: vaccins.length + " vaccins" },
    { key: "temperature", label: "🌡️ Température", desc: releves.length + " relevés" },
    { key: "notifications", label: "🚨 Alertes", desc: (alertes?.length || 0) + " alertes" },
    { key: "releves", label: "📋 Historique relevés", desc: "Tous les relevés" },
    { key: "login", label: "👥 Utilisateurs", desc: (users?.length || 0) + " utilisateurs" },
  ];

  const toggle = (key) => setSelected(s => ({ ...s, [key]: !s[key] }));

  const handleGenerate = async () => {
    const sections = Object.keys(selected).filter(k => selected[k]);
    if (sections.length === 0) {
      alert("Veuillez sélectionner au moins une section !");
      return;
    }
    setLoading(true);
    try {
      await generatePDF(sections, vaccins, releves, users, alertes);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    }
    setLoading(false);
    setShow(false);
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        style={{
          background: "linear-gradient(135deg, #1a56db, #0e9f6e)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "9px 18px",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "7px",
          boxShadow: "0 2px 8px rgba(26,86,219,0.3)",
        }}
      >
        📄 Rapport PDF
      </button>

      {show && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px",
        }}>
          <div style={{
            background: "white", borderRadius: "20px", padding: "28px",
            width: "100%", maxWidth: "420px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0a2540", margin: 0 }}>
                  📄 Générer un Rapport PDF
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
                  Choisissez les sections à inclure
                </p>
              </div>
              <button onClick={() => setShow(false)} style={{
                background: "#f1f5f9", border: "none", borderRadius: "8px",
                width: "32px", height: "32px", cursor: "pointer", fontSize: "16px",
              }}>✕</button>
            </div>

            {/* Select All */}
            <div style={{
              display: "flex", gap: "8px", marginBottom: "14px",
            }}>
              <button onClick={() => setSelected({ stock: true, temperature: true, notifications: true, releves: true, login: true })}
                style={{ flex: 1, padding: "7px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", color: "#1e293b" }}>
                ✅ Tout sélectionner
              </button>
              <button onClick={() => setSelected({ stock: false, temperature: false, notifications: false, releves: false, login: false })}
                style={{ flex: 1, padding: "7px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", color: "#1e293b" }}>
                ☐ Tout désélectionner
              </button>
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {options.map(opt => (
                <div key={opt.key}
                  onClick={() => toggle(opt.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px", borderRadius: "12px", cursor: "pointer",
                    border: selected[opt.key] ? "2px solid #1a56db" : "2px solid #e2e8f0",
                    background: selected[opt.key] ? "#eff6ff" : "#f8fafc",
                    transition: "all 0.2s",
                  }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "6px",
                    border: selected[opt.key] ? "none" : "2px solid #cbd5e1",
                    background: selected[opt.key] ? "#1a56db" : "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {selected[opt.key] && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{opt.label}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#94a3b8" : "linear-gradient(135deg, #1a56db, #0e9f6e)",
                color: "white", border: "none", borderRadius: "12px",
                fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 15px rgba(26,86,219,0.3)",
              }}
            >
              {loading ? "⏳ Génération en cours..." : "📥 Télécharger le PDF"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
