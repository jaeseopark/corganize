# Python builtin deps
import asyncio
from datetime import timedelta
import json
import logging
from typing import Callable, List

# 3rd party deps
import jwt

from fastapi import FastAPI, UploadFile, WebSocket, status, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi_jwt_auth import AuthJWT
from fastapi_jwt_auth.exceptions import AuthJWTException
from starlette.responses import JSONResponse
from starlette.websockets import WebSocketDisconnect

# Local deps
from conf import backup_config
from app import Corganize
from auth import JWT_KEY, decode_jwt, get_jwt
from models import DeleteRequest, ConfigSaveRequest, Token
from utils import get_shuffled_copy, run_on_interval, run_back_to_back

FETCH_LIMIT = 250

logger = logging.getLogger("corganize")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

fastapi_app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
sockets: List[WebSocket] = []


@AuthJWT.load_config
def get_ws_auth_config():
    from pydantic import BaseModel

    class Settings(BaseModel):
        authjwt_secret_key: str = JWT_KEY

    return Settings()


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


corganize = Corganize()
corganize._broadcast_cleanup = get_broadcast_function("cleanup")
corganize._broadcast_diffusion = get_broadcast_function("diffusion")

run_back_to_back(
    corganize.diffuse,
    pause_seconds=30,  # Let server cool down for 30 s before the next request
    initial_delay_seconds=5
)

run_on_interval(
    corganize.cleanup,
    interval_seconds=60,
    initial_delay_seconds=30
)


def verify_jwt_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_jwt(token)
        if "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT token")


@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), Authorize: AuthJWT = Depends()):
    await websocket.accept()
    logger.info("Socket open")

    try:
        Authorize.jwt_required("websocket", token=token)
    except AuthJWTException as err:
        logger.error(err)
        await websocket.close()
        return

    sockets.append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        sockets.remove(websocket)
        logger.info("Socket closed")


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
def get_images(_: dict = Depends(verify_jwt_token)):
    filenames = get_shuffled_copy(corganize.get_image_filenames())
    logger.info(f"{len(filenames)=}")
    return dict(filenames=filenames[:FETCH_LIMIT])


@fastapi_app.get("/images/recent")
def get_recent_images(_: dict = Depends(verify_jwt_token)):
    filenames = corganize.get_recent_image_filenames()
    logger.info(f"{len(filenames)=}")
    return dict(filenames=filenames[:FETCH_LIMIT])


@fastapi_app.delete("/images")
def delete_images(body: DeleteRequest, _: dict = Depends(verify_jwt_token)):
    corganize.delete(body.filenames)
    return JSONResponse(
        status_code=202,
        content=dict(message="submitted")
    )


@fastapi_app.get("/envvars")
def get_envvars(_: dict = Depends(verify_jwt_token)):
    return corganize.envvars


@fastapi_app.put("/envvars")
def save_envvars(body: ConfigSaveRequest, _: dict = Depends(verify_jwt_token)):
    corganize.override_envvars(body)
    return dict(message="success")


@fastapi_app.post("/config/backup")
def _backup_config(_: dict = Depends(verify_jwt_token)):
    backup_config()
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


# Endpoint to receive the TOTP token, validate it, and return a JWT token
@fastapi_app.post("/token", response_model=Token)
async def login(payload: dict):
    access_token = get_jwt(payload, timedelta(days=7))
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TOTP token",
        )

    return {"access_token": access_token, "token_type": "bearer"}
