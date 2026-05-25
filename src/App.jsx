import AppConfig from "./config";
import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, CategoryScale, LinearScale, BarElement, Legend } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, CategoryScale, LinearScale, BarElement, Legend);

const CATS = {
  expense: [
    { name: "Comida", color: "#D85A30" },
    { name: "Transporte", color: "#BA7517" },
    { name: "Salud", color: "#D4537E" },
    { name: "Hogar", color: "#7F77DD" },
    { name: "Entretenimiento", color: "#534AB7" },
    { name: "Ropa", color: "#1D9E75" },
    { name: "Educación", color: "#639922" },
    { name: "Otros", color: "#888780" },
  ],
  income: [
    { name: "Salario", color: "#1D9E75" },
    { name: "Freelance", color: "#0F6E56" },
    { name: "Inversión", color: "#085041" },
    { name: "Regalo", color: "#5DCAA5" },
    { name: "Otros", color: "#888780" },
  ],
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const fmt = (v) => AppConfig.currency + Math.round(v).toLocaleString(AppConfig.locale);
const today = () => new Date().toISOString().split("T")[0];

export default function App() {
  const [transactions, setTransactions] = useState(() =>
    JSON.parse(localStorage.getItem(AppConfig.storageKey) || "[]")
  );
  const [tab, setTab] = useState("movimientos");
  const [filter, setFilter] = useState("todos");
  const [viewDate, setViewDate] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [type, setType] = useState("expense");
  const [form, setForm] = useState({ title: "", amount: "", category: "Comida", date: today() });
  const [budgets, setBudgets] = useState(() =>
  JSON.parse(localStorage.getItem(AppConfig.storageKeyBudget) || "{}")
);
const [budgetModal, setBudgetModal] = useState(false);
const [budgetForm, setBudgetForm] = useState({ category: "Comida", amount: "" });

  useEffect(() => {
    localStorage.setItem(AppConfig.storageKey, JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
  localStorage.setItem(AppConfig.storageKeyBudget, JSON.stringify(budgets));
}, [budgets]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  });

  const filtered = [...monthTxs]
    .filter((t) => filter === "todos" || t.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const changeMonth = (d) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + d, 1));

  const openModal = () => {
    setType("expense");
    setForm({ title: "", amount: "", category: "Comida", date: today() });
    setModal(true);
  };

  const saveTransaction = () => {
    if (!form.title.trim()) return alert("Escribe una descripción");
    if (!form.amount || parseFloat(form.amount) <= 0) return alert("Ingresa un monto válido");
    setTransactions([...transactions, {
      id: Date.now().toString(),
      title: form.title,
      amount: parseFloat(form.amount),
      type,
      category: form.category,
      date: form.date,
    }]);
    setModal(false);
  };

  const deleteTx = (id) => {
    if (confirm("¿Eliminar este movimiento?"))
      setTransactions(transactions.filter((t) => t.id !== id));
  };

  const catColors = {};
  [...CATS.expense, ...CATS.income].forEach((c) => (catColors[c.name] = c.color));

  // Reporte: gastos por categoría
  const expByCat = {};
  CATS.expense.forEach((c) => (expByCat[c.name] = 0));
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    expByCat[t.category] = (expByCat[t.category] || 0) + t.amount;
  });
  const catEntries = Object.entries(expByCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const totalExp = catEntries.reduce((s, [, v]) => s + v, 0);

  // Reporte: últimos 6 meses
  const now = new Date();
  const barLabels = [];
  const barInc = [];
  const barExp = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    barLabels.push(MONTHS[d.getMonth()].slice(0, 3));
    barInc.push(Math.round(transactions.filter((t) => t.type === "income" && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear()).reduce((s, t) => s + t.amount, 0)));
    barExp.push(Math.round(transactions.filter((t) => t.type === "expense" && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear()).reduce((s, t) => s + t.amount, 0)));
  }

  const styles = {
    app: { maxWidth: 480, margin: "0 auto", padding: "1.25rem 1rem 5rem", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#F4F3FB", color: "#1a1a2e" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" },
    avatar: { width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${AppConfig.colors.primary},${AppConfig.colors.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" },
    balCard: { background: "linear-gradient(135deg,#7F77DD 0%,#3C3489 100%)", borderRadius: 20, padding: "1.5rem", marginBottom: "1.25rem", position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(127,119,221,0.35)" },
    statPill: { background: "rgba(255,255,255,0.13)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 9 },
    card: { background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem", boxShadow: "0 2px 12px rgba(127,119,221,0.10)" },
    tab: (active) => ({ flex: 1, padding: "9px 8px", border: "none", background: active ? "#EEEDFE" : "transparent", color: active ? "#3C3489" : "#6b6b8a", fontWeight: active ? 600 : 400, borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }),
    filterBtn: (active) => ({ padding: "6px 14px", border: "1px solid", borderColor: active ? "#7F77DD" : "rgba(127,119,221,0.15)", borderRadius: 99, background: active ? "#7F77DD" : "#fff", color: active ? "#fff" : "#6b6b8a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }),
    addBtn: { width: "100%", padding: 12, background: "#fff", border: "1.5px dashed #AFA9EC", borderRadius: 12, color: "#7F77DD", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: "1rem" },
    txItem: { background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8, boxShadow: "0 2px 12px rgba(127,119,221,0.08)" },
    typeBtn: (t, active) => ({ flex: 1, padding: 10, border: "1.5px solid", borderColor: active ? (t === "expense" ? "#D85A30" : "#1D9E75") : "rgba(127,119,221,0.15)", borderRadius: 8, background: active ? (t === "expense" ? "#FAECE7" : "#E1F5EE") : "transparent", color: active ? (t === "expense" ? "#712B13" : "#085041") : "#6b6b8a", fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }),
    input: { width: "100%", padding: "11px 14px", border: "1.5px solid rgba(127,119,221,0.2)", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#1a1a2e", background: "#F8F7FD", outline: "none" },
    btnSave: { flex: 2, padding: 12, background: "linear-gradient(135deg,#7F77DD,#3C3489)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "#fff", fontWeight: 600 },
    btnCancel: { flex: 1, padding: 12, background: "transparent", border: "1.5px solid rgba(127,119,221,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "#6b6b8a", fontWeight: 500 },
    navBtn: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 6, background: "none", border: "none", cursor: "pointer", color: active ? "#7F77DD" : "#9999b3", fontSize: 10, fontFamily: "'DM Sans',sans-serif" }),
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={styles.app}>

        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.avatar}>{AppConfig.initials}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{AppConfig.name}</div>
              <div style={{ fontSize: 11, color: "#6b6b8a" }}>{new Date().toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
          </div>
          <button onClick={openModal} style={{ background: "#EEEDFE", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 22, color: "#3C3489" }}>+</button>
        </div>

        {/* Balance */}
        <div style={styles.balCard}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 6, letterSpacing: ".5px" }}>BALANCE TOTAL</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#fff", marginBottom: "1.25rem" }}>{fmt(balance)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={styles.statPill}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Ingresos</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{fmt(totalIncome)}</span>
              </div>
            </div>
            <div style={styles.statPill}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Gastos</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{fmt(totalExpense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 8, padding: 4, marginBottom: "1.25rem" }}>
          <button style={styles.tab(tab === "movimientos")} onClick={() => setTab("movimientos")}>Movimientos</button>
          <button style={styles.tab(tab === "reportes")} onClick={() => setTab("reportes")}>Reportes</button>
          <button style={styles.tab(tab === "presupuesto")} onClick={() => setTab("presupuesto")}>Presupuesto</button>
        </div>

        {/* Movimientos */}
        {tab === "movimientos" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <button onClick={() => changeMonth(-1)} style={{ background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#6b6b8a" }}>{"<"}</button>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
              <button onClick={() => changeMonth(1)} style={{ background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#6b6b8a" }}>{">"}</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
              {["todos", "income", "expense"].map((f) => (
                <button key={f} style={styles.filterBtn(filter === f)} onClick={() => setFilter(f)}>
                  {f === "todos" ? "Todos" : f === "income" ? "Ingresos" : "Gastos"}
                </button>
              ))}
            </div>
            <button style={styles.addBtn} onClick={openModal}>+ Agregar movimiento</button>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#9999b3", fontSize: 14 }}>Sin movimientos este mes</div>
            ) : (
              filtered.map((t) => (
                <div key={t.id} style={styles.txItem}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.type === "income" ? "#E1F5EE" : "#FAECE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {t.type === "income" ? "↓" : "↑"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#6b6b8a", display: "flex", gap: 6, marginTop: 2 }}>
                      <span>{new Date(t.date + "T12:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "short" })}</span>
                      <span style={{ background: "#EEEDFE", color: "#3C3489", padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 500 }}>{t.category}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.type === "income" ? "#1D9E75" : "#D85A30", whiteSpace: "nowrap" }}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </div>
                  <button onClick={() => deleteTx(t.id)} style={{ background: "none", border: "none", color: "#9999b3", cursor: "pointer", fontSize: 16, padding: 4 }}>🗑</button>
                </div>
              ))
            )}
          </div>
        )}

{/* Presupuesto */}
{tab === "presupuesto" && (
  <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
      <button onClick={() => changeMonth(-1)} style={{ background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#6b6b8a" }}>{"<"}</button>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
      <button onClick={() => changeMonth(1)} style={{ background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#6b6b8a" }}>{">"}</button>
    </div>
    <button onClick={() => setBudgetModal(true)} style={styles.addBtn}>
      + Establecer presupuesto
    </button>
    {CATS.expense.map((cat) => {
      const gastado = transactions
        .filter((t) => t.type === "expense" && t.category === cat.name && 
            new Date(t.date).getMonth() === viewDate.getMonth() &&
            new Date(t.date).getFullYear() === viewDate.getFullYear())
        .reduce((s, t) => s + t.amount, 0);
      const presupuesto = budgets[cat.name] || 0;
      const pct = presupuesto > 0 ? Math.min(Math.round(gastado / presupuesto * 100), 100) : 0;
      const color = pct >= 100 ? "#D85A30" : pct >= 80 ? "#BA7517" : AppConfig.colors.primary;
      const restante = presupuesto - gastado;
      return (
        <div key={cat.name} style={{ background: "#fff", border: "1px solid rgba(127,119,221,0.15)", borderRadius: 12, padding: "14px", marginBottom: 10, boxShadow: "0 2px 12px rgba(127,119,221,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
            <span style={{ fontSize: 12, color: restante < 0 ? "#D85A30" : "#6b6b8a" }}>
              {presupuesto > 0 ? `${fmt(gastado)} / ${fmt(presupuesto)}` : "Sin presupuesto"}
            </span>
          </div>
          <div style={{ height: 8, background: "#F4F3FB", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 99, transition: "width .5s" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6b8a" }}>
            <span style={{ color }}>{pct}% usado</span>
            <span style={{ color: restante < 0 ? "#D85A30" : "#1D9E75", fontWeight: 500 }}>
              {restante >= 0 ? `${fmt(restante)} restante` : `${fmt(Math.abs(restante))} excedido ⚠️`}
            </span>
          </div>
        </div>
      );
    })}
  </div>
)}

        {/* Reportes */}
        {tab === "reportes" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
              <div style={styles.card}>
                <div style={{ fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Este mes · ingresos</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#1D9E75" }}>{fmt(monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0))}</div>
              </div>
              <div style={styles.card}>
                <div style={{ fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Este mes · gastos</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#D85A30" }}>{fmt(monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0))}</div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6b6b8a", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Gastos por categoría</div>
              {catEntries.length > 0 ? (
                <>
                  <Doughnut data={{ labels: catEntries.map(([k]) => k), datasets: [{ data: catEntries.map(([, v]) => v), backgroundColor: catEntries.map(([k]) => catColors[k] || "#888"), borderWidth: 3, borderColor: "#fff" }] }}
                    options={{ responsive: true, cutout: "65%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => " " + ctx.label + ": " + fmt(ctx.raw) } } } }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "1rem" }}>
                    {catEntries.map(([k, v]) => (
                      <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b6b8a" }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: catColors[k] || "#888", flexShrink: 0 }}></span>
                        {k} {totalExp > 0 ? Math.round(v / totalExp * 100) : 0}%
                      </span>
                    ))}
                  </div>
                </>
              ) : <div style={{ color: "#9999b3", fontSize: 13 }}>Sin gastos registrados</div>}
            </div>

            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6b6b8a", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Últimos 6 meses</div>
              <Bar data={{ labels: barLabels, datasets: [{ label: "Ingresos", data: barInc, backgroundColor: "#5DCAA5", borderRadius: 6 }, { label: "Gastos", data: barExp, backgroundColor: "#F0997B", borderRadius: 6 }] }}
                options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#9999b3", font: { size: 11 } } }, y: { ticks: { color: "#9999b3", font: { size: 11 }, callback: (v) => "₡" + Math.round(v).toLocaleString("es-CR") } } } }} />
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b6b8a" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#5DCAA5" }}></span>Ingresos</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b6b8a" }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#F0997B" }}></span>Gastos</span>
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6b6b8a", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Top categorías</div>
              {catEntries.length === 0 ? <div style={{ color: "#9999b3", fontSize: 13 }}>Sin gastos registrados</div> :
                catEntries.slice(0, 5).map(([k, v]) => {
                  const pct = totalExp > 0 ? Math.round(v / totalExp * 100) : 0;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: "#6b6b8a", width: 95, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
                      <div style={{ flex: 1, height: 8, background: "#F4F3FB", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: pct + "%", height: "100%", background: catColors[k] || "#888", borderRadius: 99, transition: "width .5s" }}></div>
                      </div>
                      <span style={{ fontSize: 12, color: "#6b6b8a", width: 65, textAlign: "right", fontWeight: 500 }}>{fmt(v)}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid rgba(127,119,221,0.15)", padding: ".75rem 0 .5rem", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", maxWidth: 480, width: "100%" }}>
          <button style={styles.navBtn(tab === "movimientos")} onClick={() => setTab("movimientos")}>
            <span style={{ fontSize: 22 }}>☰</span>
            <span>Movimientos</span>
          </button>
          <button style={styles.navBtn(tab === "reportes")} onClick={() => setTab("reportes")}>
            <span style={{ fontSize: 22 }}>◑</span>
            <span>Reportes</span>
          </button>
        </div>
      </nav>

      {/* Modal Presupuesto */}
{budgetModal && (
  <div onClick={(e) => e.target === e.currentTarget && setBudgetModal(false)}
    style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: 480 }}>
      <div style={{ width: 40, height: 4, background: "rgba(127,119,221,0.3)", borderRadius: 99, margin: "0 auto 1.25rem" }}></div>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>Establecer presupuesto</div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 5, fontWeight: 500 }}>CATEGORÍA</div>
        <select style={styles.input} value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}>
          {CATS.expense.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 5, fontWeight: 500 }}>MONTO MENSUAL (₡)</div>
        <input style={styles.input} type="number" placeholder="0" value={budgetForm.amount}
          onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: "1.25rem" }}>
        <button style={styles.btnCancel} onClick={() => setBudgetModal(false)}>Cancelar</button>
        <button style={styles.btnSave} onClick={() => {
          if (!budgetForm.amount || parseFloat(budgetForm.amount) <= 0) return alert("Ingresa un monto válido");
          setBudgets({ ...budgets, [budgetForm.category]: parseFloat(budgetForm.amount) });
          setBudgetModal(false);
        }}>Guardar</button>
      </div>
    </div>
  </div>
)}

      {/* Modal */}
      {modal && (
        <div onClick={(e) => e.target === e.currentTarget && setModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: 480 }}>
            <div style={{ width: 40, height: 4, background: "rgba(127,119,221,0.3)", borderRadius: 99, margin: "0 auto 1.25rem" }}></div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>Nuevo movimiento</div>
            <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
              <button style={styles.typeBtn("expense", type === "expense")} onClick={() => { setType("expense"); setForm({ ...form, category: "Comida" }); }}>↑ Gasto</button>
              <button style={styles.typeBtn("income", type === "income")} onClick={() => { setType("income"); setForm({ ...form, category: "Salario" }); }}>↓ Ingreso</button>
            </div>
            {[
              { label: "DESCRIPCIÓN", key: "title", type: "text", placeholder: "Ej: Supermercado" },
              { label: "MONTO (₡)", key: "amount", type: "number", placeholder: "0" },
            ].map(({ label, key, type: t, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 5, fontWeight: 500, letterSpacing: ".3px" }}>{label}</div>
                <input style={styles.input} type={t} placeholder={placeholder} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 5, fontWeight: 500, letterSpacing: ".3px" }}>CATEGORÍA</div>
              <select style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS[type].map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 5, fontWeight: 500, letterSpacing: ".3px" }}>FECHA</div>
              <input style={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "1.25rem" }}>
              <button style={styles.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
              <button style={styles.btnSave} onClick={saveTransaction}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
