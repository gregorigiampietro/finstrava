# Finstrava Design System

## Overview

Este documento define os padrões visuais e de UX do Finstrava. Siga estas diretrizes para manter consistência em toda a aplicação.

## Modal / Dialog

### Estrutura

```
┌─────────────────────────────────────────────┐
│ [Icon] Title                              X │  <- Header
├─────────────────────────────────────────────┤
│                                             │
│ SECTION LABEL                               │  <- Section header (uppercase, colored)
│                                             │
│ Field Label                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Input value                             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Field Label          Field Label            │  <- Side by side fields
│ ┌───────────────┐   ┌───────────────────┐   │
│ │ Value         │   │ Value             │   │
│ └───────────────┘   └───────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│              [Cancel]  [Primary Action]     │  <- Footer
└─────────────────────────────────────────────┘
```

### Header
- Ícone à esquerda (opcional) + Título
- Botão X para fechar no canto direito
- Sem descrição longa (manter limpo)

### Section Labels
- Texto em **UPPERCASE**
- Cor: `text-muted-foreground`
- Tamanho: `text-xs font-semibold tracking-wide`
- Espaçamento: `mt-6 mb-3` (primeira seção `mt-0`)

### Campos de Formulário

#### Labels
- Posição: Acima do input
- Tamanho: `text-sm font-medium`
- Cor: `text-foreground`

#### Inputs
- Altura: `h-10` (padrão) ou `h-11` para inputs maiores
- Border: `border border-input`
- Border Radius: `rounded-md`
- Focus: `focus:ring-2 focus:ring-ring`

#### Layout de Campos
- Campos lado a lado quando relacionados (nome + sobrenome, data início + fim)
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Full width para campos únicos importantes

### Footer / Actions
- Alinhamento: À direita (`flex justify-end gap-3`)
- Ordem: [Cancel] [Primary Action]
- Botão Cancel: `variant="outline"`
- Botão Primary: `variant="default"` com cor principal

## Cores

### Accent Colors por Contexto
- **Cliente/Usuário**: `blue-500`
- **Serviços/Produtos**: `purple-500`
- **Valores/Financeiro**: `green-500`
- **Datas/Período**: `cyan-500`
- **Configurações**: `slate-500`
- **Alertas**: `orange-500`

## Componentes

### Cards (quando necessário dentro de modais)
- Usar apenas para agrupar informações relacionadas
- Border: `border rounded-lg`
- Padding: `p-4`
- Background: `bg-muted/30` para destaque sutil

### Seleção de Opções (Tabs/Toggle)
- Usar botões com border para alternar entre opções
- Estado ativo: `border-primary bg-primary/10`
- Estado inativo: `border-muted`

### Checkboxes em Lista
- Usar SimpleCheckbox (div com ícone Check)
- Evitar componentes Radix complexos que causam re-renders

### Badges
- Para status e categorias
- Variantes: `default`, `secondary`, `outline`
- Tamanho pequeno: `text-xs`

## Espaçamento

### Dentro do Modal
- Padding geral: `p-6`
- Gap entre seções: `space-y-6`
- Gap entre campos: `gap-4`
- Gap entre label e input: `space-y-2` (via FormItem)

### Entre Elementos
- Título e primeiro campo: `mt-4`
- Entre seções: `mt-6`
- Footer: `mt-6 pt-4 border-t`

## Tipografia

### Títulos
- Modal title: `text-lg font-semibold`
- Section label: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`

### Body
- Labels: `text-sm font-medium`
- Input text: `text-sm`
- Helper text: `text-xs text-muted-foreground`

## Responsividade

### Breakpoints
- Mobile: campos em coluna única
- Tablet (md:): campos lado a lado quando apropriado
- Desktop: manter proporções consistentes

### Modal Width
- Pequeno: `max-w-md` (400px)
- Médio: `max-w-2xl` (672px)
- Grande: `max-w-4xl` (896px)
- Altura máxima: `max-h-[90vh]` com `overflow-y-auto`

## Exemplos de Uso

### Section Label
```tsx
<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
  Informações Básicas
</p>
```

### Campo Simples
```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nome do Projeto</FormLabel>
      <FormControl>
        <Input placeholder="Digite o nome..." {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Dois Campos Lado a Lado
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField ... />
  <FormField ... />
</div>
```

### Footer de Actions
```tsx
<div className="flex justify-end gap-3 pt-4 mt-6 border-t">
  <Button type="button" variant="outline" onClick={onCancel}>
    Cancelar
  </Button>
  <Button type="submit">
    Criar Projeto
  </Button>
</div>
```

## Anti-Patterns (O que NÃO fazer)

1. **Não usar** Cards com bordas coloridas laterais (border-l-4) - visual antigo
2. **Não usar** gradientes em botões ou backgrounds
3. **Não usar** muitas cores diferentes no mesmo modal
4. **Não usar** ícones em excesso
5. **Não usar** CardHeader/CardTitle para seções simples
6. **Não usar** ScrollArea quando não necessário
7. **Não usar** Checkbox do Radix (usar SimpleCheckbox para evitar bugs)

## Atualizado em
27/11/2024
