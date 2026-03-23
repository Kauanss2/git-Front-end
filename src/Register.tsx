import { useState } from "react";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message);
        return;
      }

      // salva o token igual ao login
      localStorage.setItem("token", data.access_token);

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
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Cadastro</h1>
          <p className="text-gray-600 text-xs">Crie sua conta para continuar</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Nome completo"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

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

          <input
            type="password"
            placeholder="Confirmar senha"
            required
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>

          {erro && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div className="text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
              Já tem uma conta? Faça login
            </a>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Register;