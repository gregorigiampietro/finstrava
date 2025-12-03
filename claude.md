# Finstrava - Sistema de Gestão Financeira Empresarial

## Visão Geral

Finstrava é um sistema prático de gestão financeira para empresas, permitindo o gerenciamento de múltiplas empresas em uma única conta, com controle de receitas, despesas, fluxo de caixa e relatórios gerenciais.

## Objetivos Principais

1. **Controle Financeiro**: Organizar entradas e saídas de forma simples e eficiente
2. **Multi-Empresa**: Gerenciar múltiplas empresas com visões isoladas e consolidadas
3. **Visibilidade**: Dashboards e relatórios para tomada de decisão
4. **Projeções Simples**: Estimativas baseadas em clientes ativos e histórico

## Arquitetura Implementada

### Stack Tecnológica
- **Frontend**: Next.js 14 com TypeScript, Tailwind CSS, Shadcn/ui ✅
- **Backend**: Next.js API Routes ✅
- **Banco de Dados**: Supabase (PostgreSQL) ✅
- **Autenticação**: Supabase Auth ✅
- **Storage**: Supabase Storage para documentos

### Padrões de Arquitetura
- Multi-tenancy simples com filtro por empresa
- API RESTful
- Arquitetura monolítica bem organizada

## Módulos do Sistema

### 1. Gestão de Empresas ✅
- **Cadastro de Empresas**: CNPJ, razão social, dados básicos ✅
- **Configurações por Empresa**: Categorias e formas de pagamento customizáveis ✅
- **Seleção de Contexto**: Alternar facilmente entre empresas ✅

### 2. Lançamentos Financeiros

#### 2.1 Contas a Receber
- Cadastro de títulos a receber
- Controle de parcelas e recorrências
- Status de pagamento (pago/pendente/vencido)
- Relatório de inadimplência
- Anexo de comprovantes

#### 2.2 Contas a Pagar
- Cadastro de títulos a pagar
- Controle de vencimentos
- Programação de pagamentos
- Status e histórico

#### 2.3 Movimentações Bancárias
- Lançamento manual de movimentações
- Transferências entre contas
- Controle de saldos
- Conciliação manual simplificada

### 3. Cadastros Básicos

#### 3.1 Clientes/Fornecedores
- Cadastro com dados essenciais ✅ (Clientes implementado)
- Histórico de transações
- Documentos anexados
- Informações de contato ✅

#### 3.2 Categorias (Customizáveis por Empresa) ✅
- Categorias de receitas ✅
- Categorias de despesas ✅
- Subcategorias opcionais ✅
- Gestão simples via interface ✅

#### 3.3 Formas de Pagamento (Customizáveis) ✅
- Dinheiro, PIX, Boleto, Cartões ✅
- Cadastro livre de novas formas ✅
- Configuração de parcelas disponíveis ✅

#### 3.4 Produtos/Serviços ✅
- Catálogo básico ✅
- Preços e descrições ✅
- Vinculação com lançamentos ✅

### 4. Fluxo de Caixa

#### 4.1 Visão Diária
- Saldo inicial e final
- Entradas e saídas do dia
- Projeção simples de saldo futuro

#### 4.2 DRE Simplificado
- Visão mensal de receitas e despesas
- Resultado operacional
- Comparativo com meses anteriores

### 5. Gestão de Contratos e Recorrências 🚧

#### 5.1 Contratos/Assinaturas
- **Cadastro de Contratos**: Vinculação cliente-produto com periodicidade ✅
- **Ciclo de Vida**: Ativo, Pausado, Cancelado, Expirado ✅
- **Configurações**:
  - Data de início e fim ✅
  - Valor mensal e dia de cobrança ✅
  - Reajustes automáticos por índices
  - Período de carência e fidelidade ✅
- **Geração Automática**: Criação de transações conforme periodicidade ✅
- **Notificações**: Alertas de vencimento e inadimplência

#### 5.2 Itens do Contrato ✅
- **Multi-Produto**: Contratos com múltiplos produtos/serviços ✅
- **Preços Personalizados**: Valores específicos por cliente ✅
- **Controle de Quantidade**: Unidades contratadas por item ✅

#### 5.3 Histórico de Alterações ✅
- **Auditoria Completa**: Log de todas as alterações contratuais ✅
- **Reajustes**: Histórico de aumentos e descontos aplicados
- **Pausas e Reativações**: Controle de períodos inativos ✅

#### 5.4 Relatórios de Recorrência
- **MRR (Monthly Recurring Revenue)**: Receita recorrente mensal
- **Churn Rate**: Taxa de cancelamento de contratos
- **LTV (Lifetime Value)**: Valor total por cliente
- **Previsão de Receita**: Projeções baseadas em contratos ativos

### 6. KPIs e Dashboards

#### 6.1 Indicadores Essenciais
- Faturamento mensal
- Total de despesas
- Lucro/Prejuízo
- Contas a receber em aberto
- Contas a pagar em aberto

#### 6.2 Dashboard Principal
- Gráficos de receitas vs despesas
- Evolução mensal
- Status de pagamentos
- Projeção simples

