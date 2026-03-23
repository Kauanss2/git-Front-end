import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './index.css';

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔥 se já estiver logado, vai direto pro dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/dashboard");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Erro ao fazer login");
        return;
      }

      // salva token
      localStorage.setItem("token", data.access_token);

      // 🔥 redireciona
      navigate("/dashboard");

    } catch (err) {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white px-8 py-10 rounded-2xl shadow-md w-full max-w-md flex flex-col gap-4">

        <div className="flex flex-col mb-2">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Login</h1>
          <p className="text-gray-600 text-xs">Faça login para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          <input
            type="password"
            placeholder="Senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            Esqueci minha senha
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {erro && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div className="text-center">
            <Link to="/register" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
              Não tem uma conta? Cadastre-se
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}

export default App;