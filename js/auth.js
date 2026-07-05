/**
 * Gestão de sessão: login, logout, e leitura das claims do JWT (perfil/permissões)
 * para controlar o que aparece no menu — sem precisar de decorar roles no frontend.
 */
const SigltAuth = (() => {
  let usuarioAtual = null; // { nomeUtilizador, perfil, permissoes: [...] }

  function decodificarJwt(token) {
    try {
      let payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");

      // Base64URL não tem padding; atob() exige que o comprimento seja múltiplo de 4.
      while (payload.length % 4 !== 0) {
        payload += "=";
      }

      const json = decodeURIComponent(
        atob(payload)
          .split("")
          .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function carregarUsuarioDoToken() {
    const token = SigltApi.getAccessToken();
    if (!token) { usuarioAtual = null; return null; }

    const claims = decodificarJwt(token);
    if (!claims) { usuarioAtual = null; return null; }

    let permissoes = claims["permissao"] || [];
    if (typeof permissoes === "string") permissoes = [permissoes];

    usuarioAtual = {
      nomeUtilizador: claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || claims["name"],
      perfil: claims["perfil"] || "",
      permissoes
    };
    return usuarioAtual;
  }

  function getUsuario() { return usuarioAtual; }

  function isAdministrador() { return usuarioAtual?.perfil === "Administrador"; }

  function temPermissaoModulo(prefixoModulo) {
    if (!usuarioAtual) return false;
    if (isAdministrador()) return true;
    return usuarioAtual.permissoes.some(p => p.startsWith(`${prefixoModulo}.`));
  }

  async function login(nomeUtilizador, password) {
    const dados = await SigltApi.semAuth("/Auth/login", {
      method: "POST",
      body: { nomeUtilizador, password }
    });
    SigltApi.salvarTokens(dados.accessToken, dados.refreshToken);
    carregarUsuarioDoToken();
    return dados;
  }

  async function logout() {
    const refreshToken = SigltApi.getRefreshToken();
    try {
      if (refreshToken) await SigltApi.post("/Auth/logout", { refreshToken });
    } catch { /* ignora falha no logout remoto */ }
    SigltApi.limparTokens();
    usuarioAtual = null;
    irParaLogin();
  }

  function estaAutenticado() {
    return !!SigltApi.getAccessToken() && !!carregarUsuarioDoToken();
  }

  function irParaLogin() {
    document.getElementById("app").hidden = true;
    document.getElementById("tela-login").hidden = false;
  }

  function irParaApp() {
    document.getElementById("tela-login").hidden = true;
    document.getElementById("app").hidden = false;
  }

  return {
    login, logout, estaAutenticado, getUsuario, carregarUsuarioDoToken,
    isAdministrador, temPermissaoModulo, irParaLogin, irParaApp, decodificarJwt
  };
})();
