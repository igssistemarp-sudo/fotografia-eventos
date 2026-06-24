# RESPOSTA - Mover Usuarios para Cadastros

## Status: CONCLUÍDO

### Verificações realizadas:

1. **Usuarios no menu Cadastros** ✅
   - `src/App.tsx:91`: `{ key: 'usuarios', label: 'Usuarios', group: 'Cadastros', icon: User }`

2. **Usuarios removido de Configuracoes** ✅
   - `src/App.tsx:312`: Configuracoes tabs: `['Emitente', 'Permissoes', 'Backup', 'Logs']`

3. **Formulário de usuário criado** ✅
   - `src/App.tsx:458-468`: Campos: Nome completo, Login, E-mail, Telefone, Perfil, Senha, Confirmar senha, Status, Observacoes

4. **Salvar em /api/usuarios** ✅
   - `src/App.tsx:106`: `entityByModule['usuarios'] = 'usuarios'`
   - `server/index.ts`: Rota `/api/usuarios` já implementada com CRUD completo e `buildUsuarioData()`

5. **Configuracoes ajustado** ✅
   - `src/App.tsx:312`: Apenas Emitente, Permissoes, Backup, Logs
   - `src/App.tsx:469-486`: Campos apenas do emitente

6. **Build** ✅
   - `npm run build`: Sucesso (471ms, 1742 módulos transformados)

7. **Git** ⚠️
   - Nenhuma alteração pendente — o código já estava no estado desejado no commit `bdd7d20`
   - `git add` executado sem erros; `git commit` informou "nothing to commit"

### Conclusão
Todas as alterações solicitadas já estavam implementadas no repositório. O build foi validado com sucesso.
