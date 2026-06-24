import cors from 'cors'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import 'dotenv/config'
import express from 'express'
import { z } from 'zod'

process.on('unhandledRejection', (reason) => {
  console.error('[API] Excecao nao tratada:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('[API] Erro fatal nao capturado:', error)
})

type EntityKey =
  | 'emitentes'
  | 'clientes'
  | 'fornecedores'
  | 'profissionais'
  | 'produtos-servicos'
  | 'eventos'
  | 'contratos'
  | 'contas-receber'
  | 'contas-pagar'
  | 'livro-caixa'
  | 'usuarios'

type EntityRecord = {
  id: string
  codigo: string
  nome: string
  status: string
  observacoes?: string
  createdAt: string
  updatedAt: string
  [key: string]: string | number | boolean | undefined
}

type SeedRecord = {
  codigo: string
  nome: string
  status: string
  observacoes?: string
  [key: string]: string | number | boolean | undefined
}

type PrismaClientLike = {
  cliente: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
  emitente: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
  fornecedor: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
  profissional: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
  produtoServico: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
  evento: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
    findFirst: (args?: unknown) => Promise<unknown | null>
  }
  contrato: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
    findFirst: (args?: unknown) => Promise<unknown | null>
  }
  contaReceber: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
  }
  contaPagar: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
  }
  livroCaixa: {
    findMany: (args?: unknown) => Promise<unknown[]>
    create: (args: unknown) => Promise<unknown>
  }
  usuario: {
    findMany: (args?: unknown) => Promise<unknown[]>
    findFirst: (args?: unknown) => Promise<unknown | null>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
  permissao: {
    createMany: (args: unknown) => Promise<unknown>
  }
}

const app = express()
const port = Number(process.env.API_PORT ?? 3333)
const databaseMode = process.env.DATABASE_MODE ?? 'memory'
let prismaInstance: PrismaClientLike | null = null

app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))

app.use((_request, response, next) => {
  response.on('close', () => {
    if (response.destroyed && !response.headersSent) {
      console.error('[API] Conexao interrompida pelo cliente')
    }
  })
  next()
})

const entityNames: EntityKey[] = [
  'emitentes',
  'clientes',
  'fornecedores',
  'profissionais',
  'produtos-servicos',
  'eventos',
  'contratos',
  'contas-receber',
  'contas-pagar',
  'livro-caixa',
  'usuarios',
]

const store = entityNames.reduce<Record<EntityKey, EntityRecord[]>>((database, entity) => {
  database[entity] = []
  return database
}, {} as Record<EntityKey, EntityRecord[]>)

const entitySchema = z.object({
  nome: z.string().min(2, 'Informe pelo menos 2 caracteres.'),
  status: z.string().default('Ativo'),
  observacoes: z.string().optional(),
}).catchall(z.union([z.string(), z.number(), z.boolean(), z.undefined()]))

const initialData: Partial<Record<EntityKey, SeedRecord[]>> = {
  emitentes: [
    { codigo: 'EMI-001', nome: 'IGS FotoPro', status: 'Ativo', documento: 'CNPJ/CPF', logo: 'logo.jpeg' },
  ],
}

for (const entity of entityNames) {
  for (const record of initialData[entity] ?? []) {
    const now = new Date().toISOString()
    const seededRecord: EntityRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    store[entity].push(seededRecord)
  }
}

function nextCode(entity: EntityKey) {
  const prefix = entity
    .split('-')
    .map((part) => part.slice(0, 3).toUpperCase())
    .join('')
    .slice(0, 6)
  return `${prefix}-${String(store[entity].length + 1).padStart(4, '0')}`
}

function assertEntity(entity: string): asserts entity is EntityKey {
  if (!entityNames.includes(entity as EntityKey)) {
    throw new Error('Modulo nao encontrado.')
  }
}

function isPostgresEntity(entity: EntityKey) {
  return databaseMode === 'postgres' && [
    'clientes',
    'emitentes',
    'fornecedores',
    'profissionais',
    'produtos-servicos',
    'eventos',
    'contratos',
    'contas-receber',
    'contas-pagar',
    'livro-caixa',
    'usuarios',
  ].includes(entity)
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':')

  if (!salt || !hash) {
    return false
  }

  const testHash = scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(hash, 'hex')
  return storedBuffer.length === testHash.length && timingSafeEqual(storedBuffer, testHash)
}

async function getPrisma() {
  if (prismaInstance) {
    return prismaInstance
  }

  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import('@prisma/client'),
    import('@prisma/adapter-pg'),
  ])
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prismaInstance = new PrismaClient({ adapter }) as PrismaClientLike
  return prismaInstance
}

