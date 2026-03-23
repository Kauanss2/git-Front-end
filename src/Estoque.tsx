import { useState, useEffect } from "react";

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  status: boolean;
  created_at: string;
}

const token = () => localStorage.getItem("token");
const API = "http://localhost:8000/api";
const headers = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": `Bearer ${token()}`,
});

const inputStyle: React.CSSProperties = {
  background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 10,
  padding: "9px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#374151", width: "100%",
};

const EMPTY = { nome: "", email: "", telefone: "", status: true };

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/clientes`, { headers: headers() });
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch { setErro("Erro ao carregar clientes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClientes(); }, []);

  const abrirModal = (cliente?: Cliente) => {
    setEditando(cliente ?? null);
    setForm(cliente ? { ...cliente } : EMPTY);
    setErro("");
    setModal(true);
  };

  const fecharModal = () => { setModal(false); setEditando(null); setErro(""); };

  const handleSalvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      const url = editando ? `${API}/clientes/${editando.id}` : `${API}/clientes`;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setErro(data.message ?? "Erro ao salvar"); return; }
      await fetchClientes();
      fecharModal();
    } catch { setErro("Erro ao conectar com o servidor"); }
    finally { setSalvando(false); }
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) return;
    await fetch(`${API}/clientes/${id}`, { method: "DELETE", headers: headers() });
    await fetchClientes();
  };

  const filtrados = clientes.filter((c) => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || c.email.includes(busca);
    const matchFiltro = filtro === "Todos" || (filtro === "Ativo" && c.status) || (filtro === "Inativo" && !c.status);
    return matchBusca && matchFiltro;
  });

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Topo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#1f2937", fontWeight: 600 }}>Clientes</h2>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>{clientes.length} clientes cadastrados</p>
        </div>
        <button onClick={() => abrirModal()} style={{ background: "#c0265a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Novo cliente
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total clientes", value: clientes.length, icon: "👥" },
          { label: "Ativos", value: clientes.filter(c => c.status).length, icon: "✅" },
          { label: "Inativos", value: clientes.filter(c => !c.status).length, icon: "⛔" },
          { label: "Novos este mês", value: clientes.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length, icon: "🌱" },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #fce8f0" }}>
            <span style={{ fontSize: 22 }}>{c.icon}</span>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#1f2937", fontFamily: "'Playfair Display', serif", marginTop: 8 }}>{c.value}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #fce8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["Todos", "Ativo", "Inativo"].map((f) => (
              <button key={f} onClick={() => setFiltro(f)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: filtro === f ? "#c0265a" : "#fdf6f9", color: filtro === f ? "#fff" : "#9ca3af" }}>
                {f}
              </button>
            ))}
          </div>
          <input placeholder="🔍  Buscar cliente..." value={busca} onChange={(e) => setBusca(e.target.value)}
            style={{ background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, outline: "none", width: 220, fontFamily: "inherit" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Carregando clientes... 🌸</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, borderBottom: "2px solid #fce8f0" }}>
                {["CLIENTE", "EMAIL", "TELEFONE", "CADASTRO", "STATUS", "AÇÕES"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #fce8f0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fffafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f7c1d9,#c0265a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: "#374151" }}>{c.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 12px", color: "#6b7280" }}>{c.email}</td>
                  <td style={{ padding: "13px 12px", color: "#6b7280" }}>{c.telefone}</td>
                  <td style={{ padding: "13px 12px", color: "#6b7280" }}>{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, ...(c.status ? { background: "#f0fdf4", color: "#166534" } : { background: "#f3f4f6", color: "#6b7280" }) }}>
                      {c.status ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => abrirModal(c)} style={{ background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#c0265a", fontWeight: 600 }}>Editar</button>
                      <button onClick={() => handleDeletar(c.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#dc2626", fontWeight: 600 }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Nenhum cliente encontrado 🌸</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", width: 440, boxShadow: "0 20px 60px rgba(192,38,90,.15)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1f2937", fontWeight: 600 }}>
                {editando ? "Editar cliente" : "Novo cliente"}
              </h3>
              <button onClick={fecharModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>

            <Field label="NOME COMPLETO">
              <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do cliente" />
            </Field>
            <Field label="EMAIL">
              <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </Field>
            <Field label="TELEFONE">
              <input style={inputStyle} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-0000" />
            </Field>
            <Field label="STATUS">
              <div style={{ display: "flex", gap: 10 }}>
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => setForm({ ...form, status: v })}
                    style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s", borderColor: form.status === v ? "#c0265a" : "#fce8f0", background: form.status === v ? "#fff0f5" : "#fdf6f9", color: form.status === v ? "#c0265a" : "#9ca3af" }}>
                    {v ? "✓ Ativo" : "✗ Inativo"}
                  </button>
                ))}
              </div>
            </Field>

            {erro && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{erro}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={fecharModal} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #fce8f0", background: "#fdf6f9", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={salvando} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "#c0265a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: salvando ? 0.7 : 1 }}>
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}