### 7. Relatórios

#### 7.1 Relatórios Básicos
- Extrato por período
- Relatório por categoria
- Relatório por cliente
- Relatório por forma de pagamento
- DRE simplificado

#### 7.2 Exportação
- Excel/CSV
- PDF para impressão

### 8. Controle de Acesso Simples ✅

- Login por email/senha ✅
- Usuários vinculados às empresas ✅
- Permissões básicas (Admin/Usuário) ✅

## Modelo de Dados Implementado

### Entidades Principais
```
- users (Usuários) ✅
- companies (Empresas) ✅
- user_companies (Vinculo usuário-empresa) ✅
- customers (Clientes) ✅
- suppliers (Fornecedores) ✅
- categories (Categorias customizáveis) ✅
- payment_methods (Formas de pagamento customizáveis) ✅
- products (Produtos/Serviços) ✅
- contracts (Contratos/Assinaturas) ✅
- contract_items (Itens do contrato) ✅
- contract_history (Histórico de alterações) ✅
- financial_entries (Lançamentos financeiros) ✅
- bank_accounts (Contas bancárias) ✅
- transfers (Transferências) ✅
- attachments (Anexos) ✅
```

### Nova Arquitetura: Contratos vs Serviços Pontuais

#### Contratos Recorrentes
```
Cliente → Contrato → Itens do Contrato → Transações Automáticas
```

#### Serviços Pontuais
```
Cliente → Produto/Serviço → Transação Manual
```

## Fluxos Principais

### 1. Setup Inicial
1. Criar conta
2. Cadastrar primeira empresa
3. Criar categorias básicas
4. Cadastrar formas de pagamento
5. Começar a lançar

### 2. Criação de Contrato Recorrente
1. Selecionar cliente existente
2. Escolher produtos/serviços para o contrato
3. Definir valor mensal e dia de cobrança
4. Configurar data de início e duração
5. Escolher categoria e forma de pagamento padrão
6. Ativar geração automática de faturas

### 3. Lançamento de Serviço Pontual
1. Selecionar ou criar cliente
2. Escolher produto/serviço ou criar personalizado
3. Informar valor e descrição
4. Escolher categoria e forma de pagamento
5. Definir data de vencimento
6. Salvar transação

### 4. Rotina Diária
1. Verificar contratos com vencimento no dia
2. Conferir transações geradas automaticamente
3. Marcar pagamentos recebidos
4. Lançar serviços pontuais
5. Conferir saldo e projeções

## Roadmap Simplificado

### Fase 1 - MVP (3 meses)
- [x] Sistema de login e empresas
- [x] Cadastros básicos (categorias, formas de pagamento, clientes)
- [x] Produtos/Serviços
- [x] Lançamentos financeiros pontuais (parcialmente implementado)
- [ ] Dashboard básico
- [ ] Relatórios essenciais

### Fase 2 - Contratos e Recorrências (2 meses)
- [x] Sistema de contratos/assinaturas
- [x] Geração automática de transações
- [x] Controle de ciclo de vida de contratos
- [ ] Relatórios de MRR e recorrência
- [ ] Notificações de vencimento

### Fase 3 - Recursos Avançados (1 mês)
- [ ] Histórico de alterações contratuais
- [ ] Reajustes automáticos
- [ ] Upload de comprovantes
- [ ] Projeções e analytics avançados
- [ ] App mobile responsivo

## Comandos de Desenvolvimento

```bash
# Instalação
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Supabase
npx supabase start
npx supabase db push

# Testes
npm run test
```

## Considerações Finais

O Finstrava será um sistema focado em simplicidade e eficiência, permitindo que empresas tenham controle financeiro sem complexidade desnecessária. As customizações de categorias e formas de pagamento garantem flexibilidade para diferentes tipos de negócio.

## Status Atual do Projeto

### ✅ Concluído:
1. Configuração do projeto Next.js com TypeScript e Tailwind
2. Integração com Supabase (auth, database, RLS)
3. Sistema de autenticação completo
4. Multi-tenancy com empresas
5. Todos os cadastros básicos:
   - Empresas com seletor de contexto
   - Categorias (receita/despesa) com subcategorias
   - Formas de pagamento personalizáveis
   - Clientes com dados completos
   - Produtos/Serviços
6. Sistema de contratos:
   - Cadastro e edição
   - Múltiplos itens por contrato
   - Controle de ciclo de vida
   - Histórico de alterações
   - Geração automática de faturas
7. Estrutura de lançamentos financeiros
8. Políticas RLS implementadas

### 🚧 Em Desenvolvimento:
1. Dashboard com KPIs
2. Lançamentos financeiros manuais
3. Visualização e gestão de faturas geradas
4. Controle de pagamentos

### 📋 Próximos Passos:
1. Implementar dashboard com indicadores principais
2. Criar tela de lançamentos financeiros
3. Implementar fluxo de caixa
4. Criar relatórios básicos (DRE, extrato)
5. Sistema de anexos/comprovantes
6. Notificações de vencimento
7. Exportação de relatórios