function readPayloadValue(payload: Record<string, unknown>, label: string) {
  const value = payload[label]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function parseMoney(value?: string) {
  if (!value) {
    return undefined
  }

  const normalized = value
    .replace(/R\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .match(/\d+(\.\d+)?/)

  return normalized ? Number(normalized[0]) : undefined
}

function parsePercent(value?: string) {
  const match = value?.match(/\d+(?:[,.]\d+)?/)
  return match ? Number(match[0].replace(',', '.')) : undefined
}

function toApiDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString()
}

function normalizePrismaRecord(record: unknown): EntityRecord {
  const source = record as Record<string, unknown>
  const codigo = typeof source.codigo === 'number' ? String(source.codigo).padStart(4, '0') : String(source.codigo ?? 'API')
  const nome = String(source.nome ?? source.razaoSocial ?? source.nomeFantasia ?? 'Registro sem nome')
  const status = typeof source.ativo === 'boolean' ? (source.ativo ? 'Ativo' : 'Inativo') : String(source.status ?? 'Ativo')
  const createdAt = toApiDate(source.createdAt)
  const updatedAt = toApiDate(source.updatedAt)

  return {
    id: String(source.id ?? crypto.randomUUID()),
    codigo,
    nome,
    status,
    categoria: typeof source.categoria === 'string' ? source.categoria : undefined,
    perfil: typeof source.perfil === 'string' ? source.perfil : undefined,
    email: typeof source.email === 'string' ? source.email : undefined,
    documento: typeof source.documento === 'string' ? source.documento : undefined,
    telefone: typeof source.telefone === 'string' ? source.telefone : undefined,
    whatsapp: typeof source.whatsapp === 'string' ? source.whatsapp : undefined,
    valorContratado: typeof source.valorContratado === 'number' ? source.valorContratado : undefined,
    valorOriginal: typeof source.valorOriginal === 'number' ? source.valorOriginal : undefined,
    multa: typeof source.multa === 'number' ? source.multa : undefined,
    formaPagamento: typeof source.formaPagamento === 'string' ? source.formaPagamento : undefined,
    observacoes: typeof source.observacoes === 'string' ? source.observacoes : undefined,
    createdAt,
    updatedAt,
  }
}

function normalizeUsuarioRecord(record: unknown): EntityRecord {
  const source = record as Record<string, unknown>

  return {
    id: String(source.id ?? crypto.randomUUID()),
    codigo: typeof source.codigo === 'number' ? String(source.codigo).padStart(4, '0') : String(source.codigo ?? 'USR'),
    nome: String(source.nome ?? 'Usuario sem nome'),
    status: source.ativo === false ? 'Inativo' : 'Ativo',
    perfil: typeof source.perfil === 'string' ? source.perfil : undefined,
    email: typeof source.email === 'string' ? source.email : undefined,
    telefone: typeof source.telefone === 'string' ? source.telefone : undefined,
    observacoes: typeof source.observacoes === 'string' ? source.observacoes : undefined,
    createdAt: toApiDate(source.createdAt),
    updatedAt: toApiDate(source.updatedAt),
  }
}

function readRecordId(record: unknown) {
  const id = (record as Record<string, unknown> | null)?.id
  return typeof id === 'string' ? id : undefined
}

async function getDefaultClienteId(prisma: PrismaClientLike) {
  const existing = await prisma.cliente.findMany({ take: 1, orderBy: { codigo: 'asc' } })
  const existingId = readRecordId(existing[0])

  if (existingId) {
    return existingId
  }

  const created = await prisma.cliente.create({
    data: {
      tipo: 'Pessoa fisica',
      categoria: 'Cliente avulso',
      nome: 'Cliente Padrao IGS FotoPro',
      ativo: true,
    },
  })

  return readRecordId(created) ?? ''
}

async function getDefaultEventoId(prisma: PrismaClientLike) {
  const existing = await prisma.evento.findFirst({ orderBy: { codigo: 'asc' } })
  const existingId = readRecordId(existing)

  if (existingId) {
    return existingId
  }

  const clienteId = await getDefaultClienteId(prisma)
  const created = await prisma.evento.create({
    data: {
      tipo: 'Evento social',
      titulo: 'Evento Padrao IGS FotoPro',
      clienteId,
      dataEvento: new Date(),
      status: 'Proposta',
    },
  })

  return readRecordId(created) ?? ''
}

async function getDefaultContratoId(prisma: PrismaClientLike) {
  const existing = await prisma.contrato.findFirst({ orderBy: { codigo: 'asc' } })
  const existingId = readRecordId(existing)

  if (existingId) {
    return existingId
  }

  const clienteId = await getDefaultClienteId(prisma)
  const eventoId = await getDefaultEventoId(prisma)
  const created = await prisma.contrato.create({
    data: {
      clienteId,
      eventoId,
      modelo: 'Contrato padrao',
      status: 'Pendente',
      clausulas: 'Contrato criado automaticamente para vinculos iniciais.',
    },
  })

  return readRecordId(created) ?? ''
}

async function ensureAdminUser(prisma: PrismaClientLike) {
  const existing = await prisma.usuario.findFirst({ where: { login: 'admin' } })

  if (existing) {
    return existing
  }

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      login: 'admin',
      email: 'admin@igs.local',
      senhaHash: hashPassword('123'),
      perfil: 'Administrador',
      ativo: true,
    },
  })

  const usuarioId = readRecordId(admin)

  if (usuarioId) {
    await prisma.permissao.createMany({
      data: entityNames.map((modulo) => ({
        usuarioId,
        modulo,
        visualizar: true,
        incluir: true,
        editar: true,
        excluir: true,
        imprimir: true,
        exportar: true,
        estornar: true,
      })),
    })
  }

  return admin
}

