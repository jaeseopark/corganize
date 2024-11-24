# built in deps
import uuid
from datetime import datetime, timedelta
from typing import Callable, Dict

# 3rd party deps
import jwt
import pyotp

# local deps
from conf import get_config


# Resets after a restart which is fine.
JWT_REGISTRY = dict()
JWT_KEY = str(uuid.uuid4())
JWT_ALG = "HS256"


def _create_jwt_token(expires_delta: timedelta):
    expiration = datetime.now() + expires_delta
    payload = {
        "sub": "1",  # Just one user
        "exp": expiration,
        "type": "bearer"
    }
    return jwt.encode(payload, JWT_KEY, algorithm=JWT_ALG)


def decode_jwt(token):
    return jwt.decode(token, JWT_KEY, algorithms=[JWT_ALG])


def _verify_totp(auth_config: dict, payload: dict):
    token = payload["token"]
    key = auth_config.get("totp", {}).get("key", "")
    totp = pyotp.TOTP(key)
    if totp.verify(token):
        return True
    return False


AUTH_VERIFIERS: Dict[str, Callable[[dict, dict], bool]] = dict(
    totp=_verify_totp
)


def get_jwt(payload: dict, expires_delta: timedelta):
    """
    Meant for 1 or 2 active keys, no need to maintain a whole DB for it.
    """
    auth_config = get_config()["auth"]
    authenticated = not auth_config["enabled"] or AUTH_VERIFIERS.get(
        auth_config.get("type", ""), lambda _: False)(auth_config, payload)

    if not authenticated:
        return None

    return _create_jwt_token(expires_delta)
