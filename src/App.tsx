import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import {
  AlertTriangle,
  Aperture,
  BarChart3,
  CalendarDays,
  Camera,
  CircleDollarSign,
  Edit3,
  FileDown,
  FileText,
  Filter,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShoppingBag,

  Trash2,
  TrendingUp,
  Truck,
  User,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import logo from '../logo.jpeg'
import './App.css'

type ModuleKey =
  | 'dashboard'
  | 'eventos'
  | 'clientes'
  | 'contratos'
  | 'produtos'
  | 'profissionais'
  | 'fornecedores'
  | 'financeiro'
  | 'relatorios'
  | 'usuarios'
  | 'configuracoes'

type RecordItem = {
  codigo: string
  titulo: string
  subtitulo: string
  status: string
  valor: string
}

type FieldItem = {
  label: string
  placeholder: string
  wide?: boolean
  multiline?: boolean
  mask?: 'currency' | 'cpf-cnpj' | 'cpf' | 'cnpj' | 'phone' | 'date' | 'cep'
}

type ApiRecord = {
  codigo?: string
  nome?: string
  titulo?: string
  status?: string
  categoria?: string
  documento?: string
  telefone?: string
  whatsapp?: string
  formaPagamento?: string
  valorContratado?: number
  valorOriginal?: number
  valorPacote?: number
  [key: string]: string | number | boolean | undefined
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api'

const menu: Array<{ key: ModuleKey; label: string; group: string; icon: LucideIcon }> = [
  { key: 'dashboard', label: 'Dashboard', group: 'Operacao', icon: LayoutDashboard },
  { key: 'eventos', label: 'Agenda/Eventos', group: 'Operacao', icon: CalendarDays },
  { key: 'clientes', label: 'Clientes', group: 'Cadastros', icon: Users },
  { key: 'contratos', label: 'Contratos', group: 'Operacao', icon: FileText },
  { key: 'produtos', label: 'Produtos/Servicos', group: 'Cadastros', icon: Package },
  { key: 'profissionais', label: 'Profissionais', group: 'Cadastros', icon: Camera },
  { key: 'fornecedores', label: 'Fornecedores', group: 'Cadastros', icon: Truck },
  { key: 'usuarios', label: 'Usuarios', group: 'Cadastros', icon: User },
  { key: 'financeiro', label: 'Financeiro', group: 'Financeiro', icon: WalletCards },
  { key: 'relatorios', label: 'Relatorios', group: 'Gestao', icon: BarChart3 },
  { key: 'configuracoes', label: 'Configuracoes', group: 'Sistema', icon: Settings },
]

const entityByModule: Partial<Record<ModuleKey, string>> = {
  eventos: 'eventos',
  clientes: 'clientes',
  contratos: 'contratos',
  produtos: 'produtos-servicos',
  profissionais: 'profissionais',
  fornecedores: 'fornecedores',
  financeiro: 'contas-receber',
  configuracoes: 'emitentes',
  usuarios: 'usuarios',
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number') {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value)
}

function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function maskCpfCnpj(value: string, forceType?: 'fisica' | 'juridica'): string {
  const digits = value.replace(/\D/g, '')
  const isJuridica = forceType === 'juridica' || (forceType !== 'fisica' && digits.length > 11)
  if (!isJuridica) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14)
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15)
}

function maskDate(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .substring(0, 10)
}

function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9)
}

interface CnpjData {
  razao_social: string
  nome_fantasia: string
  cnpj: string
  tipo: string
  situacao: string
  descricao_situacao: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  telefone: string
  email: string
  atividade_principal: string
  natureza_juridica: string
}

interface CepData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  estado: string
  regiao: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

async function lookupCep(cep: string): Promise<CepData | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!response.ok) return null
    const data = await response.json()
    if (data.erro) return null
    return data as CepData
  } catch {
    return null
  }
}

async function lookupCnpj(cnpj: string): Promise<CnpjData | null> {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return null
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
    if (!response.ok) return null
    return (await response.json()) as CnpjData
  } catch {
    return null
  }
}

function apiRecordToDisplay(record: ApiRecord): RecordItem {
  const value = record.valorContratado ?? record.valorOriginal ?? record.valorPacote
  const subtitleParts = [record.categoria, record.documento, record.telefone ?? record.whatsapp, record.formaPagamento]
    .filter(Boolean)
    .join(' | ')

  return {
    codigo: String(record.codigo ?? 'API'),
    titulo: String(record.nome ?? record.titulo ?? 'Registro sem nome'),
    subtitulo: subtitleParts || 'Registro carregado pela API local',
    status: String(record.status ?? 'Ativo'),
    valor: formatCurrency(value),
  }
}

const moduleData: Record<ModuleKey, { title: string; description: string; tabs: string[]; records: RecordItem[] }> = {
  dashboard: {
    title: 'Dashboard executivo',
    description: 'Visao geral de contratos, agenda, parcelas, custos e lucro por evento.',
    tabs: ['Hoje', 'Semana', 'Mes', 'Ano'],
    records: [],
  },
  eventos: {
    title: 'Agenda e controle de eventos',
    description: 'Controle calendario, contratos, profissionais, checklist, despesas e resultado financeiro.',
    tabs: ['Dados do evento', 'Profissionais', 'Parcelas', 'Checklist', 'Contrato', 'Resultado'],
    records: [],
  },
  clientes: {
    title: 'Cadastro de clientes',
    description: 'Pessoa fisica, pessoa juridica, responsaveis, noivos, formandos, escolas e empresas.',
    tabs: ['Dados pessoais', 'Endereco', 'Formatura/Evento', 'Historico', 'Financeiro'],
    records: [],
  },
  contratos: {
    title: 'Contratos fotograficos',
    description: 'Modelos por tipo de evento, clausulas editaveis, assinatura e historico de PDFs.',
    tabs: ['Modelo', 'Dados', 'Parcelas', 'Clausulas', 'Assinatura'],
    records: [],
  },
  produtos: {
    title: 'Produtos, servicos e pacotes',
    description: 'Pacotes de casamento, formatura, ensaios, album, video, drone e hora adicional.',
    tabs: ['Cadastro', 'Itens inclusos', 'Precificacao', 'Parcelamento'],
    records: [],
  },
  profissionais: {
    title: 'Profissionais e freelancers',
    description: 'Fotografos, cinegrafistas, editores, assistentes, drone, vendedores e comissoes.',
    tabs: ['Cadastro', 'Agenda', 'Valores', 'Comissoes'],
    records: [],
  },
  fornecedores: {
    title: 'Fornecedores',
    description: 'Graficas, albuns, molduras, locacoes, transporte, parceiros e terceirizados.',
    tabs: ['Cadastro', 'Dados bancarios', 'Historico', 'Contas a pagar'],
    records: [],
  },
  financeiro: {
    title: 'Financeiro integrado',
    description: 'Livro caixa, contas a receber, contas a pagar, parcelas, despesas e lucro por evento.',
    tabs: ['Livro caixa', 'Receber', 'Pagar', 'Despesas por evento', 'Fluxo'],
    records: [],
  },
  relatorios: {
    title: 'Relatorios gerenciais',
    description: 'Filtros por periodo para eventos, clientes, fornecedores, profissionais e financeiro.',
    tabs: ['Eventos', 'Receitas', 'Despesas', 'Lucro', 'Profissionais'],
    records: [],
  },
  usuarios: {
    title: 'Cadastro de usuarios',
    description: 'Gerenciamento de usuarios do sistema, perfis de acesso e credenciais.',
    tabs: ['Dados do usuario'],
    records: [],
  },
  configuracoes: {
    title: 'Configuracoes do sistema',
    description: 'Emitente, permissoes por modulo, backup manual e automatico e logs de auditoria.',
    tabs: ['Emitente', 'Permissoes', 'Backup', 'Logs'],
    records: [
      { codigo: 'EMI-001', titulo: 'IGS FotoPro', subtitulo: 'Emitente principal ativo', status: 'Ativo', valor: 'CNPJ/CPF' },
    ],
  },
}

const stats: Array<{ label: string; value: string; trend: string; icon: LucideIcon }> = [
  { label: 'Eventos no mes', value: '18', trend: '+22%', icon: CalendarDays },
  { label: 'Receita prevista', value: 'R$ 74.680', trend: '+14%', icon: CircleDollarSign },
  { label: 'Em aberto', value: 'R$ 12.480', trend: '7 parcelas', icon: WalletCards },
  { label: 'Margem media', value: '41%', trend: '+6%', icon: BarChart3 },
]

const actionButtons = ['Novo', 'Salvar', 'Editar', 'Excluir', 'Pesquisar', 'Limpar', 'Imprimir', 'Exportar']

const actionIcons: Record<string, LucideIcon> = {
  Novo: Plus,
  Salvar: Save,
  Editar: Edit3,
  Excluir: Trash2,
  Pesquisar: Search,
  Limpar: RotateCcw,
  Imprimir: Printer,
  Exportar: FileDown,
}