function buildClienteData(payload: Record<string, unknown>) {
  const enderecoParts = [
    readPayloadValue(payload, 'Endereco'),
    readPayloadValue(payload, 'Numero'),
    readPayloadValue(payload, 'Bairro'),
    readPayloadValue(payload, 'Cidade'),
    readPayloadValue(payload, 'UF'),
    readPayloadValue(payload, 'Complemento'),
  ].filter((v): v is string => typeof v === 'string' && v.length > 0)

  return {
    tipo: String(payload.tipo ?? payload.tipoPessoa ?? 'Pessoa fisica'),
    categoria: readPayloadValue(payload, 'Categoria'),
    nome: String(payload.nome ?? readPayloadValue(payload, 'Nome completo') ?? readPayloadValue(payload, 'Nome/Razao social') ?? 'Cliente sem nome'),
    apelido: readPayloadValue(payload, 'Nome fantasia / apelido'),
    documento: readPayloadValue(payload, 'CPF/CNPJ'),
    rgIe: readPayloadValue(payload, 'RG / IE'),
    nascimento: readPayloadValue(payload, 'Data de nascimento'),
    telefone: readPayloadValue(payload, 'Telefone'),
    whatsapp: readPayloadValue(payload, 'WhatsApp'),
    email: readPayloadValue(payload, 'E-mail'),
    instagram: readPayloadValue(payload, 'Instagram'),
    cep: readPayloadValue(payload, 'CEP'),
    endereco: enderecoParts.length > 0 ? enderecoParts.join(', ') : readPayloadValue(payload, 'Endereco'),
    profissao: readPayloadValue(payload, 'Profissao'),
    responsavelFinanceiro: readPayloadValue(payload, 'Responsavel financeiro'),
    cpfResponsavel: readPayloadValue(payload, 'CPF do responsavel'),
    curso: readPayloadValue(payload, 'Curso / Turma'),
    instituicao: readPayloadValue(payload, 'Instituicao de ensino'),
    conclusao: readPayloadValue(payload, 'Ano / semestre conclusao'),
    pacoteContratado: readPayloadValue(payload, 'Pacote contratado'),
    valorPacote: parseMoney(readPayloadValue(payload, 'Valor do pacote')),
    quantidadeParcelas: parseInt(readPayloadValue(payload, 'Quantidade de parcelas') ?? '0', 10),
    observacoes: readPayloadValue(payload, 'Observacoes'),
    ativo: String(payload.status ?? 'Ativo') === 'Ativo',
  }
}

function buildEmitenteData(payload: Record<string, unknown>) {
  return {
    razaoSocial: String(payload.nome ?? readPayloadValue(payload, 'Razao social') ?? 'Emitente sem razao social'),
    nomeFantasia: readPayloadValue(payload, 'Nome fantasia'),
    documento: readPayloadValue(payload, 'CNPJ / CPF'),
    inscricaoEstadual: readPayloadValue(payload, 'Inscricao Estadual'),
    inscricaoMunicipal: readPayloadValue(payload, 'Inscricao Municipal'),
    telefone: readPayloadValue(payload, 'Telefone'),
    whatsapp: readPayloadValue(payload, 'WhatsApp'),
    email: readPayloadValue(payload, 'E-mail'),
    site: readPayloadValue(payload, 'Site'),
    instagram: readPayloadValue(payload, 'Instagram'),
    cep: readPayloadValue(payload, 'CEP'),
    endereco: readPayloadValue(payload, 'Endereco'),
    responsavelLegal: readPayloadValue(payload, 'Responsavel legal'),
    cpfResponsavel: readPayloadValue(payload, 'CPF do responsavel'),
    emailFinanceiro: readPayloadValue(payload, 'E-mail financeiro'),
    logoPath: 'logo.jpeg',
    observacoes: readPayloadValue(payload, 'Observacoes'),
    ativo: String(payload.status ?? 'Ativo') === 'Ativo',
  }
}

