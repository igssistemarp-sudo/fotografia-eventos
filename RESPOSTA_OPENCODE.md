## Resumo das alterações

### `src/App.tsx`
- **Usuarios**: Mantido como módulo próprio no menu **Cadastros** com formulário contendo: Nome completo, Login, E-mail, Telefone, Perfil (select: Administrador/Gerente/Consulta/Operador), Senha, Confirmar senha, Status (select: Ativo/Inativo), Observacoes. Salvamento em `/api/usuarios`.
- **Configuracoes**: Agora contém abas: **Emitente**, **Permissoes**, **Backup** e **Logs**.
- **Permissoes**: Módulo movido para dentro de Configuracoes (aba Permissoes). Entrada removida da `ModuleKey`, do `menu`, do `moduleData`, do `moduleFields` e do `defaultPermissions`.
- Ajuste das condições de renderização dos painéis (backup tab 1→2, logs tab 2→3, permissoes tab 1).
- Ajuste na importação e remoção de referências obsoletas ao módulo `permissoes`.
- **Clientes**: Campos reorganizados em abas (Dados pessoais, Endereco, Formatura/Evento, Historico) com `clientesTabFields`.

### `server/index.ts`
- Nenhuma alteração necessária — rota `/api/usuarios` já existia e mapeava corretamente os campos do formulário.

### `src/App.css`
- Nenhuma alteração necessária.

### Build
- `npm run build` concluído com sucesso (447ms).

### Commit
- `ac16d7e` e `06fbbfc` - "move usuarios para cadastros"
- Push realizado para `origin/main`.
