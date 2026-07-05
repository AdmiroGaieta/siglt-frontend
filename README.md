# SIGLT — Frontend (HTML + CSS + JavaScript puro)

Sem frameworks, sem build, sem CDN. Apenas ficheiros estáticos que falam diretamente com a API SIGLT.

## Estrutura

```
index.html          -> Login + shell da aplicação (uma única página)
css/styles.css       -> Paleta de cores e todos os estilos
js/config.js         -> URL base da API (ajustar aqui se mudar)
js/api.js            -> Wrapper fetch com JWT + refresh automático em 401
js/auth.js           -> Login/logout, leitura de claims do JWT (perfil/permissões)
js/ui.js             -> Toasts, modais, formatação
js/menu.js           -> Menu lateral: cruza módulos licenciados (/api/Sistema/modulos) com permissões do JWT
js/router.js         -> Router simples por hash (#dashboard, #funcionarios, ...)
js/main.js           -> Arranque da aplicação
js/views/*.js         -> Uma view por módulo (dashboard, funcionarios, motoristas, veiculos, logistica, stock, usuarios, perfil)
```

## Como correr

⚠️ **Não abras `index.html` diretamente com duplo-clique** (`file://`) — alguns browsers bloqueiam `fetch` nesse esquema por segurança.
Em vez disso, serve a pasta com um servidor estático simples:

```bash
# Python já vem em quase todos os sistemas
cd SIGLT-Frontend
python -m http.server 5500

# ou, se tiveres Node:
npx serve -l 5500
```

Depois abre `http://localhost:5500` no browser.

## Configuração da API

Edita `js/config.js`:

```js
const SIGLT_CONFIG = {
  apiBaseUrl: "http://localhost:5180/api"
};
```

Troca para o endereço real quando fizeres deploy (ex.: `https://api.teucliente.com/api`).

## Login

Usa as credenciais seed do backend:
```
Utilizador: admin
Password:   Admin@123
```

## Como funciona o controlo de menu por Role/Módulo

1. Depois do login, o token JWT é decodificado no browser (`auth.js`) para extrair `perfil` e a lista de `permissao` (ex.: `RH.Ler`, `Frota.Criar`...).
2. Em paralelo, chama-se `GET /api/Sistema/modulos`, que devolve os módulos **licenciados para este cliente** (ver sistema de licenciamento no backend).
3. `menu.js` só mostra um item de menu se **ambas** as condições forem verdadeiras:
   - o módulo está licenciado para este cliente, **e**
   - o utilizador tem alguma permissão desse módulo (ou é Administrador, que vê tudo o que estiver licenciado).
4. O separador "Administração → Usuários" só aparece se `perfil === "Administrador"`.

Isto significa que, se venderes só o módulo de Logística a um cliente, o menu desse cliente nunca vai mostrar Frota/Stock/RH — mesmo que o utilizador tenha permissões nesses módulos (a licença do backend bloqueia primeiro, com 403).

## Funcionalidades por módulo

- **Dashboard** — indicadores gerais (frota, logística, stock, efetivos)
- **RH** — Funcionários (criar/editar/transferir + histórico), Áreas (criar/editar), Cargos (criar/editar)
- **Motoristas** — registar, listar, alterar estado operacional
- **Frota** — Veículos (criar/editar), Manutenção, Abastecimento
- **Logística** — Centros Logísticos, Rotas (com listagem), Cargas/Entregas (com listagem e estado), Viagens (criar com rota e cargas associadas, iniciar/concluir/cancelar)
- **Stock** — Produtos (criar/editar), Categorias (criar/editar), Consultar Stock, Registar Movimento, Ajustar Stock (definir quantidade exata após inventário), Abaixo do Mínimo
- **Usuários** (Administrador) — criar, listar, ativar/desativar, redefinir password
- **Meu Perfil** — qualquer utilizador pode editar o próprio email/contacto e alterar a própria password; o perfil (role) está bloqueado e só um Administrador o pode mudar

Todas as listas com dados (produtos, rotas, cargas, veículos, etc.) têm botão de edição quando o backend suporta `PUT`.