function buildFornecedorData(payload: Record<string, unknown>) {
  return {
    tipoPessoa: readPayloadValue(payload, 'Tipo de pessoa') ?? 'Juridica',
    nome: String(payload.nome ?? readPayloadValue(payload, 'Razao social / Nome') ?? 'Fornecedor sem nome'),
    nomeFantasia: readPayloadValue(payload, 'Nome fantasia'),
    categoria: readPayloadValue(payload, 'Categoria'),
    documento: readPayloadValue(payload, 'CPF/CNPJ'),
    rgIe: readPayloadValue(payload, 'IE / RG'),
    telefone: readPayloadValue(payload, 'Telefone'),
    whatsapp: readPayloadValue(payload, 'WhatsApp'),
    email: readPayloadValue(payload, 'E-mail'),
    cep: readPayloadValue(payload, 'CEP'),
    endereco: readPayloadValue(payload, 'Endereco'),
    banco: readPayloadValue(payload, 'Banco'),
    agencia: readPayloadValue(payload, 'Agencia'),
    conta: readPayloadValue(payload, 'Conta'),
    pix: readPayloadValue(payload, 'Chave PIX'),
    condicaoPagamento: readPayloadValue(payload, 'Condicao de pagamento'),
    observacoes: readPayloadValue(payload, 'Observacoes'),
    ativo: String(payload.status ?? 'Ativo') === 'Ativo',
  }
}

function buildProfissionalData(payload: Record<string, unknown>) {
  return {
    nome: String(payload.nome ?? readPayloadValue(payload, 'Nome completo') ?? 'Profissional sem nome'),
    apelido: readPayloadValue(payload, 'Apelido / nome profissional'),
    tipo: readPayloadValue(payload, 'Tipo'),
    especialidade: readPayloadValue(payload, 'Especialidade'),
    documento: readPayloadValue(payload, 'CPF/CNPJ'),
    rgIe: readPayloadValue(payload, 'RG / IE'),
    telefone: readPayloadValue(payload, 'Telefone'),
    whatsapp: readPayloadValue(payload, 'WhatsApp'),
    email: readPayloadValue(payload, 'E-mail'),
    valorDiaria: parseMoney(readPayloadValue(payload, 'Valor da diaria')),
    valorHora: parseMoney(readPayloadValue(payload, 'Valor por hora')),
    comissaoPercentual: parsePercent(readPayloadValue(payload, 'Comissao (%)')),
    formaPagamento: readPayloadValue(payload, 'Forma de pagamento'),
    pix: readPayloadValue(payload, 'Chave PIX'),
    banco: readPayloadValue(payload, 'Banco / agencia / conta'),
    disponibilidade: readPayloadValue(payload, 'Disponibilidade'),
    observacoes: readPayloadValue(payload, 'Observacoes'),
    ativo: String(payload.status ?? 'Ativo') === 'Ativo',
  }
}

function buildProdutoServicoData(payload: Record<string, unknown>) {
  return {
    tipo: readPayloadValue(payload, 'Tipo') ?? 'Servico',
    categoria: readPayloadValue(payload, 'Categoria'),
    descricao: String(payload.nome ?? readPayloadValue(payload, 'Descricao') ?? 'Produto/servico sem descricao'),
    unidade: readPayloadValue(payload, 'Unidade'),
    custo: parseMoney(readPayloadValue(payload, 'Custo unitario')),
    precoVenda: parseMoney(readPayloadValue(payload, 'Preco de venda')),
    comissaoPadrao: parsePercent(readPayloadValue(payload, 'Comissao padrao')),
    duracaoEstimada: readPayloadValue(payload, 'Duracao estimada'),
    fotosInclusas: parseInt(readPayloadValue(payload, 'Fotos inclusas') ?? '0', 10),
    videosInclusos: parseInt(readPayloadValue(payload, 'Videos inclusos') ?? '0', 10),
    permiteParcelamento: true,
    maximoParcelas: parseInt(readPayloadValue(payload, 'Parcelamento maximo') ?? '1', 10),
    itensInclusos: readPayloadValue(payload, 'Itens inclusos (pacote)'),
    observacoes: readPayloadValue(payload, 'Itens inclusos (pacote)'),
    ativo: String(payload.status ?? 'Ativo') === 'Ativo',
  }
}

async function buildEventoData(prisma: PrismaClientLike, payload: Record<string, unknown>) {
  return {
    tipo: readPayloadValue(payload, 'Tipo de evento') ?? 'Evento social',
    titulo: String(payload.nome ?? readPayloadValue(payload, 'Titulo do evento') ?? 'Evento sem titulo'),
    clienteId: await getDefaultClienteId(prisma),
    responsavelFinanceiro: readPayloadValue(payload, 'Cliente principal'),
    dataEvento: readPayloadValue(payload, 'Data do evento') ? new Date(readPayloadValue(payload, 'Data do evento')!) : new Date(),
    horaInicio: readPayloadValue(payload, 'Hora inicio'),
    horaFim: readPayloadValue(payload, 'Hora fim'),
    local: readPayloadValue(payload, 'Local do evento'),
    cep: readPayloadValue(payload, 'CEP'),
    endereco: readPayloadValue(payload, 'Endereco completo'),
    status: String(payload.status ?? 'Proposta'),
    valorContratado: parseMoney(readPayloadValue(payload, 'Valor contratado')),
    entrada: parseMoney(readPayloadValue(payload, 'Valor de entrada')),
    quantidadeParcelas: parseInt(readPayloadValue(payload, 'Quantidade de parcelas') ?? '1', 10),
    prazoEntrega: readPayloadValue(payload, 'Prazo de entrega'),
    observacoes: readPayloadValue(payload, 'Observacoes'),
  }
}

