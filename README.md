# IGS FotoPro

Sistema para estudio fotografico, eventos, formaturas, contratos e financeiro.

Desenvolvido por IGS AUTOMACAO COMERCIAL.

## Rodar em desenvolvimento

```bash
npm install
npm run dev
```

Frontend:

```bash
http://localhost:5173
```

API:

```bash
npm run dev:api
```

API health check:

```bash
http://localhost:3333/api/health
```

Frontend e API juntos:

```bash
npm run dev:all
```

## Login demonstrativo

Usuario: `admin`

Senha: `123`

## Banco PostgreSQL

Crie um arquivo `.env` baseado em `.env.example`.

Modo inicial sem banco:

```bash
DATABASE_MODE=memory
```

Para usar PostgreSQL nos modulos ja migrados:

```bash
DATABASE_MODE=postgres
```

Conexao sugerida nos prompts:

```bash
DATABASE_URL="postgresql://postgres:123@localhost:5432/igs_fotopro?schema=public"
```

Gerar Prisma Client:

```bash
npm run prisma:generate
```

Criar tabelas no banco:

```bash
npm run prisma:migrate
```

Abrir Prisma Studio:

```bash
npm run prisma:studio
```

## Modulos Iniciais

- Emitente com logo.
- Clientes e responsaveis.
- Fornecedores.
- Profissionais e freelancers.
- Produtos, servicos e pacotes.
- Agenda e eventos.
- Contratos.
- Livro caixa.
- Contas a receber.
- Contas a pagar.
- Usuarios e permissoes.
- Relatorios e dashboard.

## API Inicial

Rotas REST em memoria para desenvolvimento:

```bash
GET    /api/modules
GET    /api/:entity
POST   /api/:entity
PUT    /api/:entity/:id
DELETE /api/:entity/:id
```

Entidades aceitas:

```bash
emitentes
clientes
fornecedores
profissionais
produtos-servicos
contratos
contas-receber
contas-pagar
livro-caixa
usuarios
```

O schema Prisma ja esta preparado para PostgreSQL. A API usa memoria nesta etapa para permitir desenvolvimento mesmo antes de instalar/configurar o banco.

Nesta etapa, os modulos abaixo ja estao preparados para persistir via Prisma/PostgreSQL quando `DATABASE_MODE=postgres`:

- `clientes`
- `emitentes`
- `fornecedores`
- `profissionais`
- `produtos-servicos`
- `eventos`
- `contratos`
- `contas-receber`
- `contas-pagar`
- `livro-caixa`
- `usuarios`

O modulo `usuarios` ja possui senha criptografada com salt, usuario administrador padrao e endpoint de login. As permissoes ja sao gravadas para o administrador padrao, mas a aplicacao visual ainda nao bloqueia botoes por permissao em tempo real.

Endpoint de login:

```bash
POST /api/auth/login
```

Payload:

```json
{
  "usuario": "admin",
  "senha": "123"
}
```
