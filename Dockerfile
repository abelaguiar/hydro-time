# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código-fonte
COPY . .

# Fazer build da aplicação
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Instalar servidor de produção leve
RUN npm install -g serve

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 5173

# Comando para servir em produção
CMD ["serve", "-s", "dist", "-l", "5173"]