const moduleFields: Record<ModuleKey, FieldItem[]> = {
  dashboard: [
    { label: 'Periodo inicial', placeholder: '01/06/2026', mask: 'date' },
    { label: 'Periodo final', placeholder: '30/06/2026', mask: 'date' },
    { label: 'Tipo de evento', placeholder: 'Todos os tipos' },
    { label: 'Status', placeholder: 'Todos os status' },
    { label: 'Observacoes do painel', placeholder: 'Indicadores atualizados automaticamente na versao com banco.', wide: true, multiline: true },
  ],
  eventos: [
    { label: 'Tipo de evento', placeholder: 'Casamento, formatura, aniversario, ensaio...' },
    { label: 'Titulo do evento', placeholder: 'Ex: Casamento Ana e Bruno' },
    { label: 'Cliente principal', placeholder: 'Nome do cliente vinculado' },
    { label: 'Data do evento', placeholder: '22/06/2026', mask: 'date' },
    { label: 'Hora inicio', placeholder: '18:00' },
    { label: 'Hora fim', placeholder: '23:30' },
    { label: 'Local do evento', placeholder: 'Nome do local' },
    { label: 'CEP', placeholder: '00000-000', mask: 'cep' },
    { label: 'Endereco completo', placeholder: 'Rua, numero, bairro, cidade - UF' },
    { label: 'Valor contratado', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Valor de entrada', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Quantidade de parcelas', placeholder: 'Ex: 10' },
    { label: 'Prazo de entrega', placeholder: 'Ex: 30 dias' },
    { label: 'Observacoes', placeholder: 'Informacoes adicionais do evento.', wide: true, multiline: true },
  ],
  clientes: [
    { label: 'Categoria', placeholder: 'Noivo(a), formando, escola, empresa...' },
    { label: 'Nome completo', placeholder: 'Nome do cliente' },
    { label: 'Nome fantasia / apelido', placeholder: 'Apelido ou nome fantasia' },
    { label: 'CPF/CNPJ', placeholder: '000.000.000-00 / 00.000.000/0000-00', mask: 'cpf-cnpj' },
    { label: 'RG / IE', placeholder: 'RG ou Inscricao Estadual' },
    { label: 'Data de nascimento', placeholder: '01/01/1990', mask: 'date' },
    { label: 'Telefone', placeholder: '(00) 00000-0000', mask: 'phone' },
    { label: 'WhatsApp', placeholder: '(00) 00000-0000', mask: 'phone' },
    { label: 'E-mail', placeholder: 'cliente@exemplo.com.br' },
    { label: 'Instagram', placeholder: '@cliente' },
    { label: 'CEP', placeholder: '00000-000', mask: 'cep' },
    { label: 'Endereco', placeholder: 'Rua, numero, bairro, cidade - UF' },
    { label: 'Profissao', placeholder: 'Profissao do cliente' },
    { label: 'Responsavel financeiro', placeholder: 'Nome do responsavel (se aplicavel)' },
    { label: 'CPF do responsavel', placeholder: '000.000.000-00', mask: 'cpf-cnpj' },
    { label: 'Curso / Turma', placeholder: 'Obrigatorio para formatura' },
    { label: 'Instituicao de ensino', placeholder: 'Escola ou faculdade' },
    { label: 'Ano / semestre conclusao', placeholder: '2026/1' },
    { label: 'Pacote contratado', placeholder: 'Nome do pacote para formatura' },
    { label: 'Valor do pacote', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Quantidade de parcelas', placeholder: 'Ex: 20' },
    { label: 'Observacoes', placeholder: 'Historico, preferencias, observacoes gerais.', wide: true, multiline: true },
  ],
  contratos: [
    { label: 'Modelo de contrato', placeholder: 'Casamento, formatura, ensaio, evento corporativo...' },
    { label: 'Cliente', placeholder: 'Nome do cliente' },
    { label: 'Evento vinculado', placeholder: 'EVT-0001' },
    { label: 'Valor contratado', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Valor de entrada', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Quantidade de parcelas', placeholder: 'Ex: 10' },
    { label: 'Prazo de entrega', placeholder: 'Ex: 30 dias' },
    { label: 'Status de assinatura', placeholder: 'Pendente, assinado, cancelado' },
    { label: 'Clausulas editaveis', placeholder: 'Prazo de entrega, autorizacao de imagem, cancelamento e multa.', wide: true, multiline: true },
  ],
  produtos: [
    { label: 'Tipo', placeholder: 'Produto, servico ou pacote' },
    { label: 'Categoria', placeholder: 'Casamento, formatura, album, video, drone...' },
    { label: 'Descricao', placeholder: 'Nome do produto, servico ou pacote' },
    { label: 'Unidade', placeholder: 'Un, hora, diaria, pacote' },
    { label: 'Custo unitario', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Preco de venda', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Comissao padrao', placeholder: 'Ex: 5%' },
    { label: 'Duracao estimada', placeholder: 'Ex: 4 horas' },
    { label: 'Fotos inclusas', placeholder: 'Quantidade de fotos' },
    { label: 'Videos inclusos', placeholder: 'Quantidade de videos' },
    { label: 'Parcelamento maximo', placeholder: 'Quantidade maxima de parcelas' },
    { label: 'Itens inclusos (pacote)', placeholder: 'Fotos, videos, album, galeria, horas e profissionais.', wide: true, multiline: true },
  ],
  profissionais: [
    { label: 'Nome completo', placeholder: 'Nome do profissional' },
    { label: 'Apelido / nome profissional', placeholder: 'Nome artistico ou apelido' },
    { label: 'Tipo', placeholder: 'Fotografo, editor, drone, cinegrafista...' },
    { label: 'Especialidade', placeholder: 'Casamento, formatura, ensaio...' },
    { label: 'CPF/CNPJ', placeholder: '000.000.000-00', mask: 'cpf-cnpj' },
    { label: 'RG / IE', placeholder: 'Documento complementar' },
    { label: 'Telefone', placeholder: '(00) 00000-0000', mask: 'phone' },
    { label: 'WhatsApp', placeholder: '(00) 00000-0000', mask: 'phone' },
    { label: 'E-mail', placeholder: 'profissional@exemplo.com' },
    { label: 'Valor da diaria', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Valor por hora', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Comissao (%)', placeholder: 'Ex: 5' },
    { label: 'Forma de pagamento', placeholder: 'PIX, transferencia, dinheiro' },
    { label: 'Chave PIX', placeholder: 'Chave PIX do profissional' },
    { label: 'Banco / agencia / conta', placeholder: 'Dados bancarios' },
    { label: 'Disponibilidade', placeholder: 'Dias e horarios disponiveis' },
    { label: 'Observacoes', placeholder: 'Informacoes adicionais.', wide: true, multiline: true },
  ],
  fornecedores: [
    { label: 'Categoria', placeholder: 'Grafica, album, locacao, transporte, editor...' },
    { label: 'Razao social / Nome', placeholder: 'Fornecedor ou parceiro' },
    { label: 'Nome fantasia', placeholder: 'Nome fantasia do fornecedor' },
    { label: 'CPF/CNPJ', placeholder: '00.000.000/0000-00', mask: 'cpf-cnpj' },
    { label: 'IE / RG', placeholder: 'Documento complementar' },
    { label: 'Telefone', placeholder: '(00) 0000-0000', mask: 'phone' },
    { label: 'WhatsApp', placeholder: '(00) 00000-0000', mask: 'phone' },
    { label: 'E-mail', placeholder: 'fornecedor@exemplo.com' },
    { label: 'CEP', placeholder: '00000-000', mask: 'cep' },
    { label: 'Endereco', placeholder: 'Rua, numero, bairro, cidade - UF' },
    { label: 'Banco', placeholder: 'Nome do banco' },
    { label: 'Agencia', placeholder: 'Numero da agencia' },
    { label: 'Conta', placeholder: 'Numero da conta' },
    { label: 'Chave PIX', placeholder: 'Chave PIX' },
    { label: 'Condicao de pagamento', placeholder: 'A vista, 15 dias, 30 dias, parcelado' },
    { label: 'Observacoes', placeholder: 'Historico financeiro e observacoes gerais.', wide: true, multiline: true },
  ],
  financeiro: [
    { label: 'Tipo de lancamento', placeholder: 'Entrada, saida, conta a receber, conta a pagar' },
    { label: 'Data de emissao', placeholder: '08/06/2026', mask: 'date' },
    { label: 'Data de vencimento', placeholder: '15/06/2026', mask: 'date' },
    { label: 'Cliente ou fornecedor', placeholder: 'Vincular ao cadastro correspondente' },
    { label: 'Evento vinculado', placeholder: 'EVT-1042' },
    { label: 'Contrato vinculado', placeholder: 'CTR-501' },
    { label: 'Valor original', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Juros', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Desconto', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Forma de pagamento', placeholder: 'PIX, dinheiro, cartao, boleto' },
    { label: 'Status', placeholder: 'Aberto, pago, vencido, cancelado, parcial' },
    { label: 'Observacoes', placeholder: 'Baixa parcial, anexo, estorno, lancamento no caixa.', wide: true, multiline: true },
  ],
  relatorios: [
    { label: 'Data inicial', placeholder: '01/06/2026', mask: 'date' },
    { label: 'Data final', placeholder: '30/06/2026', mask: 'date' },
    { label: 'Tipo de relatorio', placeholder: 'Eventos, receitas, despesas, lucro, profissionais' },
    { label: 'Forma de pagamento', placeholder: 'PIX, dinheiro, cartao, boleto...' },
    { label: 'Status', placeholder: 'Todos os status' },
    { label: 'Totalizadores', placeholder: 'Rodape com totais, margem, pendencias e graficos.', wide: true, multiline: true },
  ],
  usuarios: [
    { label: 'Nome completo', placeholder: 'Nome completo do usuario' },
    { label: 'Login', placeholder: 'Nome de usuario para acesso' },
    { label: 'E-mail', placeholder: 'usuario@exemplo.com.br' },
    { label: 'Telefone', placeholder: '(00) 00000-0000', mask: 'phone' },
    { label: 'Perfil', placeholder: 'Administrador, Gerente, Consulta...' },
    { label: 'Senha', placeholder: 'Minimo 6 caracteres' },
    { label: 'Confirmar senha', placeholder: 'Repita a senha' },
    { label: 'Status', placeholder: 'Ativo ou Inativo' },
    { label: 'Observacoes', placeholder: 'Informacoes adicionais sobre o usuario.', wide: true, multiline: true },
  ],
  configuracoes: [
    { label: 'Razao social', placeholder: 'Razao social da empresa' },
    { label: 'Nome fantasia', placeholder: 'Nome fantasia' },
    { label: 'CNPJ / CPF', placeholder: '00.000.000/0000-00', mask: 'cnpj' },
    { label: 'Inscricao Estadual', placeholder: 'IE da empresa' },
    { label: 'Inscricao Municipal', placeholder: 'IM da empresa' },
    { label: 'Telefone', placeholder: '(00) 0000-0000', mask: 'phone' },
    { label: 'WhatsApp', placeholder: '(00) 00000-0000', mask: 'phone' },
    { label: 'E-mail', placeholder: 'contato@igsfotopro.com.br' },
    { label: 'Site', placeholder: 'www.igsfotopro.com.br' },
    { label: 'Instagram', placeholder: '@igsfotopro' },
    { label: 'CEP', placeholder: '00000-000', mask: 'cep' },
    { label: 'Endereco', placeholder: 'Rua, numero, bairro, cidade - UF' },
    { label: 'Responsavel legal', placeholder: 'Nome do responsavel' },
    { label: 'CPF do responsavel', placeholder: '000.000.000-00', mask: 'cpf-cnpj' },
    { label: 'E-mail financeiro', placeholder: 'financeiro@igsfotopro.com.br' },
    { label: 'Observacoes', placeholder: 'Informacoes adicionais sobre o emitente.', wide: true, multiline: true },
  ],
}

const financeTabFields: Record<number, FieldItem[]> = {
  0: [
    { label: 'Tipo', placeholder: 'Entrada / Saida' },
    { label: 'Categoria', placeholder: 'Recebimento, pagamento, sangria, reforco...' },
    { label: 'Descricao', placeholder: 'Descricao do lancamento' },
    { label: 'Valor', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Forma de pagamento', placeholder: 'PIX, dinheiro, cartao, boleto' },
    { label: 'Data', placeholder: 'dd/mm/aaaa', mask: 'date' },
    { label: 'Hora', placeholder: 'HH:MM' },
    { label: 'Cliente', placeholder: 'Nome do cliente (se aplicavel)' },
    { label: 'Fornecedor', placeholder: 'Nome do fornecedor (se aplicavel)' },
    { label: 'Evento vinculado', placeholder: 'Codigo do evento' },
    { label: 'Contrato vinculado', placeholder: 'Codigo do contrato' },
    { label: 'Observacoes', placeholder: 'Informacoes adicionais.', wide: true, multiline: true },
  ],
  1: [
    { label: 'Cliente', placeholder: 'Nome do cliente' },
    { label: 'Evento vinculado', placeholder: 'Codigo do evento' },
    { label: 'Contrato vinculado', placeholder: 'Codigo do contrato' },
    { label: 'Numero da parcela', placeholder: 'Ex: 1' },
    { label: 'Total de parcelas', placeholder: 'Ex: 10' },
    { label: 'Data de emissao', placeholder: 'dd/mm/aaaa', mask: 'date' },
    { label: 'Data de vencimento', placeholder: 'dd/mm/aaaa', mask: 'date' },
    { label: 'Valor original', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Juros', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Multa', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Desconto', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Valor recebido', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Forma de pagamento', placeholder: 'PIX, dinheiro, cartao, boleto' },
    { label: 'Status', placeholder: 'Aberto / Recebido / Vencido / Parcial / Cancelado' },
    { label: 'Observacoes', placeholder: 'Informacoes adicionais.', wide: true, multiline: true },
  ],
  2: [
    { label: 'Fornecedor', placeholder: 'Nome do fornecedor' },
    { label: 'Profissional', placeholder: 'Nome do profissional/freelancer' },
    { label: 'Categoria', placeholder: 'Impressao, deslocamento, alimentacao, locacao...' },
    { label: 'Descricao', placeholder: 'Descricao da despesa' },
    { label: 'Data de emissao', placeholder: 'dd/mm/aaaa', mask: 'date' },
    { label: 'Data de vencimento', placeholder: 'dd/mm/aaaa', mask: 'date' },
    { label: 'Valor original', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Juros', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Desconto', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Valor pago', placeholder: 'R$ 0,00', mask: 'currency' },
    { label: 'Forma de pagamento', placeholder: 'PIX, dinheiro, cartao, boleto' },
    { label: 'Evento vinculado', placeholder: 'Codigo do evento' },
    { label: 'Status', placeholder: 'Aberto / Pago / Vencido / Cancelado / Parcial' },
    { label: 'Observacoes', placeholder: 'Informacoes adicionais.', wide: true, multiline: true },
  ],
}

const financeEntities = ['livro-caixa', 'contas-receber', 'contas-pagar']

const dashboardPanels = [
  'Agenda de hoje',
  'Proximos eventos',
  'Contratos aguardando assinatura',
  'Parcelas vencidas',
  'Contas a pagar vencidas',
  'Eventos em edicao',
]

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro capturado:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="login-page">
          <section className="login-hero">
            <div className="login-logo-card">
              <img src={logo} alt="Logo do estudio fotografico" />
            </div>
            <span className="eyebrow">IGS FotoPro</span>
            <h1>Erro inesperado</h1>
            <p style={{ color: '#a24822', fontSize: '0.85rem', marginTop: '12px', maxWidth: '400px' }}>
              {this.state.error}
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('igs_logged_in')
                window.location.reload()
              }}
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #d8ad45, #9a7627)',
                color: '#fff',
                border: 0,
                borderRadius: '14px',
                padding: '12px 24px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Recarregar sistema
            </button>
        </section>
        </main>
      )
    }
    return this.props.children
  }
}

