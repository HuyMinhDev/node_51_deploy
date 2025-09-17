FROM node:18.20.8-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# xoá các thư viện nằm trong devDependencies
# vì các thư viện devDependencies chỉ sử dụng khi chúng ta dev
RUN npm prune --production


FROM node:18.20.8-alpine AS start

WORKDIR /app

COPY --from=build ./app/dist ./dist
COPY --from=build ./app/generated ./generated
COPY --from=build ./app/node_modules ./node_modules

CMD ["node", "dist/main"]