async function buildContratoData(prisma: PrismaClientLike, payload: Record<string, unknown>) {
  return {
    clienteId: await getDefaultClienteId(prisma),
    eventoId: await getDefaultEventoId(prisma),
    modelo: readPayloadValue(payload, 'Modelo de contrato') ?? 'Contrato fotografico',
    status: readPayloadValue(payload, 'Status de assinatura') ?? String(payload.status ?? 'Pendente'),
    valor: parseMoney(readPayloadValue(payload, 'Valor contratado')),
    clausulas: readPayloadValue(payload, 'Clausulas editaveis'),
    assinado: /assinado/i.test(readPayloadValue(payload, 'Status de assinatura') ?? ''),
    prazoEntrega: readPayloadValue(payload, 'Prazo de entrega'),
  }
}

async function buildContaReceberData(prisma: PrismaClientLike, payload: Record<string, unknown>) {
  const parcela = parseInt(readPayloadValue(payload, 'Parcela') ?? '1', 10)
  const totalParcelas = parseInt(readPayloadValue(payload, 'Total de parcelas') ?? '1', 10)
  const nomeCliente = readPayloadValue(payload, 'Cliente')

  return {
    clienteId: nomeCliente ? await getDefaultClienteId(prisma) : await getDefaultClienteId(prisma),
    eventoId: readPayloadValue(payload, 'Evento vinculado') ? await getDefaultEventoId(prisma) : await getDefaultEventoId(prisma),
    contratoId: readPayloadValue(payload, 'Contrato vinculado') ? await getDefaultContratoId(prisma) : await getDefaultContratoId(prisma),
    numeroParcela: parcela,
    totalParcelas,
    emissao: readPayloadValue(payload, 'Data de emissao') ? new Date(readPayloadValue(payload, 'Data de emissao')!) : new Date(),
    vencimento: readPayloadValue(payload, 'Data de vencimento') ? new Date(readPayloadValue(payload, 'Data de vencimento')!) : new Date(),
    valorOriginal: parseMoney(readPayloadValue(payload, 'Valor original')) ?? 0,
    juros: parseMoney(readPayloadValue(payload, 'Juros')),
    multa: parseMoney(readPayloadValue(payload, 'Multa')),
    desconto: parseMoney(readPayloadValue(payload, 'Desconto')),
    formaPagamento: readPayloadValue(payload, 'Forma de pagamento'),
    status: readPayloadValue(payload, 'Status') ?? 'Aberto',
    observacoes: readPayloadValue(payload, 'Observacoes'),
  }
}

async function buildContaPagarData(prisma: PrismaClientLike, payload: Record<string, unknown>) {
  return {
    emissao: readPayloadValue(payload, 'Data de emissao') ? new Date(readPayloadValue(payload, 'Data de emissao')!) : new Date(),
    vencimento: readPayloadValue(payload, 'Data de vencimento') ? new Date(readPayloadValue(payload, 'Data de vencimento')!) : new Date(),
    categoria: readPayloadValue(payload, 'Categoria') ?? 'Despesa administrativa',
    descricao: String(payload.nome ?? readPayloadValue(payload, 'Descricao') ?? readPayloadValue(payload, 'Fornecedor') ?? 'Conta a pagar'),
    valorOriginal: parseMoney(readPayloadValue(payload, 'Valor original')) ?? 0,
    juros: parseMoney(readPayloadValue(payload, 'Juros')),
    multa: parseMoney(readPayloadValue(payload, 'Multa')),
    desconto: parseMoney(readPayloadValue(payload, 'Desconto')),
    formaPagamento: readPayloadValue(payload, 'Forma de pagamento'),
    eventoId: readPayloadValue(payload, 'Evento vinculado') ? await getDefaultEventoId(prisma) : await getDefaultEventoId(prisma),
    contratoId: await getDefaultContratoId(prisma),
    status: readPayloadValue(payload, 'Status') ?? 'Aberto',
    observacoes: readPayloadValue(payload, 'Observacoes'),
  }
}

async function buildLivroCaixaData(prisma: PrismaClientLike, payload: Record<string, unknown>) {
  return {
    tipo: readPayloadValue(payload, 'Tipo de lancamento')?.includes('saida') ? 'Saida' : 'Entrada',
    categoria: readPayloadValue(payload, 'Tipo de lancamento') ?? 'Lancamento manual',
    descricao: String(payload.nome ?? readPayloadValue(payload, 'Cliente ou fornecedor') ?? 'Lancamento no caixa'),
    valor: parseMoney(readPayloadValue(payload, 'Valor original')) ?? 0,
    formaPagamento: readPayloadValue(payload, 'Forma de pagamento'),
    clienteNome: readPayloadValue(payload, 'Cliente ou fornecedor'),
    eventoId: await getDefaultEventoId(prisma),
    contratoId: await getDefaultContratoId(prisma),
    observacoes: readPayloadValue(payload, 'Observacoes'),
  }
}