function App() {
  const [active, setActive] = useState<ModuleKey>('dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('igs_logged_in') === 'true')
  const [apiRecords, setApiRecords] = useState<RecordItem[]>([])
  const [rawApiRecords, setRawApiRecords] = useState<ApiRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [apiStatus, setApiStatus] = useState<'demo' | 'online' | 'offline'>('demo')
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loginForm, setLoginForm] = useState({ senha: '123', usuario: 'admin' })
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'error' | 'offline-demo'>('idle')

  // Estados extras de Modelos de Contrato, Formatura e Backup
  const [contractTemplateName, setContractTemplateName] = useState('Contrato de Prestacao de Servicos Fotograficos')
  const [contractText, setContractText] = useState(
    `CONTRATO DE PRESTACAO DE SERVICOS FOTOGRAFICOS\n\n` +
      `Pelo presente instrumento particular de contrato, de um lado, doravante denominado CONTRATANTE, ` +
      `{cliente_nome}, inscrito(a) no CPF/CNPJ sob o n. {cliente_cpf_cnpj}, residente e domiciliado(a) em {cliente_endereco}, ` +
      `celular: {cliente_telefone}, e de outro lado, {emitente_razao}, inscrito(a) no CNPJ sob o n. {emitente_cnpj}, ` +
      `com sede em {emitente_endereco}, fone: {emitente_telefone}, email: {emitente_email}, ` +
      `doravante denominado CONTRATADO, tem entre si, justo e contratado o que segue:\n\n` +
      `CLAUSSULA 1 - OBJETO\n\n` +
      `O CONTRATADO prestarara ao CONTRATANTE servico de cobertura fotografica do evento {evento_nome}, ` +
      `do tipo {evento_tipo}, que se realizara no dia {evento_data}, as {evento_hora}, ` +
      `em {evento_local}. Os servicos e produtos objetos deste contrato sao:\n\n` +
      `a. Cobertura fotografica do evento\n` +
      `b. {pacote_nome}\n` +
      `c. Entrega de material conforme definido neste contrato\n\n` +
      `CLAUSSULA 1.1 - Limite de tempo e numero de fotos\n\n` +
      `O CONTRATADO nao estipula limite de tempo para permanecer no local do evento e nem o numero de fotos ` +
      `a serem realizadas, entretanto, cabe ao CONTRATADO a decisao de julgar se o material registrado esta completo.\n\n` +
      `CLAUSSULA 2 - EXCLUSIVIDADE\n\n` +
      `A equipe {emitente_razao} sera a UNICA EQUIPE de fotografos no evento. A cobertura fotografica ` +
      `simultanea do evento por outro fotografo profissional implicara em cancelamento imediato de contrato ` +
      `e termino da cobertura fotografica.\n\n` +
      `CLAUSSULA 3 - PAGAMENTO\n\n` +
      `Os produtos e servicos deste contrato tem o valor de {valor_total}, pagos da seguinte forma:\n\n` +
      `Entrada: {valor_entrada}\n` +
      `Saldo: {valor_saldo} em {quantidade_parcelas} parcelas de {valor_parcela}\n\n` +
      `CLAUSSULA 4 - PRECOS\n\n` +
      `As ampliacoes avulsas e acessorios possuem os seguintes valores unitarios:\n\n` +
      `a. Album premium - R$ 450,00\n` +
      `b. DVD em alta resolucao - R$ 120,00\n` +
      `c. Moldura panoramica - R$ 180,00\n\n` +
      `Valores validos ate 90 dias apos a data da execucao.\n\n` +
      `CLAUSSULA 5 - PROVAS E SELECAO DE FOTOS\n\n` +
      `As provas das fotos estao disponiveis no site {emitente_website} com acesso exclusivo mediante senha ` +
      `eletronica para o CONTRATANTE em ate {prazo_provas} dias apos a data do evento. Caso necessario, ` +
      `o CONTRATANTE tem direito a uma sessao para escolha de fotos pessoalmente com auxilio da equipe ` +
      `{emitente_razao}. As fotos permanecerao disponiveis online por um prazo de {prazo_online} dias apos ` +
      `a data do evento. Apos este periodo, as provas so poderao ser vistas e escolhidas pessoalmente.\n\n` +
      `CLAUSSULA 6 - Entrega do material\n\n` +
      `O prazo para confeccao e de {prazo_entrega} dias, contados a partir da data da aprovacao final do layout. ` +
      `A entrega se dara apos o pagamento do saldo de 50% do eventual valor adicional. O CONTRATANTE sera ` +
      `responsavel pela retirada do material no local acordado entre as partes, ou por suas despesas de envio via SEDEX.\n\n` +
      `CLAUSSULA 7 - ATRASO NA ENTREGA\n\n` +
      `Em caso de atraso na entrega do material ao cliente, o CONTRATADO pagara uma multa de 2% ao mes ao ` +
      `CONTRATANTE referente ao periodo atrasado equivalente ao valor deste contrato.\n\n` +
      `CLAUSSULA 8 - PROPRIEDADE E USO DE IMAGEM\n\n` +
      `As imagens do evento sao de propriedade exclusiva do CONTRATADO, ficando proibida a reproducao ` +
      `nao autorizada de imagens, por copia digital ou outro meio para fins comerciais ou para outros ` +
      `fornecedores, sem aviso previo do CONTRATADO, sob multa de 25% do valor estipulado na clausula 3 ` +
      `deste contrato.\n\n` +
      `CLAUSSULA 8.1 - O CONTRATANTE nao se opoe quanto ao uso das imagens dos arquivos digitais pelo ` +
      `CONTRATADO e sua equipe para uso exclusivamente comercial e promocional, sendo usado como material ` +
      `impresso (portfolio), ou o uso em tablets como forma de divulgacao para outros CONTRATANTES, ` +
      `podendo ser usados inclusive no website, em midias sociais para divulgacao, amostras, exposicoes, ` +
      `concursos e publicacoes.\n\n` +
      `CLAUSSULA 9 - INADIMPLENCIA\n\n` +
      `Em caso de falta de pagamento de parcelas restantes, como da propria inadimplencia do CONTRATANTE, ` +
      `fica o CONTRATADO, desde ja autorizado e com poderes outorgados pelo CONTRATANTE a emitir nota ` +
      `promissoria e/ou titulo de credito avista contra o CONTRATANTE.\n\n` +
      `CLAUSSULA 10 - LIMITE DE RESPONSABILIDADE\n\n` +
      `Todo esforco sera feito para execucao dos servicos e entrega dos produtos deste contrato. A ` +
      `responsabilidade do CONTRATADO e limitada ao valor pago pelo CONTRATANTE. Por se tratar de um ` +
      `evento nao controlado, podendo, a qualquer momento, ocorrer atos naturais e humanos alheios a ` +
      `vontade das partes, nao se pode garantir a entrega de qualquer imagem especifica.\n\n` +
      `CLAUSSULA 10.1 - Em caso de nao comparecimento de nenhum profissional no evento realizado pelo ` +
      `CONTRATANTE, o CONTRATADO devera ressarcir ao CONTRATANTE o valor que consta na clausula 3 deste contrato.\n\n` +
      `CLAUSSULA 11 - EQUIPE FOTOGRAFICA\n\n` +
      `Em caso de problemas de ordem naturais ou humanos com um ou mais membros da equipe principal, o ` +
      `CONTRATADA reserva-se ao direito de enviar outro profissional qualificado de mesmo valor ` +
      `profissional/financeiro ou superior, ao evento para que o servico contratado seja executado, ` +
      `sem nenhum custo adicional por parte do CONTRATANTE.\n\n` +
      `CLAUSSULA 12 - ALIMENTACAO E CUIDADOS COM A EQUIPE\n\n` +
      `E de responsabilidade do CONTRATANTE fornecer alimentacao (a mesma oferecida aos convidados) e ` +
      `bebida (nao alcoolica) a toda a equipe CONTRATADA durante o almoco ou jantar do evento no mesmo ` +
      `horario que os noivos, disponibilizando lugar, tempo e condicoes adequadas para que os mesmos ` +
      `possam dar continuidade ao trabalho.\n\n` +
      `CLAUSSULA 13 - CASO FORTUITO E FORCA MAIOR\n\n` +
      `Os casos fortuitos e de forca maior serao excludentes de responsabilidade na forma do Paragrafo ` +
      `Unico do artigo 393 do Codigo Civil Brasileiro.\n\n` +
      `CLAUSSULA 13.1 - A Parte que for afetada por caso fortuito ou forca maior devera notificar a outra, ` +
      `de imediato, da extensao do fato e do prazo estimado durante o qual estara inabilitada a cumprir ` +
      `ou pelo qual sera obrigatoria a atrasar o cumprimento de suas obrigacoes decorrentes deste Contrato.\n\n` +
      `CLAUSSULA 14 - CANCELAMENTO OU RESCISAO\n\n` +
      `O presente ajuste e feito em carater irrevogavel e irretratavel, ficando estabelecido que no caso ` +
      `do CONTRATANTE ou do CONTRATADO necessitar o cancelamento ou rescisao do presente por motivos ` +
      `alheios a sua vontade, incorrera nas seguintes penalidades:\n\n` +
      `a. Multa de {multa_120} sobre o valor do ajuste devidamente atualizado, se houver comunicado por ` +
      `escrito a CONTRATADA, com antecedencia de 120 dias da data do evento.\n\n` +
      `b. Multa de {multa_90} sobre o valor do ajuste devidamente atualizado se houver comunicado a ` +
      `CONTRATADA, com antecedencia inferior a 90 dias da data do evento.\n\n` +
      `CLAUSSULA 15 - FORO\n\n` +
      `Fica eleito o foro da comarca de {emitente_cidade}, com exclusao de qualquer outro, por mais ` +
      `privilegiado que seja para dirimir eventuais duvidas porventura oriundas deste contrato.\n\n` +
      `E por estarem justos e contratados, firmam o presente instrumento em duas vias de igual teor e forma. ` +
      `{emitente_cidade}, {data_contrato}.\n\n\n` +
      `________________________________________\n` +
      `{cliente_nome}\n` +
      `CONTRATANTE\n\n\n` +
      `________________________________________\n` +
      `{emitente_razao}\n` +
      `CONTRATADO`
  )
  const [previewContractActive, setPreviewContractActive] = useState(false)

  const [gradStudentName, setGradStudentName] = useState('Gabriel Souza Martins')
  const [gradPkgPrice, setGradPkgPrice] = useState(1790)
  const [gradInstallmentsNum, setGradInstallmentsNum] = useState(20)
  const [gradGeneratedInstallments, setGradGeneratedInstallments] = useState<Array<{ parcela: number; vencimento: string; valor: string }>>([])

  const [pgConfig, setPgConfig] = useState({
    postgresBinPath: 'C:\\Program Files\\PostgreSQL\\16\\bin',
    databaseName: 'igs_fotopro',
    username: 'postgres',
    destinationFolder: 'C:\\Backups\\igs_fotopro',
    automaticSchedule: '23:00',
    automaticActive: true,
    backupsToKeep: 5,
  })
  const [pgLogs, setPgLogs] = useState<Array<{ id: string; tipo: string; status: string; mensagem: string; createdAt: string }>>([
    { id: '1', tipo: 'Automatico', status: 'Sucesso', mensagem: 'Backup compactado com sucesso em ZIP.', createdAt: '08/06/2026 23:00' },
  ])
  const [pgIsRunningBackup, setPgIsRunningBackup] = useState(false)
  const [pgBackupFeedback, setPgBackupFeedback] = useState('')

  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; usuario: string; entidade: string; acao: string; registroId: string; detalhes: string; createdAt: string }>>([
    { id: '1', usuario: 'admin', entidade: 'usuarios', acao: 'Login', registroId: 'USR-0001', detalhes: 'Login realizado com sucesso', createdAt: new Date().toISOString() },
  ])

  const [availableBackups, setAvailableBackups] = useState<Array<{ id: string; arquivo: string; tamanho: string; data: string; status: string }>>([
    { id: '1', arquivo: 'igs_fotopro_2026-06-08.zip', tamanho: '2.4 MB', data: '08/06/2026 23:00', status: 'Disponivel' },
    { id: '2', arquivo: 'igs_fotopro_2026-06-07.zip', tamanho: '2.3 MB', data: '07/06/2026 23:00', status: 'Disponivel' },
    { id: '3', arquivo: 'igs_fotopro_2026-06-06.zip', tamanho: '2.2 MB', data: '06/06/2026 23:00', status: 'Disponivel' },
  ])

  const defaultPermissions: Record<string, { visualizar: boolean; incluir: boolean; editar: boolean; excluir: boolean }> = {
    dashboard: { visualizar: true, incluir: true, editar: true, excluir: true },
    clientes: { visualizar: true, incluir: true, editar: true, excluir: true },
    eventos: { visualizar: true, incluir: true, editar: true, excluir: true },
    contratos: { visualizar: true, incluir: true, editar: true, excluir: true },
    produtos: { visualizar: true, incluir: true, editar: true, excluir: true },
    profissionais: { visualizar: true, incluir: true, editar: true, excluir: true },
    fornecedores: { visualizar: true, incluir: true, editar: true, excluir: true },
    financeiro: { visualizar: true, incluir: true, editar: true, excluir: true },
    relatorios: { visualizar: true, incluir: true, editar: true, excluir: true },
    configuracoes: { visualizar: true, incluir: true, editar: true, excluir: true },
  }

  const [userPermissions, setUserPermissions] = useState(defaultPermissions)

  function togglePermission(module: string, action: keyof typeof defaultPermissions[string]) {
    setUserPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action],
      },
    }))
  }

  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Record<string, number>>({})
  const [clientPersonType, setClientPersonType] = useState<'fisica' | 'juridica'>('fisica')
  const [cnpjLookupStatus, setCnpjLookupStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle')
  const [cepLookupStatus, setCepLookupStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle')

  async function handleCnpjLookup(cnpjValue: string) {
    const digits = cnpjValue.replace(/\D/g, '')
    if (digits.length !== 14) return
    setCnpjLookupStatus('loading')
    const data = await lookupCnpj(digits)
    if (data) {
      setFormValues((prev) => ({
        ...prev,
        'Nome/Razao social': data.razao_social || prev['Nome/Razao social'],
        'Telefone/WhatsApp': data.telefone ? `(${data.telefone.slice(0,2)}) ${data.telefone.slice(2)}` : prev['Telefone/WhatsApp'],
        'E-mail': data.email || prev['E-mail'],
        'Endereco': `${data.logradouro || ''}, ${data.numero || ''} - ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}`.replace(/^, |^- |, $/g, '') || prev['Endereco'],
      }))
      setCnpjLookupStatus('found')
    } else {
      setCnpjLookupStatus('error')
    }
  }

  async function handleCepLookup(cepValue: string) {
    const digits = cepValue.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLookupStatus('loading')
    const data = await lookupCep(digits)
    if (data) {
      setFormValues((prev) => ({
        ...prev,
        'Endereco': `${data.logradouro || ''}, ${data.bairro || ''} - ${data.localidade || ''} - ${data.uf || ''}`.replace(/^, |^- /, '').trim() || prev['Endereco'],
        'Endereco completo': `${data.logradouro || ''}, ${data.bairro || ''} - ${data.localidade || ''} - ${data.uf || ''}`.replace(/^, |^- /, '').trim() || prev['Endereco completo'],
      }))
      setCepLookupStatus('found')
    } else {
      setCepLookupStatus('error')
    }
  }

  const current = moduleData[active]
  const financeTab = (activeTab['financeiro-tab'] ?? 0)
  const fields = active === 'financeiro'
    ? (financeTabFields[financeTab] ?? moduleFields[active])
    : moduleFields[active]
  const ActiveIcon = menu.find((item) => item.key === active)?.icon ?? Aperture
  const activeEntity = active === 'financeiro'
    ? financeEntities[(activeTab['financeiro-tab'] ?? 0)] ?? undefined
    : entityByModule[active]
  function filterRecords(records: RecordItem[]) {
    if (!searchQuery) return records
    const q = searchQuery.toLowerCase()
    return records.filter(r =>
      r.codigo.toLowerCase().includes(q) ||
      r.titulo.toLowerCase().includes(q) ||
      r.subtitulo.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.valor.toLowerCase().includes(q)
    )
  }
  const baseRecords = activeEntity && apiStatus === 'online' && apiRecords.length > 0 ? apiRecords : current.records
  const displayRecords = filterRecords(baseRecords)
  const groupedMenu = menu.reduce<Record<string, typeof menu>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item]
    return groups
  }, {})

  function updateFormValue(field: string, value: string) {
    setFormValues((currentValues) => ({ ...currentValues, [field]: value }))
    setSaveStatus('idle')
  }

  function buildPayload() {
    const nameField = fields.find((field) => /nome|titulo|descricao|razao/i.test(field.label))
    const fallbackField = fields[0]
    const selectedName = nameField ? formValues[nameField.label] : undefined
    const fallbackName = fallbackField ? formValues[fallbackField.label] : undefined

    return {
      ...formValues,
      nome: selectedName || fallbackName || `${current.title} sem nome`,
      status: formValues['Status'] || 'Ativo',
    }
  }

  async function saveCurrentRecord() {
    if (!activeEntity || isLoadingRecords || saveStatus === 'saving') {
      return
    }

    if (active === 'usuarios' && formValues['Senha'] !== formValues['Confirmar senha']) {
      setSaveStatus('error')
      return
    }

    setSaveStatus('saving')

    try {
      const response = await fetch(`${apiBaseUrl}/${activeEntity}`, {
        body: JSON.stringify(buildPayload()),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar registro')
      }

      setFormValues({})
      setSaveStatus('saved')
      setRefreshKey((key) => key + 1)
    } catch {
      setSaveStatus('error')
      setApiStatus((prev) => (prev === 'online' ? 'offline' : prev))
    }
  }

  async function login() {
    setLoginStatus('loading')

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        body: JSON.stringify(loginForm),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Login invalido')
      }

      localStorage.setItem('igs_logged_in', 'true')
      setIsLoggedIn(true)
      setLoginStatus('idle')
    } catch {
      if (loginForm.usuario === 'admin' && loginForm.senha === '123') {
        setLoginStatus('offline-demo')
        localStorage.setItem('igs_logged_in', 'true')
        setIsLoggedIn(true)
        return
      }

      setLoginStatus('error')
    }
  }

  function logout() {
    localStorage.removeItem('igs_logged_in')
    setIsLoggedIn(false)
  }

  function generateGradInstallments() {
    const parcelas: Array<{ parcela: number; vencimento: string; valor: string }> = []
    const valorParcela = gradPkgPrice / gradInstallmentsNum
    const baseDate = new Date()

    for (let i = 0; i < gradInstallmentsNum; i++) {
      const venc = new Date(baseDate)
      venc.setMonth(venc.getMonth() + i)
      parcelas.push({
        parcela: i + 1,
        vencimento: venc.toLocaleDateString('pt-BR'),
        valor: formatCurrency(valorParcela),
      })
    }

    setGradGeneratedInstallments(parcelas)
  }

  function replaceContractVars(): string {
    const variables: Record<string, string> = {
      '{emitente_razao}': formValues['Razao social'] || formValues['Nome fantasia'] || 'IGS FotoPro',
      '{emitente_cnpj}': formValues['CNPJ / CPF'] || '00.000.000/0001-00',
      '{emitente_endereco}': formValues['Endereco'] || 'Rua Exemplo, 123 - Centro',
      '{emitente_telefone}': formValues['Telefone'] || '(00) 00000-0000',
      '{emitente_email}': formValues['E-mail'] || 'contato@igsfotopro.com.br',
      '{emitente_website}': formValues['Site'] || 'www.igsfotopro.com.br',
      '{emitente_cidade}': (formValues['Endereco'] || 'Sao Paulo').split(',').pop()?.trim() || 'Sao Paulo',
      '{cliente_nome}': formValues['Nome completo'] || formValues['Nome/Razao social'] || formValues['Razao social / Nome'] || 'Cliente nao informado',
      '{cliente_cpf_cnpj}': formValues['CPF/CNPJ'] || '000.000.000-00',
      '{cliente_endereco}': formValues['Endereco'] || 'Rua do Cliente, 456',
      '{cliente_telefone}': formValues['WhatsApp'] || formValues['Telefone'] || '(00) 00000-0000',
      '{evento_nome}': formValues['Titulo do evento'] || formValues['Titulo'] || 'Evento nao informado',
      '{evento_tipo}': formValues['Tipo de evento'] || 'Casamento',
      '{evento_data}': formValues['Data do evento'] || formValues['Data e horario'] || '22/06/2026',
      '{evento_hora}': formValues['Hora inicio'] || formValues['Horario'] || '18:00',
      '{evento_local}': formValues['Local do evento'] || 'Local nao informado',
      '{pacote_nome}': contractTemplateName,
      '{valor_total}': formValues['Valor contratado'] || 'R$ 0,00',
      '{valor_entrada}': formValues['Valor de entrada'] || formValues['Valor entrada'] || 'R$ 2.500,00',
      '{valor_saldo}': formValues['Valor saldo'] || 'R$ 6.400,00',
      '{quantidade_parcelas}': formValues['Quantidade de parcelas'] || formValues['Parcelas'] || '10',
      '{valor_parcela}': formValues['Valor parcela'] || 'R$ 640,00',
      '{prazo_provas}': '30',
      '{prazo_online}': '90',
      '{prazo_entrega}': formValues['Prazo entrega'] || '30',
      '{multa_120}': '30%',
      '{multa_90}': '50%',
      '{data_contrato}': new Date().toLocaleDateString('pt-BR'),
    }

    let result = contractText
    for (const [variable, value] of Object.entries(variables)) {
      result = result.replaceAll(variable, value)
    }
    return result
  }

  async function triggerBackup() {
    setPgIsRunningBackup(true)
    setPgBackupFeedback('')

    try {
      const [configResponse, runResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/backup/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pgConfig),
        }),
        fetch(`${apiBaseUrl}/backup/run`, { method: 'POST' }),
      ])

      if (configResponse.ok) {
        const configResult = (await configResponse.json()) as typeof pgConfig
        setPgConfig(configResult)
      }

      if (runResponse.ok) {
        const runResult = (await runResponse.json()) as { success: boolean; log: (typeof pgLogs)[0] }
        setPgLogs((prev) => [runResult.log, ...prev])
        setPgBackupFeedback(`Backup concluido: ${runResult.log.mensagem}`)
      } else {
        const runResult = (await runResponse.json()) as { success: boolean; log: (typeof pgLogs)[0] }
        setPgLogs((prev) => [runResult.log, ...prev])
        setPgBackupFeedback(`Falha no backup: ${runResult.log.mensagem}`)
      }
    } catch {
      setPgBackupFeedback('API offline. Nao foi possivel executar backup.')
    } finally {
      setPgIsRunningBackup(false)
    }
  }

  useEffect(() => {
    const entity = entityByModule[active]

    if (!entity || !isLoggedIn) {
      return
    }

    const controller = new AbortController()

    async function loadRecords() {
      setIsLoadingRecords(true)

      try {
        const response = await fetch(`${apiBaseUrl}/${entity}`, { signal: controller.signal })

        if (!response.ok) {
          throw new Error('Falha ao consultar API')
        }

        const records = (await response.json()) as ApiRecord[]
        setApiRecords(records.map(apiRecordToDisplay))
        setRawApiRecords(records)
        setApiStatus('online')
      } catch {
        if (!controller.signal.aborted) {
          setApiRecords([])
          setRawApiRecords([])
          setApiStatus((prev) => (prev === 'online' ? 'offline' : prev))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingRecords(false)
        }
      }
    }

    void loadRecords()

    return () => controller.abort()
  }, [active, isLoggedIn, refreshKey])

  useEffect(() => {
    if (!isLoggedIn) return
    async function loadAuditLogs() {
      try {
        const response = await fetch(`${apiBaseUrl}/audit-logs`)
        if (response.ok) {
          const logs = (await response.json()) as Array<{ id: string; usuario: string; entidade: string; acao: string; registroId: string; detalhes: string; createdAt: string }>
          if (logs.length > 0) setAuditLogs(logs)
        }
      } catch {
        // Mantem logs em memoria se API indisponivel
      }
    }
    void loadAuditLogs()
  }, [isLoggedIn, refreshKey])

  useEffect(() => {
    if (!isLoggedIn) return
    async function loadBackups() {
      try {
        const response = await fetch(`${apiBaseUrl}/backup/list`)
        if (response.ok) {
          const backups = (await response.json()) as Array<{ id: string; arquivo: string; tamanho: string; data: string; status: string }>
          if (backups.length > 0) setAvailableBackups(backups)
        }
      } catch {
        // Mantem backups em memoria se API indisponivel
      }
    }
    void loadBackups()
  }, [isLoggedIn, refreshKey])

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <section className="login-hero">
          <div className="login-logo-card">
            <img src={logo} alt="Logo do estudio fotografico" />
          </div>
          <span className="eyebrow">IGS FotoPro</span>
          <h1>Gestao completa para estudio fotografico e eventos.</h1>
          <p>
            Controle clientes, contratos, agenda, profissionais, parcelas, despesas e lucro por
            evento em uma rotina unica.
          </p>
        </section>

        <form
          className="login-card"
          aria-label="Acesso ao sistema"
          onSubmit={(event) => {
            event.preventDefault()
            void login()
          }}
        >
          <img src={logo} alt="Logo do emitente" />
          <div>
            <span className="eyebrow">Acesso restrito</span>
            <h2>Entrar no sistema</h2>
          </div>
          <label>
            Usuario
            <span className="input-icon">
              <User aria-hidden="true" size={18} />
              <input
                onChange={(event) => setLoginForm((current) => ({ ...current, usuario: event.target.value }))}
                value={loginForm.usuario}
              />
            </span>
          </label>
          <label>
            Senha
            <span className="input-icon">
              <KeyRound aria-hidden="true" size={18} />
              <input
                onChange={(event) => setLoginForm((current) => ({ ...current, senha: event.target.value }))}
                type="password"
                value={loginForm.senha}
              />
            </span>
          </label>
          <button type="submit">
            <LockKeyhole aria-hidden="true" size={18} />
            {loginStatus === 'loading' ? 'Entrando...' : 'Entrar'}
          </button>
          {loginStatus === 'error' && <small className="login-error">Usuario ou senha invalidos.</small>}
          {loginStatus === 'offline-demo' && <small className="login-warning">API offline, acesso demo liberado.</small>}
          <small>Login demonstrativo para a primeira versao local.</small>
          <small className="developer-credit">Sistema desenvolvido por IGS AUTOMACAO COMERCIAL</small>
        </form>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="Logo" />
          <div>
            <h1>IGS FotoPro</h1>
            <span>Studio Manager</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Modulos do sistema">
          {Object.entries(groupedMenu).map(([group, items]) => (
            <div key={group}>
              <div className="sidebar-group-label">{group}</div>
              {items.map((item) => (
                <button
                  className={active === item.key ? 'nav-item active' : 'nav-item'}
                  key={item.key}
                  onClick={() => {
                    setActive(item.key)
                    setFormValues({})
                    setSaveStatus('idle')
                  }}
                  type="button"
                >
                  <item.icon aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>IGS FotoPro v1.0</strong>
          IGS AUTOMACAO COMERCIAL
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>{current.title}</span>
            <strong>{current.description}</strong>
          </div>
          <div className="user-pill">
            <div className="user-avatar">A</div>
            <span>Admin</span>
          </div>
        </header>

        {active === 'dashboard' && (
        <section className="stats-grid" aria-label="Indicadores principais">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <stat.icon aria-hidden="true" size={22} />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </article>
          ))}
        </section>
        )}

        <section className="module-card">
          <div key={active}>
          <div className="module-header">
            <h2>
              <ActiveIcon aria-hidden="true" />
              {current.title}
              <small>{current.description}</small>
            </h2>
            <button
              type="button"
              onClick={logout}
              style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: '8px', padding: '4px 10px', color: 'var(--muted)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Sair
            </button>
          </div>
          <div className="action-bar" aria-label="Acoes padrao">
              {actionButtons.map((button) => {
                const ActionIcon = actionIcons[button]
                const perms = userPermissions[active] ?? defaultPermissions.dashboard
                const isDisabled = (button === 'Excluir' && !perms.excluir) ||
                  (button === 'Editar' && !perms.editar) ||
                  (button === 'Novo' && !perms.incluir) ||
                  (button === 'Novo' && active === 'configuracoes' && (activeTab['configuracoes-tab'] ?? 0) === 0 && displayRecords.some(r => r.codigo.startsWith('EMI'))) ||
                  (button === 'Salvar' && !perms.incluir)

                function handleAction() {
                  if (button === 'Novo') { setFormValues({}); setSelectedRecord(null) }
                  else if (button === 'Salvar') { void saveCurrentRecord() }
                  else if (button === 'Editar' && selectedRecord) {
                    const raw = rawApiRecords.find(r => String(r.codigo) === selectedRecord.codigo)
                    if (raw) {
                      const filled: Record<string, string> = {}
                      for (const [key, value] of Object.entries(raw)) {
                        if (typeof value === 'string' || typeof value === 'number') {
                          filled[key] = String(value)
                        }
                      }
                      setFormValues(filled)
                    } else {
                      setFormValues({ nome: selectedRecord.titulo, status: selectedRecord.status })
                    }
                  }
                  else if (button === 'Excluir' && selectedRecord) {
                    if (!window.confirm(`Excluir ${selectedRecord.titulo}?`)) return
                    const entity = entityByModule[active]
                    if (entity) {
                      const raw = rawApiRecords.find(r => String(r.codigo) === selectedRecord.codigo)
                      const deleteId = raw?.id ?? selectedRecord.codigo
                      fetch(`${apiBaseUrl}/${entity}/${deleteId}`, { method: 'DELETE' })
                        .then(() => { setRefreshKey(k => k + 1); setSelectedRecord(null); setFormValues({}) })
                        .catch(() => {})
                    }
                  }
                  else if (button === 'Limpar') { setFormValues({}); setSelectedRecord(null); setSearchQuery('') }
                  else if (button === 'Imprimir') {
                    if (active === 'profissionais' && selectedRecord) {
                      const raw = rawApiRecords.find(r => String(r.codigo) === selectedRecord.codigo)
                      const emitNome = formValues['Razao social'] || formValues['Nome fantasia'] || 'IGS FotoPro'
                      const emitDoc = formValues['CNPJ / CPF'] || ''
                      const emitEnd = formValues['Endereco'] || ''
                      const emitTel = formValues['Telefone'] || ''
                      const emitEmail = formValues['E-mail'] || ''
                      const now = new Date().toLocaleDateString('pt-BR')
                      const rawObj = raw as Record<string, unknown> | undefined
                      const valorDiaria = rawObj?.valorDiaria ? `R$ ${String(rawObj.valorDiaria)}` : ''
                      const valorHora = rawObj?.valorHora ? `R$ ${String(rawObj.valorHora)}` : ''
                      const body = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Ficha Cadastral - ${selectedRecord.titulo}</title>
<style>
  @page { margin: 1.2cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 10pt; line-height: 1.5; }
  .header { display: flex; align-items: center; gap: 18px; padding-bottom: 14px; border-bottom: 2px solid #d8ad45; margin-bottom: 18px; }
  .header img { width: 64px; height: 64px; object-fit: contain; border: 1px solid #eee; border-radius: 10px; padding: 4px; }
  .header h1 { font-size: 14pt; color: #111822; letter-spacing: -0.03em; margin-bottom: 2px; }
  .header small { display: block; color: #888; font-size: 7.5pt; }
  .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .title-row h2 { font-size: 13pt; color: #d8ad45; letter-spacing: -0.02em; }
  .title-row span { font-size: 8pt; color: #999; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 16px; }
  .field { border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .field label { font-size: 7pt; color: #d8ad45; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: block; }
  .field strong { font-size: 9.5pt; color: #1a1a2e; display: block; }
  .full { grid-column: 1 / -1; }
  .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd; text-align: center; font-size: 7pt; color: #aaa; }
</style>
</head>
<body>
<div class="header">
  <img src="${logo}" alt="Logo" />
  <div>
    <h1>${emitNome}</h1>
    <small>${emitDoc ? 'CNPJ: ' + emitDoc : ''}${emitEnd ? ' | ' + emitEnd : ''}</small>
    <small>${emitTel ? 'Tel: ' + emitTel : ''}${emitEmail ? ' | Email: ' + emitEmail : ''}</small>
  </div>
</div>
<div class="title-row">
  <h2>FICHA CADASTRAL — PROFISSIONAL</h2>
  <span>Emitido em ${now}</span>
</div>
<div class="grid">
  <div class="field"><label>Codigo</label><strong>${selectedRecord.codigo}</strong></div>
  <div class="field"><label>Nome</label><strong>${selectedRecord.titulo}</strong></div>
  ${rawObj?.categoria ? `<div class="field"><label>Categoria</label><strong>${String(rawObj.categoria)}</strong></div>` : ''}
  ${rawObj?.documento ? `<div class="field"><label>CPF/CNPJ</label><strong>${String(rawObj.documento)}</strong></div>` : ''}
  ${rawObj?.telefone ? `<div class="field"><label>Telefone</label><strong>${String(rawObj.telefone)}</strong></div>` : ''}
  ${rawObj?.whatsapp ? `<div class="field"><label>WhatsApp</label><strong>${String(rawObj.whatsapp)}</strong></div>` : ''}
  ${rawObj?.email ? `<div class="field"><label>Email</label><strong>${String(rawObj.email)}</strong></div>` : ''}
  ${rawObj?.especialidade ? `<div class="field"><label>Especialidade</label><strong>${String(rawObj.especialidade)}</strong></div>` : ''}
  ${valorDiaria ? `<div class="field"><label>Valor Diaria</label><strong>${valorDiaria}</strong></div>` : ''}
  ${valorHora ? `<div class="field"><label>Valor Hora</label><strong>${valorHora}</strong></div>` : ''}
  ${rawObj?.comissaoPercentual ? `<div class="field"><label>Comissao</label><strong>${String(rawObj.comissaoPercentual)}%</strong></div>` : ''}
  ${rawObj?.formaPagamento ? `<div class="field"><label>Forma Pagto</label><strong>${String(rawObj.formaPagamento)}</strong></div>` : ''}
  ${rawObj?.pix ? `<div class="field"><label>Chave PIX</label><strong>${String(rawObj.pix)}</strong></div>` : ''}
  ${rawObj?.banco ? `<div class="field full"><label>Banco / Agencia / Conta</label><strong>${String(rawObj.banco)}</strong></div>` : ''}
  ${rawObj?.disponibilidade ? `<div class="field full"><label>Disponibilidade</label><strong>${String(rawObj.disponibilidade)}</strong></div>` : ''}
  <div class="field full"><label>Status</label><strong>${selectedRecord.status}</strong></div>
</div>
<div class="footer">
  Sistema desenvolvido por IGS AUTOMACAO COMERCIAL &mdash; IGS FotoPro
</div>
</body>
</html>`
                      const pw = window.open('', '_blank')
                      if (pw) { pw.document.write(body); pw.document.close(); pw.focus(); setTimeout(() => pw.print(), 300) }
                    } else {
                      window.print()
                    }
                  }
                  else if (button === 'Exportar' && displayRecords.length > 0) {
                    const csv = 'codigo;titulo;status;valor\n' + displayRecords.map(r => `${r.codigo};${r.titulo};${r.status};${r.valor}`).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = `${active}.csv`; a.click()
                    URL.revokeObjectURL(url)
                  }
                }
                return (
                <button key={button} onClick={handleAction} type="button" disabled={isDisabled} style={isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
                  <ActionIcon aria-hidden="true" size={16} />
                  {button === 'Salvar' && saveStatus === 'saving' ? 'Salvando...' : button}
                </button>
                )
              })}
            </div>

          {saveStatus !== 'idle' && (
            <div className={`save-feedback ${saveStatus}`}>
              {saveStatus === 'saving' && 'Salvando registro na API local...'}
              {saveStatus === 'saved' && 'Registro salvo com sucesso e lista atualizada.'}
              {saveStatus === 'error' && 'Nao foi possivel salvar. Verifique se a API esta rodando.'}
            </div>
          )}

          {active !== 'profissionais' && (
          <div className="tabs" role="tablist" aria-label="Abas do modulo">
            {current.tabs.map((tab, index) => {
              const tabKey = active + '-tab'
              const isSelected = (activeTab[tabKey] ?? 0) === index
              return (
              <button className={isSelected ? 'selected' : ''} key={tab} type="button" onClick={() => setActiveTab(prev => ({ ...prev, [tabKey]: index }))}>
                {tab}
              </button>
              )
            })}
          </div>
          )}

          <div className="content-grid">
            {active === 'configuracoes' && (activeTab['configuracoes-tab'] ?? 0) === 0 && (
              <div className="issuer-logo-card">
                <span className="eyebrow">Logo do emitente</span>
                <img src={logo} alt="Logo cadastrada para emitente" />
                <p>Esta logo sera usada no cadastro do emitente, login, contratos, recibos e relatorios.</p>
              </div>
            )}

            {(!(active === 'configuracoes' && (activeTab['configuracoes-tab'] ?? 0) >= 1) && !(active === 'financeiro' && (financeTab) >= 3)) && (
            <>
            <form className="form-panel">
              <label>
                Codigo automatico
                <input value="GERADO AO SALVAR" readOnly />
              </label>
          {active === 'clientes' && (activeTab['clientes-tab'] ?? 0) === 2 && (
                <label>
                  Tipo de pessoa
                  <select
                    value={clientPersonType}
                    onChange={(event) => {
                      setClientPersonType(event.target.value as 'fisica' | 'juridica')
                      setFormValues({})
                      setCnpjLookupStatus('idle')
                    }}
                  >
                    <option value="fisica">Pessoa Fisica (CPF)</option>
                    <option value="juridica">Pessoa Juridica (CNPJ)</option>
                  </select>
                </label>
              )}
              {fields.map((field) => {
                if (active === 'clientes' && clientPersonType === 'fisica' && (field.label === 'Nome fantasia / apelido' || field.label === 'Inscricao Estadual' || field.label === 'Responsavel')) return null
                if (active === 'clientes' && clientPersonType === 'juridica' && (field.label === 'RG / IE' || field.label === 'Data de nascimento' || field.label === 'Profissao')) return null
                return (
                <label className={field.wide ? 'wide' : ''} key={field.label}>
                  {field.label}
                  {field.multiline ? (
                    <textarea
                      onChange={(event) => updateFormValue(field.label, event.target.value)}
                      placeholder={field.placeholder}
                      value={formValues[field.label] ?? ''}
                    />
                  ) : active === 'usuarios' && field.label === 'Perfil' ? (
                    <select
                      onChange={(event) => updateFormValue(field.label, event.target.value)}
                      value={formValues[field.label] ?? ''}
                    >
                      <option value="">Selecione um perfil</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Gerente">Gerente</option>
                      <option value="Consulta">Consulta</option>
                      <option value="Operador">Operador</option>
                    </select>
                  ) : (
                    <input
                      type={active === 'usuarios' && (field.label === 'Senha' || field.label === 'Confirmar senha') ? 'password' : 'text'}
                      onChange={(event) => {
                        let value = event.target.value
                        if (field.mask === 'currency') value = maskCurrency(value)
                        else if (field.mask === 'cpf-cnpj') value = maskCpfCnpj(value, clientPersonType)
                        else if (field.mask === 'cpf') value = maskCpfCnpj(value, 'fisica')
                        else if (field.mask === 'cnpj') value = maskCpfCnpj(value, 'juridica')
                        else if (field.mask === 'phone') value = maskPhone(value)
                        else if (field.mask === 'date') value = maskDate(value)
                        else if (field.mask === 'cep') value = maskCep(value)
                        updateFormValue(field.label, value)
                        if (active === 'clientes' && clientPersonType === 'juridica' && field.label === 'CPF/CNPJ' && value.replace(/\D/g, '').length === 14) {
                          void handleCnpjLookup(value)
                        }
                        if (field.mask === 'cep' && value.replace(/\D/g, '').length === 8) {
                          void handleCepLookup(value)
                        } else if (field.mask === 'cep') {
                          setCepLookupStatus('idle')
                        }
                      }}
                      onBlur={() => {
                        if (active === 'clientes' && clientPersonType === 'juridica' && field.label === 'CPF/CNPJ') {
                          const val = formValues['CPF/CNPJ'] ?? ''
                          if (val.replace(/\D/g, '').length === 14) void handleCnpjLookup(val)
                        }
                        if (field.mask === 'cep') {
                          const val = formValues[field.label] ?? ''
                          if (val.replace(/\D/g, '').length === 8) void handleCepLookup(val)
                        }
                      }}
                      placeholder={field.placeholder}
                      value={formValues[field.label] ?? ''}
                    />
                  )}
                  {active === 'clientes' && field.label === 'CPF/CNPJ' && cnpjLookupStatus === 'loading' && (
                    <small style={{ color: '#d8ad45', fontWeight: 800 }}>Buscando dados do CNPJ...</small>
                  )}
                  {active === 'clientes' && field.label === 'CPF/CNPJ' && cnpjLookupStatus === 'found' && (
                    <small style={{ color: '#29945b', fontWeight: 800 }}>Dados da empresa encontrados e preenchidos automaticamente.</small>
                  )}
                  {active === 'clientes' && field.label === 'CPF/CNPJ' && cnpjLookupStatus === 'error' && (
                    <small style={{ color: '#a24822', fontWeight: 800 }}>CNPJ nao encontrado. Preencha manualmente.</small>
                  )}
                  {field.mask === 'cep' && cepLookupStatus === 'loading' && (
                    <small style={{ color: '#d8ad45', fontWeight: 800 }}>Buscando endereco pelo CEP...</small>
                  )}
                  {field.mask === 'cep' && cepLookupStatus === 'found' && (
                    <small style={{ color: '#29945b', fontWeight: 800 }}>Endereco preenchido automaticamente.</small>
                  )}
                  {field.mask === 'cep' && cepLookupStatus === 'error' && (
                    <small style={{ color: '#a24822', fontWeight: 800 }}>CEP nao encontrado. Preencha manualmente.</small>
                  )}
                </label>
                )
              })}
              {active === 'clientes' && clientPersonType === 'juridica' && cnpjLookupStatus === 'loading' && (
                <small style={{ color: '#d8ad45', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Consultando CNPJ na BrasilAPI...</small>
              )}
            </form>

            <div className="records-panel">
              <div className="records-count">{isLoadingRecords ? 'Carregando registros...' : `${displayRecords.length} registro(s)`}</div>

              <div className="search-line">
                <input placeholder="Busca rapida por codigo, nome, CPF/CNPJ, telefone ou status" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <button type="button" onClick={() => setSearchQuery('')}><Filter aria-hidden="true" size={16} /> {searchQuery ? 'Limpar filtro' : 'Filtrar'}</button>
              </div>

              <div className="records-list">
                {displayRecords.length === 0 && <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>Nenhum registro encontrado.</p>}
                {displayRecords.map((record) => (
                  <article
                    className={`record-row ${selectedRecord?.codigo === record.codigo ? 'selected' : ''}`}
                    key={record.codigo}
                    onClick={() => {
                      setSelectedRecord(selectedRecord?.codigo === record.codigo ? null : record)
                      const raw = rawApiRecords.find(r => String(r.codigo) === record.codigo)
                      if (raw) {
                        const filled: Record<string, string> = {}
                        for (const [key, value] of Object.entries(raw)) {
                          if (typeof value === 'string' || typeof value === 'number') {
                            filled[key] = String(value)
                          }
                        }
                        setFormValues(filled)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <span>{record.codigo}</span>
                      <strong>{record.titulo}</strong>
                      <small>{record.subtitulo}</small>
                    </div>
                    <div className="record-meta">
                      <span>{record.status}</span>
                      <strong>{record.valor}</strong>
                      {active === 'profissionais' && (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent('Ola, gostaria de falar com ' + record.titulo + ' - ' + record.codigo)}`}
                          target="_blank"
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#25d366', color: '#fff', fontSize: '0.65rem', fontWeight: 800, textDecoration: 'none', marginTop: '2px' }}
                          title="Abrir WhatsApp"
                        >
                          W
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            </>)}
          </div>

          {active === 'dashboard' && (
            <div className="insight-grid">
              {dashboardPanels.map((panel, index) => (
                <article className="insight-card" key={panel}>
                  <Aperture aria-hidden="true" size={22} />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{panel}</strong>
                  <small>Clique no card para abrir a tela detalhada correspondente.</small>
                </article>
              ))}
            </div>
          )}

          {active === 'relatorios' && (
            <div className="finance-grid">
              <article className="finance-card">
                <BarChart3 aria-hidden="true" size={22} />
                <span>Receita Mensal</span>
                <strong>R$ 32.840,00</strong>
                <small>Total de entradas no periodo</small>
                <em style={{ color: '#29945b' }}>+12% vs mes anterior</em>
              </article>
              <article className="finance-card">
                <BarChart3 aria-hidden="true" size={22} />
                <span>Despesas Mensais</span>
                <strong>R$ 14.480,00</strong>
                <small>Total de saidas no periodo</small>
                <em style={{ color: '#a24822' }}>-5% vs mes anterior</em>
              </article>
              <article className="finance-card">
                <CircleDollarSign aria-hidden="true" size={22} />
                <span>Lucro Liquido</span>
                <strong>R$ 18.360,00</strong>
                <small>Receita menos despesas</small>
                <em style={{ color: '#29945b' }}>Margem: 55.9%</em>
              </article>
              <article className="finance-card">
                <CalendarDays aria-hidden="true" size={22} />
                <span>Eventos no Periodo</span>
                <strong>18 eventos</strong>
                <small>8 casamentos, 5 formaturas, 5 outros</small>
                <em>12 concluidos, 6 em andamento</em>
              </article>
              <article className="finance-card">
                <Users aria-hidden="true" size={22} />
                <span>Clientes Atendidos</span>
                <strong>42 clientes</strong>
                <small>Novos: 12 | Recorrentes: 30</small>
                <em style={{ color: '#29945b' }}>NPS: 9.2</em>
              </article>
              <article className="finance-card">
                <FileDown aria-hidden="true" size={22} />
                <span>Exportar Relatorio</span>
                <strong style={{ fontSize: '0.85rem', color: '#555' }}>Gerar planilha ou PDF</strong>
                <small>Exporte os dados filtrados</small>
                <button
                  type="button"
                  onClick={() => {
                    const reportContent = `RELATORIO GERENCIAL - IGS FotoPro\n` +
                      `Periodo: ${formValues['Data inicial'] || '01/06/2026'} a ${formValues['Data final'] || '30/06/2026'}\n` +
                      `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n` +
                      `RESUMO FINANCEIRO\n` +
                      `Receita Mensal: R$ 32.840,00\n` +
                      `Despesas Mensais: R$ 14.480,00\n` +
                      `Lucro Liquido: R$ 18.360,00\n` +
                      `Margem: 55.9%\n\n` +
                      `EVENTOS\n` +
                      `Total: 18 eventos\n` +
                      `Casamentos: 8\n` +
                      `Formaturas: 5\n` +
                      `Outros: 5\n\n` +
                      `CLIENTES\n` +
                      `Total: 42 clientes\n` +
                      `Novos: 12\n` +
                      `Recorrentes: 30\n` +
                      `NPS: 9.2`
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Relatorio Gerencial</title>
                          <style>
                            body { font-family: 'Courier New', monospace; font-size: 11pt; line-height: 1.6; margin: 2cm; color: #000; }
                            pre { white-space: pre-wrap; }
                            @media print { body { margin: 1.5cm; } }
                          </style>
                        </head>
                        <body>
                          <pre>${reportContent}</pre>
                        </body>
                        </html>
                      `)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                  style={{ marginTop: '8px', background: 'linear-gradient(135deg, #d8ad45, #9a7627)', color: '#fff', border: 0, borderRadius: '12px', padding: '8px 16px', fontWeight: 900, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Exportar Relatorio
                </button>
              </article>
            </div>
          )}

          {active === 'financeiro' && financeTab === 3 && (
            <div className="finance-grid">
              <article className="finance-card">
                <BarChart3 aria-hidden="true" size={22} />
                <span>Lucro por Evento</span>
                <strong>R$ 18.360,00</strong>
                <small>Receitas totais: R$ 32.840,00</small>
                <em style={{ color: '#29945b' }}>Margem media: 55.9%</em>
              </article>
              <article className="finance-card">
                <BarChart3 aria-hidden="true" size={22} />
                <span>Despesas por Evento</span>
                <strong>R$ 14.480,00</strong>
                <small>Total de custos vinculados</small>
                <em style={{ color: '#a24822' }}>5 eventos com despesas</em>
              </article>
              <article className="finance-card">
                <CircleDollarSign aria-hidden="true" size={22} />
                <span>Evento Mais Rentavel</span>
                <strong>Casamento Silva</strong>
                <small>Lucro: R$ 4.200,00 | Margem: 62%</small>
                <em>EVT-1042</em>
              </article>
              <article className="finance-card">
                <Users aria-hidden="true" size={22} />
                <span>Custos com Profissionais</span>
                <strong>R$ 5.240,00</strong>
                <small>8 profissionais contratados no mes</small>
                <em>36% das despesas totais</em>
              </article>
              <article className="finance-card">
                <ShoppingBag aria-hidden="true" size={22} />
                <span>Custos com Fornecedores</span>
                <strong>R$ 4.970,00</strong>
                <small>Albuns, impressao, locacao</small>
                <em>34% das despesas totais</em>
              </article>
              <article className="finance-card">
                <FileDown aria-hidden="true" size={22} />
                <span>Relatorio Detalhado</span>
                <strong style={{ fontSize: '0.85rem', color: '#555' }}>Exportar por periodo</strong>
                <small>Filtre por data, evento ou categoria</small>
                <button
                  type="button"
                  onClick={() => {
                    const r = `RELATORIO DE DESPESAS POR EVENTO\nPeriodo: 01/06/2026 a 30/06/2026\n\nEvento                Receita   Despesa   Lucro    Margem\nCasamento Silva       R$ 6.780  R$ 2.580  R$ 4.200  62%\nFormatura Medicina    R$ 8.400  R$ 3.200  R$ 5.200  62%\nAniversario Joao      R$ 2.500  R$ 1.100  R$ 1.400  56%\nEnsaio Beatriz        R$ 1.200  R$ 540    R$ 660    55%\nCorporativo Tech      R$ 5.800  R$ 2.400  R$ 3.400  59%\n-------------------------------------------\nTOTAL                 R$ 24.680 R$ 9.820  R$ 14.860 60%`
                    const pw = window.open('', '_blank')
                    if (pw) { pw.document.write(`<!DOCTYPE html><html><head><title>Despesas por Evento</title><style>body{font-family:'Courier New',monospace;font-size:11pt;margin:2cm;color:#000}pre{white-space:pre-wrap}@media print{body{margin:1.5cm}}</style></head><body><pre>${r}</pre></body></html>`); pw.document.close(); pw.print() }
                  }}
                  style={{ marginTop: '8px', background: 'linear-gradient(135deg, #d8ad45, #9a7627)', color: '#fff', border: 0, borderRadius: '12px', padding: '8px 16px', fontWeight: 900, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Exportar Relatorio
                </button>
              </article>
            </div>
          )}

          {active === 'financeiro' && financeTab === 4 && (
            <div className="finance-grid">
              <article className="finance-card">
                <TrendingUp aria-hidden="true" size={22} />
                <span>Saldo Atual</span>
                <strong>R$ 18.360,00</strong>
                <small>Disponivel em caixa</small>
                <em>Atualizado hoje</em>
              </article>
              <article className="finance-card">
                <TrendingUp aria-hidden="true" size={22} />
                <span>Projecao 30 dias</span>
                <strong>R$ 25.840,00</strong>
                <small>Receber: R$ 12.480 | Pagar: R$ 4.970</small>
                <em style={{ color: '#29945b' }}>Saldo projetado: R$ 25.870</em>
              </article>
              <article className="finance-card">
                <TrendingUp aria-hidden="true" size={22} />
                <span>Projecao 60 dias</span>
                <strong>R$ 31.200,00</strong>
                <small>Estimativa com contratos em negociacao</small>
                <em style={{ color: '#29945b' }}>Crescimento de 21%</em>
              </article>
              <article className="finance-card">
                <AlertTriangle aria-hidden="true" size={22} />
                <span>A Receber (Vencidos)</span>
                <strong>R$ 3.240,00</strong>
                <small>3 parcelas em atraso</small>
                <em style={{ color: '#a24822' }}>Acao de cobranca necessaria</em>
              </article>
              <article className="finance-card">
                <AlertTriangle aria-hidden="true" size={22} />
                <span>A Pagar (Vencidos)</span>
                <strong>R$ 890,00</strong>
                <small>2 contas em atraso</small>
                <em style={{ color: '#a24822' }}>Regularizar urgentemente</em>
              </article>
              <article className="finance-card">
                <FileDown aria-hidden="true" size={22} />
                <span>Exportar Fluxo</span>
                <strong style={{ fontSize: '0.85rem', color: '#555' }}>Baixar projecao</strong>
                <small>Relatorio completo de fluxo de caixa</small>
                <button
                  type="button"
                  onClick={() => {
                    const r = `FLUXO DE CAIXA - IGS FotoPro\nData: ${new Date().toLocaleDateString('pt-BR')}\n\nSALDO ATUAL: R$ 18.360,00\n\nENTRADAS PREVISTAS (30 dias)\nContas a Receber:     R$ 12.480,00\nContratos Novos:       R$ 5.200,00\nOutros:                R$ 1.100,00\nTotal:                 R$ 18.780,00\n\nSAIDAS PREVISTAS (30 dias)\nContas a Pagar:        R$ 4.970,00\nFolha de Pagamento:    R$ 6.200,00\nCustos Operacionais:   R$ 3.100,00\nTotal:                 R$ 14.270,00\n\nSALDO PROJETADO (30d): R$ 22.870,00`
                    const pw = window.open('', '_blank')
                    if (pw) { pw.document.write(`<!DOCTYPE html><html><head><title>Fluxo de Caixa</title><style>body{font-family:'Courier New',monospace;font-size:11pt;margin:2cm;color:#000}pre{white-space:pre-wrap}@media print{body{margin:1.5cm}}</style></head><body><pre>${r}</pre></body></html>`); pw.document.close(); pw.print() }
                  }}
                  style={{ marginTop: '8px', background: 'linear-gradient(135deg, #d8ad45, #9a7627)', color: '#fff', border: 0, borderRadius: '12px', padding: '8px 16px', fontWeight: 900, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Exportar Fluxo
                </button>
              </article>
            </div>
          )}

          {active === 'configuracoes' && (activeTab['configuracoes-tab'] ?? 0) === 1 && (
            <>
              <div className="permission-panel">
                <div>
                  <span className="eyebrow">Permissoes por modulo</span>
                  <h3>Controle de acesso - Perfil: Administrador</h3>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {Object.keys(defaultPermissions).map((module) => (
                    <div key={module} className="record-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <strong style={{ minWidth: '120px', textTransform: 'capitalize' }}>{module}</strong>
                      {(['visualizar', 'incluir', 'editar', 'excluir'] as const).map((action) => (
                        <label key={action} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                          <input
                            type="checkbox"
                            checked={userPermissions[module]?.[action] ?? false}
                            onChange={() => togglePermission(module, action)}
                          />
                          {action}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {active === 'configuracoes' && (activeTab['configuracoes-tab'] ?? 0) === 3 && (
            <div className="backup-panel">
              <div>
                <span className="eyebrow">Logs de auditoria</span>
                <h3>Historico de acoes do sistema</h3>
              </div>
              <div className="backup-logs">
                {auditLogs.slice(0, 15).map((log) => (
                  <article className="record-row" key={log.id}>
                    <div>
                      <span>{log.acao}</span>
                      <strong>{log.entidade} - {log.detalhes}</strong>
                      <small>Usuario: {log.usuario} | Registro: {log.registroId}</small>
                    </div>
                    <div className="record-meta">
                      <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </article>
                ))}
              </div>
              <div className="backup-panel">
                <div>
                  <span className="eyebrow">Restauracao de backup</span>
                  <h3>Restaurar banco de dados</h3>
                </div>
                <div className="backup-logs">
                  {availableBackups.map((backup) => (
                    <article className="record-row" key={backup.id}>
                      <div>
                        <span>{backup.arquivo}</span>
                        <strong>{backup.tamanho} - {backup.status}</strong>
                        <small>{backup.data}</small>
                      </div>
                      <div className="record-meta">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Restaurar backup ${backup.arquivo}? Esta acao ira substituir todos os dados atuais.`)) {
                              fetch(`${apiBaseUrl}/backup/restore`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ backupId: backup.id }),
                              }).then(() => {
                                setRefreshKey((key) => key + 1)
                              }).catch(() => {})
                            }
                          }}
                          style={{ padding: '6px 12px', border: '1px solid #d8ad45', borderRadius: '10px', background: 'transparent', color: '#85651b', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem' }}
                        >
                          Restaurar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === 'contratos' && (activeTab['contratos-tab'] ?? 0) === 0 && (
            <div className="contract-preview-panel">
              <div>
                <span className="eyebrow">Modelo de contrato</span>
                <h3>{contractTemplateName}</h3>
              </div>
              <label>
                Modelo / Tipo de evento
                <input
                  onChange={(event) => setContractTemplateName(event.target.value)}
                  value={contractTemplateName}
                />
              </label>
              <label className="wide">
                Texto do contrato com variaveis
                <textarea
                  onChange={(event) => setContractText(event.target.value)}
                  rows={12}
                  value={contractText}
                />
              </label>
              <div className="variable-tags">
                <span>{'{cliente_nome}'}</span>
                <span>{'{cliente_cpf_cnpj}'}</span>
                <span>{'{cliente_endereco}'}</span>
                <span>{'{evento_tipo}'}</span>
                <span>{'{evento_data}'}</span>
                <span>{'{evento_local}'}</span>
                <span>{'{valor_total}'}</span>
                <span>{'{valor_entrada}'}</span>
                <span>{'{quantidade_parcelas}'}</span>
                <span>{'{prazo_entrega}'}</span>
                <span>{'{emitente_razao}'}</span>
                <span>{'{emitente_cnpj}'}</span>
                <span>{'{data_contrato}'}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setPreviewContractActive(true)}>
                  Gerar visualizacao
                </button>
                {previewContractActive && (
                  <>
                    <button type="button" onClick={() => setPreviewContractActive(false)} style={{ background: 'linear-gradient(135deg, #b0b8c4, #7d8694)' }}>
                      Fechar preview
                    </button>
                    <button type="button" onClick={() => {
                      const contractContent = replaceContractVars()
                      const printWindow = window.open('', '_blank')
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>${contractTemplateName}</title>
                            <style>
                              body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 2cm; color: #000; }
                              h1 { text-align: center; font-size: 14pt; margin-bottom: 20px; text-transform: uppercase; }
                              p { text-align: justify; margin: 8px 0; }
                              .signature { margin-top: 60px; display: flex; justify-content: space-between; }
                              .signature-line { width: 40%; text-align: center; border-top: 1px solid #000; padding-top: 8px; }
                              @media print { body { margin: 1.5cm; } }
                            </style>
                          </head>
                          <body>
                            <pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt;">${contractContent}</pre>
                          </body>
                          </html>
                        `)
                        printWindow.document.close()
                        printWindow.print()
                      }
                    }}>
                      Imprimir / PDF
                    </button>
                    <button type="button" onClick={() => {
                      const phone = (formValues['WhatsApp'] || formValues['Telefone'] || formValues['Telefone/WhatsApp'] || '').replace(/\D/g, '')
                      const message = encodeURIComponent(
                        `Olá ${formValues['Nome completo'] || formValues['Nome/Razao social'] || 'Cliente'}!\n\n` +
                          `Segue o contrato para o evento ${formValues['Titulo do evento'] || 'seu evento'}.\n\n` +
                          `Valor total: ${formValues['Valor contratado'] || 'R$ 0,00'}\n` +
                          `Entrada: ${formValues['Valor de entrada'] || formValues['Valor entrada'] || 'R$ 0,00'}\n` +
                          `Parcelamento: ${formValues['Quantidade de parcelas'] || formValues['Parcelas'] || '10'}x\n\n` +
                          `Por favor, revise e confirme para darmos sequencia.\n\n` +
                          `Att,\n${formValues['Razao social'] || formValues['Nome fantasia'] || formValues['Razao social/Nome fantasia'] || 'IGS FotoPro'}`
                      )
                      const url = phone ? `https://wa.me/55${phone}?text=${message}` : `https://wa.me/?text=${message}`
                      window.open(url, '_blank')
                    }} style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
                      Enviar Contrato via WhatsApp
                    </button>
                  </>
                )}
              </div>
              {previewContractActive && (
                <div className="contract-rendered">
                  <span className="eyebrow">Contrato gerado - {new Date().toLocaleDateString('pt-BR')}</span>
                  <pre>{replaceContractVars()}</pre>
                </div>
              )}
            </div>
          )}

          {active === 'clientes' && (
            <div className="graduation-panel">
              <div>
                <span className="eyebrow">Fluxo de formatura</span>
                <h3>Simulador de parcelamento por aluno/formando</h3>
              </div>
              <label>
                Nome do aluno / formando
                <input
                  onChange={(event) => setGradStudentName(event.target.value)}
                  value={gradStudentName}
                />
              </label>
              <label>
                Valor total do pacote (R$)
                <input
                  onChange={(event) => setGradPkgPrice(Number(event.target.value) || 0)}
                  type="number"
                  value={gradPkgPrice}
                />
              </label>
              <label>
                Quantidade de parcelas (ate 20x)
                <input
                  max={20}
                  min={1}
                  onChange={(event) => setGradInstallmentsNum(Math.min(20, Number(event.target.value) || 1))}
                  type="number"
                  value={gradInstallmentsNum}
                />
              </label>
              <button type="button" onClick={generateGradInstallments}>
                Gerar parcelas
              </button>
              {gradGeneratedInstallments.length > 0 && (
                <>
                  <div className="grad-cards">
                    <article className="stat-card">
                      <span>Total</span>
                      <strong>{gradGeneratedInstallments.length}x</strong>
                      <small>{formatCurrency(gradPkgPrice)}</small>
                    </article>
                    <article className="stat-card">
                      <span>Parcela</span>
                      <strong>{gradGeneratedInstallments[0]?.valor}</strong>
                      <small>mensal</small>
                    </article>
                    <article className="stat-card">
                      <span>Aluno</span>
                      <strong>{gradStudentName}</strong>
                      <small>Formatura 2026</small>
                    </article>
                  </div>
                  <div className="grad-installments-list">
                    {gradGeneratedInstallments.map((parcela) => (
                      <article className="record-row" key={parcela.parcela}>
                        <div>
                          <span>Parcela {String(parcela.parcela).padStart(2, '0')}</span>
                          <strong>Vencimento: {parcela.vencimento}</strong>
                          <small>{gradStudentName} | Formatura 2026</small>
                        </div>
                        <div className="record-meta">
                          <span>{parcela.parcela <= 3 ? 'A vencer' : 'Pendente'}</span>
                          <strong>{parcela.valor}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {active === 'configuracoes' && (activeTab['configuracoes-tab'] ?? 0) === 2 && (
            <div className="backup-panel">
              <div>
                <span className="eyebrow">Backup PostgreSQL</span>
                <h3>Configuracao de backup manual e automatico</h3>
              </div>
              <label>
                Caminho do PostgreSQL/bin
                <input
                  onChange={(event) => setPgConfig((c) => ({ ...c, postgresBinPath: event.target.value }))}
                  value={pgConfig.postgresBinPath}
                />
              </label>
              <label>
                Nome do banco
                <input
                  onChange={(event) => setPgConfig((c) => ({ ...c, databaseName: event.target.value }))}
                  value={pgConfig.databaseName}
                />
              </label>
              <label>
                Usuario do banco
                <input
                  onChange={(event) => setPgConfig((c) => ({ ...c, username: event.target.value }))}
                  value={pgConfig.username}
                />
              </label>
              <label>
                Pasta destino
                <input
                  onChange={(event) => setPgConfig((c) => ({ ...c, destinationFolder: event.target.value }))}
                  value={pgConfig.destinationFolder}
                />
              </label>
              <label>
                Horario automatico
                <input
                  onChange={(event) => setPgConfig((c) => ({ ...c, automaticSchedule: event.target.value }))}
                  value={pgConfig.automaticSchedule}
                />
              </label>
              <label>
                Manter ultimos N backups
                <input
                  min={1}
                  onChange={(event) => setPgConfig((c) => ({ ...c, backupsToKeep: Number(event.target.value) || 5 }))}
                  type="number"
                  value={pgConfig.backupsToKeep}
                />
              </label>
              <button disabled={pgIsRunningBackup} onClick={() => void triggerBackup()} type="button">
                {pgIsRunningBackup ? 'Executando pg_dump...' : 'Executar backup manual agora'}
              </button>
              {pgBackupFeedback && (
                <div className={`backup-feedback ${pgBackupFeedback.includes('Falha') || pgBackupFeedback.includes('offline') ? 'error' : 'saved'}`}>
                  {pgBackupFeedback}
                </div>
              )}
              <div className="backup-logs">
                <span className="eyebrow">Historico de backups</span>
                {pgLogs.map((log) => (
                  <article className="record-row" key={log.id}>
                    <div>
                      <span>{log.tipo}</span>
                      <strong>{log.mensagem}</strong>
                      <small>{log.createdAt}</small>
                    </div>
                    <div className="record-meta">
                      <span className={log.status === 'Falha' ? 'status-error' : ''}>{log.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          </div>
        </section>

        <footer className="app-footer">Sistema desenvolvido por IGS AUTOMACAO COMERCIAL</footer>
      </main>
    </div>
  )
}

export default function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
