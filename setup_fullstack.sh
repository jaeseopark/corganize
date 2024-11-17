#!/bin/bash

mkdir -p nginx/templates api ui mnt/log mnt/data db/initdb.d

cat <<EOF >api/requirements.txt
fastapi==0.103.1
websockets==11.0.3
uvicorn==0.23.2
python-multipart==0.0.9
psycopg2-binary
EOF

cat <<EOF >api/Dockerfile
FROM python:3-slim
RUN apt-get update && apt-get upgrade -y
WORKDIR /app
COPY ./requirements.txt requirements.txt
RUN pip install -r requirements.txt
EOF

echo "venv/" >api/.dockerignore

cat <<EOF >api/main.py
import asyncio
import json
import logging
from typing import Callable, List

from fastapi import FastAPI, UploadFile, WebSocket
from fastapi.responses import FileResponse
from starlette.responses import JSONResponse
from starlette.websockets import WebSocketDisconnect

logger = logging.getLogger("${APP_NAME}")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

fastapi_app = FastAPI()
sockets: List[WebSocket] = []


@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Socket open")
    sockets.append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        sockets.remove(websocket)
        logger.info("Socket closed")


def get_broadcast_function(topic: str) -> Callable[[dict], None]:
    def broadcast(payload: dict) -> None:
        async def broadcast_async():
            for socket in sockets:
                await socket.send_text(json.dumps(dict(
                    topic=topic,
                    payload=payload
                )))
        asyncio.run(broadcast_async())
    return broadcast


@fastapi_app.exception_handler(AssertionError)
def unicorn_exception_handler(_, e: AssertionError):
    return JSONResponse(
        status_code=400,
        content=dict(message=str(e))
    )


@fastapi_app.exception_handler(NotImplementedError)
def unicorn_exception_handler(*args, **kwargs):
    return JSONResponse(
        status_code=500,
        content=dict(message="Not implemented")
    )


@fastapi_app.get("/stuff")
def get_stuff():
    return dict(stuff=[
        1, 2, 3
    ])

@fastapi_app.get("/file", response_class=FileResponse)
def get_file():
    local_path = "/data/some_file.pdf"
    return local_path


@fastapi_app.post("/file")
def upload_file(file: UploadFile):
    local_path = "/data/some_file"
    try:
        contents = file.file.read()
        with open(local_path, 'wb+') as f:
            f.write(contents)
    except Exception as e:
        print(e)
    finally:
        file.file.close()

    return dict(path=local_path)
EOF

cat <<EOF >api/db.py
import psycopg2
import os

password=os.getenv("POSTGRES_PASSWORD")
connection = psycopg2.connect(database="postgres", user="postgres", password=password, host="db", port=5432)

cursor = connection.cursor()

cursor.execute("SELECT * from portal.portal_users;")

# Fetch all rows from database
record = cursor.fetchall()

print("Data from Database:- ", record)
EOF

cat <<EOF >nginx/templates/dev.conf.template
upstream ui {
    server ui;
}

upstream api {
    server api;
}

server {
    listen 80;

    location / {
        proxy_pass http://ui;
    }

    location /api/ {
        rewrite /api/(.*) /$1 break;
        proxy_pass http://api;

        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

cat <<EOF >docker-compose.yml
version: "3"
services:
  nginx:
    image: nginx
    volumes:
      - ./nginx/templates/dev.conf.template:/etc/nginx/templates/default.conf.template:ro
    ports:
      - "${2}:80"
    depends_on:
      - "ui"
      - "api"
    environment:
      TZ: America/Denver
  ui:
    image: node:21
    working_dir: /app/ui
    command: sh -c "yarn install && yarn dev"
    volumes:
      - ./ui:/app/ui
    environment:
      TZ: America/Denver
  api:
    image: ${1}:latest
    build:
      context: api
    working_dir: /app/api
    stop_signal: SIGINT # https://github.com/docker/compose/issues/4199#issuecomment-426109482
    command: uvicorn main:fastapi_app --reload --host 0.0.0.0 --port 80
    volumes:
      - ./api:/app/api
      - ./mnt/data:/data
      - ./mnt/log:/var/log/${1}/api
    environment:
      TZ: America/Denver
      POSTGRES_PASSWORD: CHANGEME
  db:
    image: postgres:16
    restart: always
    shm_size: 128mb #shared memory size
    environment:
      POSTGRES_PASSWORD: CHANGEME
    volumes:
      - ./db/initdb.d:/docker-entrypoint-initdb.d/:ro
      - ./mnt/data/postgres:/var/lib/postgresql/data
EOF

cat <<EOF >setup_ui.sh
yarn create vite ui --template preact-ts
cd ui
yarn add sass prettier @trivago/prettier-plugin-sort-imports vite-tsconfig-paths --dev
yarn add react-router-dom preact-compat reconnecting-websocket uuid @chakra-ui/react @emotion/react @emotion/styled framer-motion
yarn install
cd ..

cat <<EOFF > ui/vite.config.ts
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), tsconfigPaths()],
  server: {
    host: "0.0.0.0",
    port: 80,
  }
});
EOFF

cat <<EOFF > ui/tsconfig.abspath.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
EOFF

cat <<EOFF > ui/tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.abspath.json"}
  ]
}
EOFF

cat <<EOFF > ui/.prettierrc.yaml
plugins:
  - "@trivago/prettier-plugin-sort-imports"
printWidth: 120
singleQuote: false
importOrder:
  - "\\/.*types$"
  - "\\/.*state$"
  - "\\/.*apiclient$"
  - ".*\\/utilities\\/.*"
  - "^[.].*(?<!css)$" # relative dependencies (except css)
  - ".*css$" # CSS files
importOrderSeparation: true
importOrderSortSpecifiers: true
EOFF

cat <<EOFF > ui/src/app.tsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./app.css";

function Home() {
  return (
    <>
      <h1>Vite + Preact</h1>
      <p>Read!</p>
    </>
  );
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
EOFF

cat <<EOFF > ui/src/main.tsx
import { Provider } from "@/components/ui/provider";
import { render } from "preact";
import { StrictMode } from "preact/compat";

import App from "./app";

render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
  document.getElementById("app")!,
);
EOFF

cd ui
npx @chakra-ui/cli snippet add
rm ./src/index.css ./src/assets/preact.svg
> ./src/app.css
EOF

cat <<EOF >db/init.sql
--PLACEHOLDER
EOF

cat <<EOF >.gitignore
mnt/
node_modules/
*.pyc
EOF

docker run -v "$(pwd):/init" -w /init node:latest /bin/bash setup_ui.sh
rm setup_ui.sh

echo "Congrats, the new repo has been setup! Next, run:"
echo "  sudo chown $(whoami):$(whoami) -R * .gitignore"
echo "  docker-compose up --build"
