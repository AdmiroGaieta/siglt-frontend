/**
 * Wrapper simples de chamadas à API SIGLT.
 * Responsabilidades: anexar o JWT, tentar refresh automático em 401, normalizar erros.
 */
const SigltApi = (() => {
  const BASE = SIGLT_CONFIG.apiBaseUrl;

  function getAccessToken() { return localStorage.getItem("siglt_access_token"); }
  function getRefreshToken() { return localStorage.getItem("siglt_refresh_token"); }

  function salvarTokens(accessToken, refreshToken) {
    localStorage.setItem("siglt_access_token", accessToken);
    localStorage.setItem("siglt_refresh_token", refreshToken);
  }

  function limparTokens() {
    localStorage.removeItem("siglt_access_token");
    localStorage.removeItem("siglt_refresh_token");
  }

  async function tentarRefresh() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const resposta = await fetch(`${BASE}/Auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });

      if (!resposta.ok) return false;

      const corpo = await resposta.json();
      salvarTokens(corpo.data.accessToken, corpo.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @param {string} caminho ex: "/Area" ou "/Funcionario/5"
   * @param {object} opcoes  { method, body, semAuth }
   */
  async function chamar(caminho, opcoes = {}) {
    const fazerChamada = () => {
      const headers = { "Content-Type": "application/json" };
      if (!opcoes.semAuth) {
        const token = getAccessToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      return fetch(`${BASE}${caminho}`, {
        method: opcoes.method || "GET",
        headers,
        body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined
      });
    };

    let resposta = await fazerChamada();

    if (resposta.status === 401 && !opcoes.semAuth) {
      const renovou = await tentarRefresh();
      if (renovou) {
        resposta = await fazerChamada();
      } else {
        limparTokens();
        SigltAuth.irParaLogin();
        throw new Error("Sessão expirada. Faz login novamente.");
      }
    }

    let corpo = null;
    const texto = await resposta.text();
    if (texto) {
      try { corpo = JSON.parse(texto); } catch { corpo = null; }
    }

    if (!resposta.ok) {
      const mensagem = corpo?.retorno?.mensagem || `Erro ${resposta.status}`;
      const erro = new Error(mensagem);
      erro.codigo = corpo?.retorno?.codigo;
      erro.status = resposta.status;
      throw erro;
    }

    return corpo ? corpo.data : null;
  }

  return {
    get: (caminho) => chamar(caminho, { method: "GET" }),
    post: (caminho, body) => chamar(caminho, { method: "POST", body }),
    put: (caminho, body) => chamar(caminho, { method: "PUT", body }),
    patch: (caminho, body) => chamar(caminho, { method: "PATCH", body }),
    semAuth: (caminho, opcoes) => chamar(caminho, { ...opcoes, semAuth: true }),
    salvarTokens,
    limparTokens,
    getAccessToken,
    getRefreshToken
  };
})();