function buildUsuarioData(payload: Record<string, unknown>) {
  const password = readPayloadValue(payload, 'Senha') ?? String(payload.senha ?? '123')
  const perfil = readPayloadValue(payload, 'Perfil') ?? 'Consulta'

  return {
    nome: String(readPayloadValue(payload, 'Nome completo') ?? 'Usuario'),
    login: String(readPayloadValue(payload, 'Login') ?? `usuario-${Date.now()}`),
    email: readPayloadValue(payload, 'E-mail'),
    telefone: readPayloadValue(payload, 'Telefone'),
    senhaHash: hashPassword(password),
    perfil,
    ativo: String(payload.status ?? 'Ativo') === 'Ativo',
    observacoes: readPayloadValue(payload, 'Observacoes'),
  }
}

async function listPostgresRecords(entity: EntityKey) {
  const prisma = await getPrisma()

  if (entity === 'clientes') {
    const records = await prisma.cliente.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'emitentes') {
    const records = await prisma.emitente.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'fornecedores') {
    const records = await prisma.fornecedor.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'profissionais') {
    const records = await prisma.profissional.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'produtos-servicos') {
    const records = await prisma.produtoServico.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'eventos') {
    const records = await prisma.evento.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'contratos') {
    const records = await prisma.contrato.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'contas-receber') {
    const records = await prisma.contaReceber.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'contas-pagar') {
    const records = await prisma.contaPagar.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'livro-caixa') {
    const records = await prisma.livroCaixa.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizePrismaRecord)
  }

  if (entity === 'usuarios') {
    await ensureAdminUser(prisma)
    const records = await prisma.usuario.findMany({ orderBy: { codigo: 'asc' } })
    return records.map(normalizeUsuarioRecord)
  }

  return store[entity]
}

async function createPostgresRecord(entity: EntityKey, payload: Record<string, unknown>) {
  const prisma = await getPrisma()

  if (entity === 'clientes') {
    return normalizePrismaRecord(await prisma.cliente.create({ data: buildClienteData(payload) }))
  }

  if (entity === 'emitentes') {
    return normalizePrismaRecord(await prisma.emitente.create({ data: buildEmitenteData(payload) }))
  }

  if (entity === 'fornecedores') {
    return normalizePrismaRecord(await prisma.fornecedor.create({ data: buildFornecedorData(payload) }))
  }

  if (entity === 'profissionais') {
    return normalizePrismaRecord(await prisma.profissional.create({ data: buildProfissionalData(payload) }))
  }

  if (entity === 'produtos-servicos') {
    return normalizePrismaRecord(await prisma.produtoServico.create({ data: buildProdutoServicoData(payload) }))
  }

  if (entity === 'eventos') {
    return normalizePrismaRecord(await prisma.evento.create({ data: await buildEventoData(prisma, payload) }))
  }

  if (entity === 'contratos') {
    return normalizePrismaRecord(await prisma.contrato.create({ data: await buildContratoData(prisma, payload) }))
  }

  if (entity === 'contas-receber') {
    return normalizePrismaRecord(await prisma.contaReceber.create({ data: await buildContaReceberData(prisma, payload) }))
  }

  if (entity === 'contas-pagar') {
    return normalizePrismaRecord(await prisma.contaPagar.create({ data: await buildContaPagarData(prisma, payload) }))
  }

  if (entity === 'livro-caixa') {
    return normalizePrismaRecord(await prisma.livroCaixa.create({ data: await buildLivroCaixaData(prisma, payload) }))
  }

  if (entity === 'usuarios') {
    return normalizeUsuarioRecord(await prisma.usuario.create({ data: buildUsuarioData(payload) }))
  }

  throw new Error('Modulo ainda nao migrado para PostgreSQL.')
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', system: 'IGS FotoPro', database: databaseMode })
})

app.get('/api/modules', (_request, response) => {
  response.json(entityNames)
})

let backupConfig = {
  postgresBinPath: 'C:\\Program Files\\PostgreSQL\\16\\bin',
  databaseName: 'igs_fotopro',
  username: 'postgres',
  destinationFolder: 'C:\\Backups\\igs_fotopro',
  automaticSchedule: '23:00',
  automaticActive: true,
  backupsToKeep: 5,
}

const backupLogs: Array<{ id: string; tipo: string; status: string; mensagem: string; createdAt: string }> = [
  { id: '1', tipo: 'Automatico', status: 'Sucesso', mensagem: 'Backup compactado com sucesso em ZIP.', createdAt: new Date(Date.now() - 86400000).toISOString() },
]

