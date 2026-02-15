# HydroTime 💧

Um aplicativo simples e intuitivo para rastrear sua ingestão de água diária e manter-se hidratado.

## Sobre o Projeto

HydroTime é uma aplicação web desenvolvida em **React** com **TypeScript** que ajuda você a monitorar e controlar o consumo de água ao longo do dia. Com uma interface limpa e responsiva, você pode registrar sua hidratação, acompanhar seu progresso diário e visualizar estatísticas semanais.

### Características Principais

- 📊 **Rastreamento em Tempo Real** - Monitore sua ingestão de água com timestamps precisos
- 🎯 **Meta Diária Personalizável** - Defina sua meta de hidratação (padrão: 2.500 ml)
- 📈 **Gráficos Semanais** - Visualize suas estatísticas de consumo ao longo da semana
- 🌙 **Temas de Interface** - Suporte a temas claro, escuro e automático
- 🌐 **Múltiplos Idiomas** - Disponível em português (PT-BR) e inglês (EN-US)
- 💾 **Armazenamento Local** - Seus dados são salvos localmente no navegador
- 📥 **Exportação CSV** - Exporte seu histórico de consumo
- ⏱️ **Cronômetro** - Acompanhe o tempo de sua bebida
- 🔔 **Lembretes Configuráveis** - Defina intervalos de lembretes personalizados

## Tecnologias Utilizadas

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Recharts** - Biblioteca de gráficos
- **CSS** - Styling responsivo

## Como Começar

### Pré-requisitos

- Node.js 16+ instalado

### Quick Start (Desenvolvimento Local)

A forma mais rápida e profissional de executar a aplicação:

1. Clone o repositório:
   ```bash
   git clone <seu-repositorio>
   cd hydro-time
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra seu navegador e acesse `http://localhost:5173`

**Por que Vite?**
Navegadores não entendem arquivos `.tsx` nativamente. O Vite faz a transpilação instantânea com **HMR (Hot Module Replacement)**, permitindo que você veja as mudanças no código em milissegundos, sem precisar recarregar a página manualmente.

### Instalação com Docker

Alternativamente, você pode executar o projeto em um container Docker:

#### Pré-requisitos para Docker
- Docker instalado
- Docker Compose instalado (opcional, mas recomendado)

#### Desenvolvimento com Docker Compose (Recomendado)

Para desenvolvimento com hot reload automático:

1. Certifique-se de estar no diretório do projeto
2. Execute:
   ```bash
   docker-compose up
   ```
3. Abra seu navegador e acesse `http://localhost:5173`
4. Para parar a aplicação:
   ```bash
   docker-compose down
   ```

O modo desenvolvimento monta volumes que permitem hot reload - qualquer alteração no código será refletida em tempo real.

#### Produção com Docker

Para criar uma build otimizada para produção:

1. Construa a imagem de produção:
   ```bash
   docker build -t hydrotime:prod .
   ```

2. Execute o container:
   ```bash
   docker run -p 5173:5173 hydrotime:prod
   ```

3. Abra seu navegador e acesse `http://localhost:5173`

**Nota:** A build de produção:
- Compila o TypeScript e otimiza a aplicação React
- Usa um servidor leve (`serve`) para servir os arquivos estáticos
- Gera uma imagem menor e mais performática
- Não requer montar volumes do código-fonte

#### Usando Docker direto (Desenvolvimento)

Se preferir não usar Docker Compose:

```bash
docker build -f Dockerfile.dev -t hydrotime:dev .
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules hydrotime:dev
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento com hot reload
- `npm run build` - Constrói a aplicação para produção
- `npm run preview` - Pré-visualiza a build de produção localmente

## Estrutura do Projeto

```
hydro-time/
├── App.tsx                 # Componente principal da aplicação
├── index.tsx              # Ponto de entrada
├── types.ts               # Definições de tipos TypeScript
├── constants.ts           # Constantes e traduções
├── vite.config.ts        # Configuração Vite
├── tsconfig.json         # Configuração TypeScript
├── components/
│   ├── Timer.tsx         # Componente do cronômetro
│   ├── ProgressBar.tsx   # Barra de progresso diária
│   ├── HistoryList.tsx   # Histórico de registros
│   └── WeeklyChart.tsx   # Gráficos semanais
└── utils/
    ├── storage.ts        # Gerenciamento de localStorage
    └── csv.ts            # Exportação em CSV
```

## 💡 Dicas de Senior Engineer

### Verificar Tipos TypeScript
Se o VS Code estiver exibindo erros de tipos, você pode gerar/atualizar o arquivo de configuração TypeScript:

```bash
npx tsc --init
```

Este projeto já inclui um `tsconfig.json` pré-configurado, mas você pode ajustá-lo conforme necessário.

### Build para Produção
Quando estiver pronto para subir para um servidor real, use:

```bash
npm run build
```

Isso gera uma pasta `dist/` com arquivos otimizados, minificados e prontos para deployment:
- Transpilação completa de TypeScript para JavaScript
- Otimização de bundle
- Tree-shaking de código não utilizado
- Minificação de CSS e JS

### Estrutura do Projeto
- **Componentes** estão em `components/` - Componentes reutilizáveis
- **Utilitários** estão em `utils/` - Lógica compartilhada
- **Tipos** definidos em `types.ts` - Interfaces TypeScript
- **Constantes** em `constants.ts` - Configurações e traduções

### Desenvolvimento Eficiente
O HMR (Hot Module Replacement) do Vite permite que você:
- Veja mudanças em tempo real (milissegundos)
- Mantenha o estado da aplicação durante edições
- Pule recarregamentos de página desnecessários

## Como Usar

1. **Registrar Consumo** - Use os botões de rápido adição (100ml, 200ml, 300ml, 500ml) ou digite um valor customizado
2. **Acompanhar Progresso** - A barra de progresso mostra seu avanço em relação à meta diária
3. **Visualizar Histórico** - Acesse a aba "Histórico" para ver todos seus registros
4. **Estatísticas** - Confira os gráficos da semana em "Estatísticas"
5. **Configurações** - Customize sua meta, idioma, tema e lembretes
6. **Exportar Dados** - Baixe seu histórico em formato CSV

## Funcionalidades em Detalhe

### Dashboard
A tela inicial exibe:
- Barra de progresso diária
- Botões de adição rápida
- Total de ml consumido no dia
- Acesso rápido às outras seções

### Histórico
- Lista completa de todos os registros
- Data e hora de cada ingestão
- Quantidade consumida
- Duração de consumo

### Estatísticas
- Gráficos de consumo semanal
- Tendências de hidratação
- Comparação de dias

### Configurações
- Ajustar meta diária
- Selecionar idioma (PT-BR / EN-US)
- Escolher tema (Claro / Escuro / Automático)
- Configurar intervalo de lembretes

## Dados Armazenados

Os dados são armazenados localmente no seu navegador usando `localStorage`:
- Histórico de ingestões com timestamps
- Preferências de usuário (meta, idioma, tema)
- Dados não são sincronizados com servidor (100% offline)

## Contribuindo

Para contribuir com o projeto, sinta-se livre para:
1. Fazer fork do repositório
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## Licença

Este projeto está disponível sob a licença MIT.

## Suporte

Se encontrar algum problema ou tiver sugestões, por favor abra uma issue no repositório.

---

**Mantenha-se hidratado! 💧**
