import { useState, useEffect } from "react";

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  vendas: number;
  status: boolean;
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  Ativo: { background: "#f0fdf4", color: "#166534" },
  "Baixo estoque": { background: "#fff8e1", color: "#b45309" },
  "Sem estoque": { background: "#fef2f2", color: "#dc2626" },
  Inativo: { background: "#f3f4f6", color: "#6b7280" },
};

const CATEGORIAS = ["Todas", "Géis", "Kits", "Esmaltes", "Bases", "Finalizadores", "Acessórios", "Roupas"];

const token = () => localStorage.getItem("token");
const API = "http://localhost:8000/api";
const headers = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": `Bearer ${token()}`,
});

function getStatus(p: Produto) {
  if (!p.status) return "Inativo";
  if (p.estoque === 0) return "Sem estoque";
  if (p.estoque <= 5) return "Baixo estoque";
  return "Ativo";
}

const EMPTY: Omit<Produto, "id" | "vendas" | "created_at" | "updated_at"> = {
  nome: "", categoria: "", preco: 0, estoque: 0, status: true,
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/products`, { headers: headers() });
      const data = await res.json();
      setProdutos(data.Sucess ?? []);
    } catch {
      setErro("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProdutos(); }, []);

  const abrirModal = (produto?: Produto) => {
    setEditando(produto ?? null);
    setForm(produto ? { ...produto } : EMPTY);
    setErro("");
    setModal(true);
  };

  const fecharModal = () => { setModal(false); setEditando(null); setErro(""); };

  const handleSalvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      const url = editando ? `${API}/products/${editando.id}` : `${API}/products`;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setErro(data.message ?? "Erro ao salvar"); return; }
      await fetchProdutos();
      fecharModal();
    } catch {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await fetch(`${API}/products/${id}`, { method: "DELETE", headers: headers() });
      await fetchProdutos();
    } catch {
      setErro("Erro ao excluir produto");
    }
  };

  const filtrados = produtos.filter((p) => {
    const matchCat = categoria === "Todas" || p.categoria === categoria;
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 10,
    padding: "9px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#374151",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Topo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#1f2937", fontWeight: 600 }}>Produtos</h2>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>{produtos.length} produtos cadastrados</p>
        </div>
        <button onClick={() => abrirModal()} style={{ background: "#c0265a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Novo produto
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total produtos", value: produtos.length, icon: "🛍️" },
          { label: "Ativos", value: produtos.filter(p => p.status && p.estoque > 5).length, icon: "✅" },
          { label: "Baixo estoque", value: produtos.filter(p => p.estoque > 0 && p.estoque <= 5).length, icon: "⚠️" },
          { label: "Sem estoque", value: produtos.filter(p => p.estoque === 0).length, icon: "❌" },
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIAS.map((c) => (
              <button key={c} onClick={() => setCategoria(c)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: categoria === c ? "#c0265a" : "#fdf6f9", color: categoria === c ? "#fff" : "#9ca3af", transition: "all .15s" }}>
                {c}
              </button>
            ))}
          </div>
          <input placeholder="🔍  Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)}
            style={{ background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, outline: "none", width: 220, fontFamily: "inherit" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Carregando produtos... 🌸</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, borderBottom: "2px solid #fce8f0" }}>
                {["PRODUTO", "CATEGORIA", "PREÇO", "ESTOQUE", "VENDAS", "STATUS", "AÇÕES"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const status = getStatus(p);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #fce8f0" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fffafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 12px", fontWeight: 600, color: "#374151" }}>{p.nome}</td>
                    <td style={{ padding: "13px 12px", color: "#6b7280" }}>{p.categoria}</td>
                    <td style={{ padding: "13px 12px", fontWeight: 700, color: "#374151" }}>R$ {p.preco.toFixed(2).replace(".", ",")}</td>
                    <td style={{ padding: "13px 12px", color: p.estoque <= 5 ? "#dc2626" : "#374151", fontWeight: p.estoque <= 5 ? 700 : 400 }}>{p.estoque} un.</td>
                    <td style={{ padding: "13px 12px", color: "#6b7280" }}>{p.vendas}</td>
                    <td style={{ padding: "13px 12px" }}>
                      <span style={{ ...STATUS_STYLE[status], fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{status}</span>
                    </td>
                    <td style={{ padding: "13px 12px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => abrirModal(p)} style={{ background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#c0265a", fontWeight: 600 }}>Editar</button>
                        <button onClick={() => handleDeletar(p.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#dc2626", fontWeight: 600 }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Nenhum produto encontrado 🌸</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", width: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(192,38,90,.15)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1f2937", fontWeight: 600 }}>
                {editando ? "Editar produto" : "Novo produto"}
              </h3>
              <button onClick={fecharModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>

            <Field label="NOME DO PRODUTO">
              <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Gel UV Rosa Bebê" />
            </Field>
            <Field label="CATEGORIA">
              <select style={inputStyle} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                <option value="">Selecione...</option>
                {["Géis", "Kits", "Esmaltes", "Bases", "Finalizadores", "Acessórios"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="PREÇO (R$)">
                <input style={inputStyle} type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: parseFloat(e.target.value) })} placeholder="0,00" />
              </Field>
              <Field label="ESTOQUE">
                <input style={inputStyle} type="number" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: parseInt(e.target.value) })} placeholder="0" />
              </Field>
            </div>
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
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}