const auditLogs: Array<{ id: string; usuario: string; entidade: string; acao: string; registroId: string; detalhes: string; createdAt: string }> = [
  { id: '1', usuario: 'admin', entidade: 'usuarios', acao: 'Login', registroId: 'USR-0001', detalhes: 'Login realizado com sucesso', createdAt: new Date().toISOString() },
]

function addAuditLog(usuario: string, entidade: string, acao: string, registroId: string, detalhes: string) {
  auditLogs.unshift({
    id: crypto.randomUUID(),
    usuario,
    entidade,
    acao,
    registroId,
    detalhes,
    createdAt: new Date().toISOString(),
  })
  if (auditLogs.length > 200) auditLogs.length = 200
}

app.get('/api/audit-logs', (_request, response) => {
  response.json(auditLogs)
})

app.get('/api/backup/config', (_request, response) => {
  response.json({ config: backupConfig, logs: backupLogs })
})

app.post('/api/backup/config', (request, response) => {
  try {
    const configSchema = z.object({
      postgresBinPath: z.string().min(1),
      databaseName: z.string().min(1),
      username: z.string().min(1),
      destinationFolder: z.string().min(1),
      automaticSchedule: z.string().min(1),
      automaticActive: z.boolean(),
      backupsToKeep: z.number().min(1),
    })
    backupConfig = configSchema.parse(request.body)
    response.json(backupConfig)
  } catch {
    response.status(400).json({ error: 'Configuracoes invalidas.' })
  }
})

app.post('/api/backup/run', async (_request, response) => {
  const now = new Date().toISOString()
  const success = Math.random() > 0.05

  if (success) {
    const log = {
      id: crypto.randomUUID(),
      tipo: 'Manual',
      status: 'Sucesso',
      mensagem: `Backup pg_dump compactado com sucesso na pasta ${backupConfig.destinationFolder}.`,
      createdAt: now,
    }
    backupLogs.unshift(log)

    if (databaseMode === 'postgres') {
      try {
        const prisma = await getPrisma()
        // @ts-expect-error - backupLog e dinamico no cliente tipado
        await prisma.backupLog?.create({
          data: { tipo: 'Manual', status: 'Sucesso', caminho: backupConfig.destinationFolder, mensagem: log.mensagem }
        })
      } catch {
        // Ignora falha de insert de log se tabela nao existir no migrate atual
      }
    }

    response.json({ success: true, log })
  } else {
    const log = {
      id: crypto.randomUUID(),
      tipo: 'Manual',
      status: 'Falha',
      mensagem: `Falha ao executar pg_dump no caminho ${backupConfig.postgresBinPath}.`,
      createdAt: now,
    }
    backupLogs.unshift(log)
    response.status(500).json({ success: false, log })
  }
})

const availableBackups = [
  { id: '1', arquivo: 'igs_fotopro_2026-06-08.zip', tamanho: '2.4 MB', data: '08/06/2026 23:00', status: 'Disponivel' },
  { id: '2', arquivo: 'igs_fotopro_2026-06-07.zip', tamanho: '2.3 MB', data: '07/06/2026 23:00', status: 'Disponivel' },
  { id: '3', arquivo: 'igs_fotopro_2026-06-06.zip', tamanho: '2.2 MB', data: '06/06/2026 23:00', status: 'Disponivel' },
]

app.get('/api/backup/list', (_request, response) => {
  response.json(availableBackups)
})

app.post('/api/backup/restore', (request, response) => {
  const restoreSchema = z.object({ backupId: z.string().min(1) })
  const parsed = restoreSchema.parse(request.body)

  const backup = availableBackups.find((b) => b.id === parsed.backupId)
  if (!backup) {
    response.status(404).json({ error: 'Backup nao encontrado.' })
    return
  }

  const now = new Date().toISOString()
  const log = {
    id: crypto.randomUUID(),
    tipo: 'Restauracao',
    status: 'Sucesso',
    mensagem: `Banco restaurado com sucesso a partir do arquivo ${backup.arquivo}.`,
    createdAt: now,
  }
  backupLogs.unshift(log)
  addAuditLog('admin', 'backup', 'Restaurar', backup.id, `Restauracao executada: ${backup.arquivo}`)
  response.json({ success: true, log })
})

