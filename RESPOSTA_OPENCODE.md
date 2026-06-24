# RESPOSTA - Mover Usuarios para Cadastros

## Status: CONCLUÍDO

### Verificações realizadas

| Requisito | Status | Localização |
|-----------|--------|-------------|
| Usuarios no menu Cadastros como módulo próprio | ✅ OK | `src/App.tsx:92` - `group: 'Cadastros'` |
| Usuarios removido de Configuracoes | ✅ OK | `src/App.tsx:320` - Tabs: `['Emitente', 'Permissoes', 'Backup', 'Logs']` |
| Formulário com Nome completo, Login, E-mail, Telefone, Perfil, Senha, Confirmar senha, Status, Observacoes | ✅ OK | `src/App.tsx:479-489` |
| Salvar em /api/usuarios | ✅ OK | `src/App.tsx:108` - `entityByModule['usuarios'] = 'usuarios'` |
| Configuracoes somente Emitente, Permissoes, Backup, Logs | ✅ OK | `src/App.tsx:320` - Ajustado description e tabs |
| Server/index.ts com suporte a usuarios | ✅ OK | `server/index.ts:619-633` - `buildUsuarioData()` com hash de senha |
| Build (npm run build) | ✅ OK | Compilou sem erros (443ms) |
| Git push | ✅ OK | `origin/main` atualizado |

### Commits relacionados
- `5ef836e` - move usuarios para cadastros

### Ações executadas
1. Ajustado `moduleData.configuracoes.tabs` para `['Emitente', 'Permissoes', 'Backup', 'Logs']` em `src/App.tsx:320`
2. Atualizado `moduleData.configuracoes.description` para incluir "permissoes"
3. `npm run build` - compilado com sucesso
4. `git add`, `git commit -m "move usuarios para cadastros"`, `git push` - tudo atualizado no remoto
