import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import Pedidos from "./Pedidos";
import Produtos from "./Produtos";
import Clientes from "./Clientes";

Chart.register(...registerables);

interface User { id: number; name: string; email: string; }
interface Pedido { id: number; valor: number; pagamento: string; cliente: { nome: string }; produto: { nome: string }; data: string; }
interface Produto { id: number; estoque: number; status: boolean; }
interface Cliente { id: number; status: boolean; created_at: string; }

const token = () => localStorage.getItem("token");
const API = "http://localhost:8000/api";
const hdrs = () => ({ Authorization: `Bearer ${token()}`, Accept: "application/json" });

const NAV = [
  { icon: "◈", label: "Dashboard" },
  { icon: "◉", label: "Pedidos" },
  { icon: "◫", label: "Produtos" },
  { icon: "◎", label: "Clientes" },
];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const navigate = useNavigate();
  const lineRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const lineInst = useRef<Chart | null>(null);
  const donutInst = useRef<Chart | null>(null);

  useEffect(() => {
    const t = token();
    if (!t) { navigate("/"); return; }

    Promise.all([
      fetch(`${API}/me`, { headers: hdrs() }).then(r => r.json()),
      fetch(`${API}/pedidos`, { headers: hdrs() }).then(r => r.json()),
      fetch(`${API}/products`, { headers: hdrs() }).then(r => r.json()),
      fetch(`${API}/clientes`, { headers: hdrs() }).then(r => r.json()),
    ]).then(([me, ped, prod, cli]) => {
      setUser(me);
      setPedidos(Array.isArray(ped) ? ped : []);
      setProdutos(prod.Sucess ?? []);
      setClientes(Array.isArray(cli) ? cli : []);
    }).finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (loading || activePage !== "Dashboard") return;

    const pink = "#c0265a";
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

    // agrupa faturamento por mês
    const fat = Array(6).fill(0);
    pedidos.forEach(p => {
      const m = new Date(p.data).getMonth();
      if (m < 6) fat[m] += p.valor;
    });

    if (lineRef.current) {
      lineInst.current?.destroy();
      lineInst.current = new Chart(lineRef.current, {
        type: "line",
        data: {
          labels: months,
          datasets: [{
            data: fat,
            borderColor: pink,
            backgroundColor: "rgba(192,38,90,0.08)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.45,
            pointBackgroundColor: pink,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
          }],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
            y: { beginAtZero: true, grid: { color: "#f9e8ef" }, ticks: { color: "#9ca3af", font: { size: 11 }, callback: (v) => `R$${(Number(v) / 1000).toFixed(0)}k` } },
          },
        },
      });
    }

    // donut por pagamento
    const pix = pedidos.filter(p => p.pagamento === "pix").length;
    const cartao = pedidos.filter(p => p.pagamento === "cartão").length;
    const outros = pedidos.length - pix - cartao;

    if (donutRef.current) {
      donutInst.current?.destroy();
      donutInst.current = new Chart(donutRef.current, {
        type: "doughnut",
        data: {
          labels: ["Pix", "Cartão", "Outros"],
          datasets: [{ data: [pix, cartao, outros], backgroundColor: ["#c0265a", "#e8799e", "#fde8f0"], borderWidth: 0 }],
        },
        options: {
          maintainAspectRatio: false,
          cutout: "72%",
          plugins: { legend: { position: "bottom", labels: { color: "#6b7280", font: { size: 11 }, padding: 12, boxWidth: 10, boxHeight: 10 } } },
        },
      });
    }
  }, [loading, pedidos, activePage]);

  const receita = pedidos.reduce((a, p) => a + p.valor, 0);
  const ticketMedio = pedidos.length ? receita / pedidos.length : 0;
  const semEstoque = produtos.filter(p => p.estoque === 0).length;
  const clientesAtivos = clientes.filter(c => c.status).length;

  const CARDS = [
    { label: "Receita total", value: `R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "💸" },
    { label: "Total de pedidos", value: pedidos.length, icon: "📦" },
    { label: "Ticket médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "🧾" },
    { label: "Clientes ativos", value: clientesAtivos, icon: "👥" },
    { label: "Total de produtos", value: produtos.length, icon: "🛍️" },
    { label: "Sem estoque", value: semEstoque, icon: "⚠️" },
    { label: "Pagamentos Pix", value: pedidos.filter(p => p.pagamento === "pix").length, icon: "⚡" },
    { label: "Novos clientes", value: clientes.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length, icon: "🌱" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #fce8f0", borderTop: "3px solid #c0265a", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontFamily: "'Playfair Display', serif", color: "#c0265a", fontSize: 15 }}>Carregando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafafa", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #f0c0d0; border-radius: 4px; }
        .nav-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; color: #aaa; transition: all .18s ease; text-align: left; font-family: inherit; }
        .nav-btn:hover { background: #fdf0f4; color: #c0265a; }
        .nav-btn.active { background: #fff0f5; color: #c0265a; font-weight: 600; }
        .nav-btn.active::before { content: ""; width: 3px; height: 18px; background: #c0265a; border-radius: 99px; }
        .card { background: #fff; border-radius: 14px; padding: 20px 22px; border: 1px solid #f0f0f0; transition: transform .15s, box-shadow .15s; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
        .chart-card { background: #fff; border-radius: 14px; padding: 24px; border: 1px solid #f0f0f0; }
        .progress-bar { height: 4px; background: #f5f5f5; border-radius: 99px; overflow: hidden; margin-top: 6px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #e8799e, #c0265a); border-radius: 99px; }
        .table-row { display: grid; grid-template-columns: 70px 1fr 1fr 90px 100px; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
        .table-row:hover { background: #fffafc; }
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside style={{ width: 210, background: "#fff", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", padding: "32px 14px", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "0 8px 32px" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1a1a1a", fontWeight: 600, letterSpacing: "-0.3px" }}>Marguerite</h1>
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>Painel Administrativo</p>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {NAV.map((n) => (
              <button key={n.label} className={`nav-btn${activePage === n.label ? " active" : ""}`} onClick={() => setActivePage(n.label)}>
                <span style={{ fontSize: 14, opacity: 0.7 }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          <div style={{ borderTop: "1px solid #f5f5f5", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 14px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f7c1d9,#c0265a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</p>
                <p style={{ fontSize: 11, color: "#bbb" }}>Admin</p>
              </div>
            </div>
            <button className="nav-btn" onClick={async () => {
              await fetch(`${API}/logout`, { method: "POST", headers: hdrs() });
              localStorage.removeItem("token");
              navigate("/");
            }} style={{ color: "#e57373", fontSize: 13 }}>
              <span style={{ fontSize: 14 }}>→</span> Sair
            </button>
          </div>
        </aside>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden", minWidth: 0 }}>

        {/* Header */}
        <header style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, lineHeight: 1, padding: 4 }}>☰</button>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#1a1a1a", fontWeight: 600 }}>{activePage}</h2>
              <p style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>

        </header>

        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>

          {activePage === "Dashboard" && (
            <>
              {/* Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {CARDS.map((c) => (
                  <div key={c.label} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <span style={{ fontSize: 20 }}>{c.icon}</span>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>{c.value}</p>
                    <p style={{ fontSize: 11.5, color: "#aaa", marginTop: 4 }}>{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Gráficos */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                <div className="chart-card">
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Faturamento mensal</p>
                  <p style={{ fontSize: 11.5, color: "#bbb", marginBottom: 20 }}>Evolução dos últimos 6 meses</p>
                  <div style={{ height: 190 }}><canvas ref={lineRef} /></div>
                </div>
                <div className="chart-card">
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Formas de pagamento</p>
                  <p style={{ fontSize: 11.5, color: "#bbb", marginBottom: 16 }}>Distribuição dos pedidos</p>
                  <div style={{ height: 190 }}><canvas ref={donutRef} /></div>
                </div>
              </div>

              {/* Pedidos recentes + top produtos */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 18 }}>
                <div className="chart-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Pedidos recentes</p>
                      <p style={{ fontSize: 11.5, color: "#bbb" }}>Últimas movimentações</p>
                    </div>
                    <button onClick={() => setActivePage("Pedidos")} style={{ fontSize: 12, color: "#c0265a", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                      Ver todos →
                    </button>
                  </div>

                  <div className="table-row" style={{ color: "#bbb", fontSize: 10, fontWeight: 700, borderBottom: "2px solid #f0f0f0", paddingBottom: 8 }}>
                    <span>ID</span><span>CLIENTE</span><span>PRODUTO</span><span>VALOR</span><span>PAGAMENTO</span>
                  </div>
                  {pedidos.slice(0, 5).map((p) => (
                    <div key={p.id} className="table-row">
                      <span style={{ color: "#c0265a", fontWeight: 700 }}>#{String(p.id).padStart(4, "0")}</span>
                      <span style={{ color: "#374151", fontWeight: 500 }}>{p.cliente?.nome}</span>
                      <span style={{ color: "#aaa" }}>{p.produto?.nome}</span>
                      <span style={{ color: "#1a1a1a", fontWeight: 700 }}>R$ {p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: p.pagamento === "pix" ? "#f0fdf4" : "#eff6ff", color: p.pagamento === "pix" ? "#166534" : "#1d4ed8" }}>
                        {p.pagamento.toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {pedidos.length === 0 && <p style={{ textAlign: "center", color: "#bbb", fontSize: 13, padding: "24px 0" }}>Nenhum pedido ainda 🌸</p>}
                </div>

                <div className="chart-card">
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Top clientes</p>
                  <p style={{ fontSize: 11.5, color: "#bbb", marginBottom: 20 }}>Por volume de pedidos</p>
                  {clientes.slice(0, 5).map((c: any, i) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#f7c1d9,#c0265a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {c.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, color: "#374151", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nome}</p>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${100 - i * 18}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {clientes.length === 0 && <p style={{ textAlign: "center", color: "#bbb", fontSize: 13 }}>Nenhum cliente ainda 🌸</p>}
                </div>
              </div>
            </>
          )}

          {activePage === "Pedidos" && <Pedidos />}
          {activePage === "Produtos" && <Produtos />}
          {activePage === "Clientes" && <Clientes />}

        </div>
      </main>
    </div>
  );
}