# RESPOSTA - Execucao concluida

## Alteracoes realizadas

### src/App.tsx
- Adicionado modulo `usuarios` ao tipo `ModuleKey`
- Inserido `Usuarios` no menu **Cadastros** com icone User
- Adicionado `usuarios: 'usuarios'` ao `entityByModule`
- Criado bloco `moduleData.usuarios` com titulo, descricao e abas
- Criado `moduleFields.usuarios` com campos: Nome completo, Login, E-mail, Telefone, Perfil (select), Senha, Confirmar senha, Status, Observacoes
- Removido `Usuarios` das abas de Configuracoes (agora: Emitente, Permissoes, Backup, Logs)
- Removido registro USR-001 de Configuracoes
- Ajustados indices das abas de Configuracoes (Permissoes: 1, Backup: 2, Logs: 3)
- Adicionado `type="password"` para Senha e Confirmar senha
- Adicionado validacao de confirmacao de senha no `saveCurrentRecord`
- Alterado `buildPayload` para respeitar campo Status do formulario

### server/index.ts
- Atualizado `buildUsuarioData` para ler campos pelos labels corretos (Nome completo, Login, Observacoes)
- Adicionado `observacoes` ao retorno de `normalizeUsuarioRecord`

### Build
- `npm run build` concluido com sucesso
- Commit: `278398c - move usuarios para cadastros`
- Push realizado para `main`
