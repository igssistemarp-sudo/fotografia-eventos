## Resultado da execucao das instrucoes

### Comando recebido
Mover Usuarios para o menu Cadastros como modulo proprio, remover Usuarios de Configuracoes, criar formulario de usuario com Nome completo, Login, E-mail, Telefone, Perfil, Senha, Confirmar senha, Status e Observacoes, salvar em /api/usuarios. Ajustar Configuracoes para ficar somente Emitente, Permissoes, Backup e Logs.

### Verificacao de alteracoes em src/App.tsx

| Item | Status |
|------|--------|
| Usuarios movido para o grupo `Cadastros` no menu | OK (linha 91: `group: 'Cadastros'`) |
| Usuarios removido de Configuracoes | OK (modulo separado, sem relacao) |
| Formulario de Usuarios com Nome completo, Login, E-mail, Telefone, Perfil, Senha, Confirmar senha, Status, Observacoes | OK (moduleFields.usuarios, linhas 458-468) |
| Perfil renderizado como `<select>` com opcoes Administrador, Gerente, Consulta, Operador | OK (linhas 1491-1501) |
| Status renderizado como `<select>` Ativo/Inativo | OK (linhas 1502-1509) |
| Senha e Confirmar senha com `<input type="password">` | OK (linha 1512) |
| Salvamento em `/api/usuarios` via `entityByModule` | OK (linha 106: `usuarios: 'usuarios'`) |
| Validacao de senha igual a confirmacao no `saveCurrentRecord` | OK (linhas 918-921) |
| Configuracoes com abas: Emitente, Permissoes, Backup, Logs | OK (linha 312) |

### Verificacao em server/index.ts

| Item | Status |
|------|--------|
| Entidade `usuarios` registrada em `entityNames` | OK (linha 140) |
| `buildUsuarioData` com campos Nome completo, Login, E-mail, Telefone, Perfil, Senha (hash), Status, Observacoes | OK (linhas 635-649) |
| Rota POST `/api/usuarios` funcional (rota generica `/api/:entity`) | OK (linha 971) |

### Build

```
npm run build - OK (vite build concluido em 585ms)
```

### Git

Commit `d93cf9b` ja existia com a mensagem "move usuarios para cadastros". Nenhuma alteracao adicional necessaria.
