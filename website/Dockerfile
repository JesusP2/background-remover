FROM node:20.17

WORKDIR /usr/dir/app

COPY package.json ./

RUN corepack enable && corepack prepare pnpm@latest-9 --activate && pnpm install

USER node

COPY --chown=node:node . .

CMD ["pnpm", "start"]
