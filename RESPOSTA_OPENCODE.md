# RESPOSTA - Movido Usuarios para Cadastros

## Status: CONCLUIDO

### Verificacoes realizadas

**src/App.tsx:**
- Usuarios movido para grupo "Cadastros" no menu (linha 91)
- Usuarios removido de Configuracoes
- Formulario proprio de usuario criado com: Nome completo, Login, E-mail, Telefone, Perfil (select), Senha, Confirmar senha, Status (select), Observacoes
- Salvamento configurado para `/api/usuarios` via `entityByModule`
- Configuracoes ajustado para somente: Emitente, Permissoes, Backup, Logs

**server/index.ts:**
- Rota `/api/usuarios` ja tratada pelo generic CRUD (`/api/:entity`)
- `buildUsuarioData` existente com todos os campos: nome, login, email, telefone, senhaHash, perfil, ativo, observacoes
- EntityKey inclui `usuarios` na lista de entidades

**Build:** `npm run build` executado com sucesso (sem erros)

### Comandos git
Nenhum arquivo fonte foi modificado pois as alteracoes ja estavam aplicadas do commit anterior (`d93cf9b`). Nao ha o que commitar.
