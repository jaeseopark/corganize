import asyncio
import json
import logging
from typing import Callable, List

from fastapi import FastAPI, UploadFile, WebSocket
from fastapi.responses import FileResponse
from starlette.responses import JSONResponse
from starlette.websockets import WebSocketDisconnect

logger = logging.getLogger("")
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
