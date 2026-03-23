import { useState, useEffect } from "react";

interface Cliente { id: number; nome: string; }
interface Produto { id: number; nome: string; preco: number; }

interface ItemPedido {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
}

interface PedidoProduto {
  id: number;
  nome: string;
  pivot: { quantidade: number; preco_unitario: number; };
}

interface Pedido {
  id: number;
  cliente_id: number;
  valor: number;
  pagamento: string;
  data: string;
  cliente: Cliente;
  produtos: PedidoProduto[];
}

const STATUS_PAG: Record<string, React.CSSProperties> = {
  pix:    { background: "#f0fdf4", color: "#166534" },
  cartão: { background: "#eff6ff", color: "#1d4ed8" },
  boleto: { background: "#fff8e1", color: "#b45309" },
};

const token = () => localStorage.getItem("token");
const API = "http://localhost:8000/api";
const headers = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": `Bearer ${token()}`,
});

const inputStyle: React.CSSProperties = {
  background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 10,
  padding: "9px 14px", fontSize: 13, outline: "none", fontFamily: "inherit",
  color: "#374151", width: "100%",
};

export default function Pedidos() {
  const [pedidos, setPedidos]   = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busca, setBusca]       = useState("");
  const [filtroPag, setFiltroPag] = useState("Todos");
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState<Pedido | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [pagamento, setPagamento] = useState("pix");
  const [data, setData]         = useState("");
  const [itens, setItens]       = useState<ItemPedido[]>([{ produto_id: 0, quantidade: 1, preco_unitario: 0 }]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/pedidos`, { headers: headers() });
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPedidos();
    fetch(`${API}/clientes`, { headers: headers() }).then(r => r.json()).then(d => setClientes(Array.isArray(d) ? d : []));
    fetch(`${API}/products`, { headers: headers() }).then(r => r.json()).then(d => setProdutos(d.Sucess ?? []));
  }, []);

  const abrirModal = (pedido?: Pedido) => {
    setEditando(pedido ?? null);
    setClienteId(pedido ? String(pedido.cliente_id) : "");
    setPagamento(pedido ? pedido.pagamento : "pix");
    setData(pedido ? pedido.data?.split("T")[0] ?? "" : "");
    setItens(pedido?.produtos?.length
      ? pedido.produtos.map(p => ({ produto_id: p.id, quantidade: p.pivot.quantidade, preco_unitario: p.pivot.preco_unitario }))
      : [{ produto_id: 0, quantidade: 1, preco_unitario: 0 }]
    );
    setErro("");
    setModal(true);
  };

  const fecharModal = () => { setModal(false); setEditando(null); setErro(""); };

  const addItem = () => setItens([...itens, { produto_id: 0, quantidade: 1, preco_unitario: 0 }]);

  const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));

  const updateItem = (i: number, field: keyof ItemPedido, value: any) => {
    const novos = [...itens];
    novos[i] = { ...novos[i], [field]: value };
    // preenche preço automaticamente ao selecionar produto
    if (field === "produto_id") {
      const prod = produtos.find(p => p.id === Number(value));
      if (prod) novos[i].preco_unitario = prod.preco;
    }
    setItens(novos);
  };

  const totalModal = itens.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0);

  const handleSalvar = async () => {
    if (!clienteId) { setErro("Selecione um cliente"); return; }
    if (itens.some(i => !i.produto_id)) { setErro("Selecione todos os produtos"); return; }

    setSalvando(true);
    setErro("");
    try {
      const url    = editando ? `${API}/pedidos/${editando.id}` : `${API}/pedidos`;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: headers(),
        body: JSON.stringify({
          cliente_id: Number(clienteId),
          pagamento,
          data: data || null,
          produtos: itens.map(i => ({
            produto_id:     Number(i.produto_id),
            quantidade:     Number(i.quantidade),
            preco_unitario: Number(i.preco_unitario),
          })),
        }),
      });
      const resData = await res.json();
      if (!res.ok) { setErro(resData.message ?? "Erro ao salvar"); return; }
      await fetchPedidos();
      fecharModal();
    } catch { setErro("Erro ao conectar com o servidor"); }
    finally { setSalvando(false); }
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("Excluir este pedido?")) return;
    await fetch(`${API}/pedidos/${id}`, { method: "DELETE", headers: headers() });
    await fetchPedidos();
  };

  const filtrados = pedidos.filter((p) => {
    const matchBusca = p.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) || String(p.id).includes(busca);
    const matchPag   = filtroPag === "Todos" || p.pagamento === filtroPag;
    return matchBusca && matchPag;
  });

  const total = pedidos.reduce((acc, p) => acc + p.valor, 0);

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
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#1f2937", fontWeight: 600 }}>Pedidos</h2>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>{pedidos.length} pedidos encontrados</p>
        </div>
        <button onClick={() => abrirModal()} style={{ background: "#c0265a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Novo pedido
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total de pedidos", value: pedidos.length, icon: "📦" },
          { label: "Pagos via Pix",    value: pedidos.filter(p => p.pagamento === "pix").length, icon: "⚡" },
          { label: "Pagos via Cartão", value: pedidos.filter(p => p.pagamento === "cartão").length, icon: "💳" },
          { label: "Receita total",    value: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "💰" },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #fce8f0" }}>
            <span style={{ fontSize: 22 }}>{c.icon}</span>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#1f2937", fontFamily: "'Playfair Display', serif", marginTop: 8 }}>{c.value}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #fce8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["Todos", "pix", "cartão", "boleto"].map((f) => (
              <button key={f} onClick={() => setFiltroPag(f)} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: filtroPag === f ? "#c0265a" : "#fdf6f9", color: filtroPag === f ? "#fff" : "#9ca3af", transition: "all .15s" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input placeholder="🔍  Buscar por cliente ou ID..." value={busca} onChange={(e) => setBusca(e.target.value)}
            style={{ background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, outline: "none", width: 280, fontFamily: "inherit" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Carregando pedidos... 🌸</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, borderBottom: "2px solid #fce8f0" }}>
                {["ID", "CLIENTE", "PRODUTOS", "VALOR TOTAL", "PAGAMENTO", "DATA", "AÇÕES"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #fce8f0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fffafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "13px 12px", color: "#c0265a", fontWeight: 700 }}>#{String(p.id).padStart(4, "0")}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#f7c1d9,#c0265a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {p.cliente?.nome?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ color: "#374151", fontWeight: 500 }}>{p.cliente?.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 12px", color: "#6b7280" }}>
                    {p.produtos?.length > 0
                      ? p.produtos.map(pr => `${pr.nome} (${pr.pivot.quantidade}x)`).join(", ")
                      : "—"
                    }
                  </td>
                  <td style={{ padding: "13px 12px", color: "#374151", fontWeight: 700 }}>R$ {p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <span style={{ ...STATUS_PAG[p.pagamento] ?? {}, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                      {p.pagamento.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "13px 12px", color: "#6b7280" }}>{new Date(p.data).toLocaleDateString("pt-BR")}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => abrirModal(p)} style={{ background: "#fdf6f9", border: "1px solid #fce8f0", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#c0265a", fontWeight: 600 }}>Editar</button>
                      <button onClick={() => handleDeletar(p.id)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#dc2626", fontWeight: 600 }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>Nenhum pedido encontrado 🌸</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", width: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(192,38,90,.15)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1f2937", fontWeight: 600 }}>
                {editando ? "Editar pedido" : "Novo pedido"}
              </h3>
              <button onClick={fecharModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>

            <Field label="CLIENTE">
              <select style={inputStyle} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecione um cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>

            {/* Produtos */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>PRODUTOS</label>
                <button onClick={addItem} style={{ fontSize: 12, color: "#c0265a", background: "#fff0f5", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>
                  + Adicionar produto
                </button>
              </div>

              {itens.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 32px", gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <select style={inputStyle} value={item.produto_id || ""} onChange={(e) => updateItem(i, "produto_id", e.target.value)}>
                    <option value="">Produto...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <input style={inputStyle} type="number" min="1" placeholder="Qtd" value={item.quantidade}
                    onChange={(e) => updateItem(i, "quantidade", parseInt(e.target.value))} />
                  <input style={inputStyle} type="number" step="0.01" placeholder="Preço" value={item.preco_unitario}
                    onChange={(e) => updateItem(i, "preco_unitario", parseFloat(e.target.value))} />
                  {itens.length > 1 && (
                    <button onClick={() => removeItem(i)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: 14 }}>✕</button>
                  )}
                </div>
              ))}

              {/* Total */}
              <div style={{ background: "#fdf6f9", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Total do pedido</span>
                <span style={{ fontSize: 15, color: "#c0265a", fontWeight: 700 }}>R$ {totalModal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="DATA">
                <input style={inputStyle} type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </Field>
              <Field label="PAGAMENTO">
                <select style={inputStyle} value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                  <option value="pix">Pix</option>
                  <option value="cartão">Cartão</option>
                  <option value="boleto">Boleto</option>
                </select>
              </Field>
            </div>

            {erro && <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{erro}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={fecharModal} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #fce8f0", background: "#fdf6f9", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={salvando} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "#c0265a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: salvando ? 0.7 : 1 }}>
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}