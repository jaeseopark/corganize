import asyncio
import json
import logging
from typing import Callable, List

from models import DeleteRequest
from fastapi import FastAPI, UploadFile, WebSocket
from fastapi.responses import FileResponse
from starlette.responses import JSONResponse
from starlette.websockets import WebSocketDisconnect

from utils import get_shuffled_copy, run_on_interval
from app import MAX_IMAGES_ALLOWED, Corganize


logger = logging.getLogger("corganize")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

fastapi_app = FastAPI()
sockets: List[WebSocket] = []
corganize = Corganize()

run_on_interval(
    corganize.generate,
    interval_seconds=60,
    initial_delay_seconds=5
)

run_on_interval(
    corganize.cleanup,
    interval_seconds=60,
    initial_delay_seconds=30
)


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


@fastapi_app.get("/images/shuffled")
def get_images():
    filenames = get_shuffled_copy(corganize.get_image_filenames())
    logger.info(f"{len(filenames)=}")
    return dict(filenames=filenames[:MAX_IMAGES_ALLOWED//3])


@fastapi_app.delete("/images")
def delete_images(body: DeleteRequest):
    corganize.delete(body.filenames)
    return JSONResponse(
        status_code=202,
        content=dict(message="submitted")
    )


@fastapi_app.get("/notes")
def get_notes():
    return dict(value=corganize.get_notes())


@fastapi_app.put("/notes")
def save_notes(body: NoteSaveRequest):
    corganize.save_notes(body.value)
    return dict(message="success")


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
        logger.error(e)
    finally:
        file.file.close()

    return dict(path=local_path)