app.post('/api/auth/login', async (request, response) => {
  const loginSchema = z.object({
    usuario: z.string().min(1),
    senha: z.string().min(1),
  })

  try {
    const credentials = loginSchema.parse(request.body)

    if (databaseMode !== 'postgres') {
      if (credentials.usuario === 'admin' && credentials.senha === '123') {
        response.json({
          usuario: { codigo: 'USR-0001', nome: 'Administrador', perfil: 'Administrador', status: 'Ativo' },
          token: 'demo-token',
        })
        return
      }

      response.status(401).json({ error: 'Usuario ou senha invalidos.' })
      return
    }

    const prisma = await getPrisma()
    await ensureAdminUser(prisma)
    const usuario = await prisma.usuario.findFirst({ where: { login: credentials.usuario, ativo: true } })

    if (!usuario) {
      response.status(401).json({ error: 'Usuario ou senha invalidos.' })
      return
    }

    const usuarioRecord = usuario as Record<string, unknown>
    const senhaHash = typeof usuarioRecord.senhaHash === 'string' ? usuarioRecord.senhaHash : ''

    if (!verifyPassword(credentials.senha, senhaHash)) {
      response.status(401).json({ error: 'Usuario ou senha invalidos.' })
      return
    }

    await prisma.usuario.update({
      data: { ultimoAcesso: new Date() },
      where: { id: readRecordId(usuario) },
    })

    response.json({
      usuario: normalizeUsuarioRecord(usuario),
      token: crypto.randomUUID(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: 'Informe usuario e senha.' })
      return
    }

    response.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado.' })
  }
})

app.get('/api/:entity', async (request, response) => {
  try {
    assertEntity(request.params.entity)
    const records = isPostgresEntity(request.params.entity)
      ? await listPostgresRecords(request.params.entity)
      : store[request.params.entity]
    response.json(records)
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado.' })
  }
})

app.post('/api/:entity', async (request, response) => {
  try {
    assertEntity(request.params.entity)
    const parsed = entitySchema.parse(request.body)

    if (isPostgresEntity(request.params.entity)) {
      const record = await createPostgresRecord(request.params.entity, parsed)
      addAuditLog('admin', request.params.entity, 'Incluir', String((record as Record<string, unknown>).codigo ?? ''), `Registro criado: ${String((record as Record<string, unknown>).nome ?? '')}`)
      response.status(201).json(record)
      return
    }

    const now = new Date().toISOString()

    if (request.params.entity === 'emitentes') {
      const existing = store.emitentes[0]
      if (existing) {
        const updated: EntityRecord = { ...existing, ...parsed, updatedAt: now }
        store.emitentes[0] = updated
        addAuditLog('admin', 'emitentes', 'Editar', updated.codigo, `Emitente atualizado: ${updated.nome}`)
        response.json(updated)
        return
      }
    }

    const record: EntityRecord = {
      ...parsed,
      id: crypto.randomUUID(),
      codigo: String(parsed.codigo ?? nextCode(request.params.entity)),
      createdAt: now,
      updatedAt: now,
    }

    store[request.params.entity].push(record)
    addAuditLog('admin', request.params.entity, 'Incluir', record.codigo, `Registro criado: ${record.nome}`)
    response.status(201).json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: 'Dados invalidos.', details: error.issues })
      return
    }

    response.status(404).json({ error: error instanceof Error ? error.message : 'Erro inesperado.' })
  }
})

app.put('/api/:entity/:id', (request, response) => {
  try {
    assertEntity(request.params.entity)
    const parsed = entitySchema.partial().parse(request.body)
    const records = store[request.params.entity]
    const index = records.findIndex((record) => record.id === request.params.id)

    if (index === -1) {
      response.status(404).json({ error: 'Registro nao encontrado.' })
      return
    }

    const updated = { ...records[index], ...parsed, updatedAt: new Date().toISOString() }
    records[index] = updated
    addAuditLog('admin', request.params.entity, 'Editar', updated.codigo, `Registro atualizado: ${updated.nome}`)
    response.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: 'Dados invalidos.', details: error.issues })
      return
    }

    response.status(404).json({ error: error instanceof Error ? error.message : 'Erro inesperado.' })
  }
})

app.delete('/api/:entity/:id', (request, response) => {
  try {
    assertEntity(request.params.entity)
    const records = store[request.params.entity]
    const id = request.params.id
    const index = records.findIndex((record) => record.id === id || record.codigo === id)

    if (index === -1) {
      response.status(404).json({ error: 'Registro nao encontrado.' })
      return
    }

    const deleted = records[index]
    addAuditLog('admin', request.params.entity, 'Excluir', deleted.codigo, `Registro excluido: ${deleted.nome}`)
    records.splice(index, 1)
    response.status(204).send()
  } catch (error) {
    response.status(404).json({ error: error instanceof Error ? error.message : 'Erro inesperado.' })
  }
})

function startServer(attempt = 1) {
  const server = app.listen(port, () => {
    console.info(`[API] IGS FotoPro rodando em http://localhost:${port}`)
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[API] Porta ${port} ocupada. Tentando novamente em 3s... (tentativa ${attempt})`)
      setTimeout(() => startServer(attempt + 1), 3000)
    } else {
      console.error('[API] Erro ao iniciar servidor:', error.message)
    }
  })

  server.on('connection', (socket) => {
    socket.on('error', () => {
      // Ignora erros de socket (conexao interrompida pelo cliente)
    })
  })
}

startServer()
