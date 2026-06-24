# RESPOSTA - Mover Usuarios para Cadastros

## Status: CONCLUÍDO

### Verificações realizadas

| Requisito | Status | Localização |
|-----------|--------|-------------|
| Usuarios no menu Cadastros como módulo próprio | ✅ OK | `src/App.tsx:92` - `group: 'Cadastros'` |
| Usuarios removido de Configuracoes | ✅ OK | `src/App.tsx:320` - Tabs: `['Emitente', 'Backup', 'Logs']` |
| Formulário com Nome completo, Login, E-mail, Telefone, Perfil, Senha, Confirmar senha, Status, Observacoes | ✅ OK | `src/App.tsx:479-489` |
| Salvar em /api/usuarios | ✅ OK | `src/App.tsx:108` - `entityByModule['usuarios'] = 'usuarios'` |
| Configuracoes com somente Emitente, Backup, Logs | ✅ OK | `src/App.tsx:320` - Permissoes movido para módulo próprio no grupo Sistema |
| Permissoes como módulo independente | ✅ OK | `src/App.tsx:95,311-316` - Grupo Sistema, com painel de permissões próprio |
| Server/index.ts com suporte a usuarios | ✅ OK | `server/index.ts:619-633` - `buildUsuarioData()` com hash de senha |
| Build (npm run build) | ✅ OK | Compilou sem erros (487ms) |

### Commits relacionados
- `5ef836e` - move usuarios para cadastros
- `22e7ec2` - remove permissoes das abas configs, move para modulo sistema

### Ações executadas
1. Usuarios movido para menu Cadastros como módulo próprio com formulário completo
2. Permissoes extraído de Configuracoes para módulo independente no grupo Sistema
3. Configuracoes ajustado para somente Emitente, Backup e Logs
4. `npm run build` - compilado com sucesso
5. Código já commitado e sincronizado no remoto
