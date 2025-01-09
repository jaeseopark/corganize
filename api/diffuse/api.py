from typing import Callable
from diffuse.preset import DiffusePreset
from const import IMG_DIR
from PIL import Image
from urllib.parse import urljoin
import requests
import base64
import io
import logging
import os
import json
import threading
import re
import json

from utils import get_epoch_millis

MAX_FILENAME_LEN = 64
REDIFFUSE_DEFAULT_DENOISING_STRENGTH = 0.35

MODELS_PATH = "sdapi/v1/sd-models"
OPTIONS_PATH = "sdapi/v1/options"
REFESH_LORAS_PATH = "sdapi/v1/refresh-loras"
TXT2IMG_PATH = "sdapi/v1/txt2img"
IMG2IMG_PATH = "sdapi/v1/img2img"

os.makedirs(IMG_DIR, exist_ok=True)

logger = logging.getLogger("corganize")
lock = threading.Lock()


def t2i_req_body_provider(preset: DiffusePreset):
    return preset.get_req_body()


def get_i2i_req_body_provider(img_b64: str):
    def provider(preset: DiffusePreset):
        req_body = preset.get_req_body()
        assert "denoising_strength" in req_body, "denoising_strength must be set"
        req_body.update(dict(
            init_images=[img_b64]
        ))
        return req_body

    return provider


def get_rediffuse_req_body_provider(org_req_body: dict, img_b64: str):
    def provider(_):
        # Note: not calling preset.get_req_body()
        # Just reusing the old req body.
        req_body = json.loads(json.dumps(org_req_body))
        req_body.update(dict(
            init_images=[img_b64],
            denoising_strength=REDIFFUSE_DEFAULT_DENOISING_STRENGTH,
            alwayson_scripts=dict(
                ADetailer=dict(
                    args=[dict(ad_model="face_yolov8n.pt")]
                )
            )
        ))
        return req_body

    return provider


class DiffuseApiPayload:
    preset: DiffusePreset
    preset_name: str
    api_path: str
    req_body: dict
    _timestamp: int

    def __init__(self, preset: DiffusePreset, req_body_provider: Callable = None, api_path: str = None, preset_name_override: str = None):
        self.preset = preset
        self.api_path = api_path or TXT2IMG_PATH
        self.req_body = (req_body_provider or t2i_req_body_provider)(preset)
        self._timestamp = get_epoch_millis()
        self.preset_name = preset_name_override or preset.preset_name

    @property
    def has_next(self):
        return self.preset and self.preset.next

    @property
    def should_rediffuse(self):
        return self.preset and self.preset.should_rediffuse

    @property
    def basename(self):
        pname = self.preset_name
        assert pname, "'preset_name' must exist"
        bn = re.sub(r'[^a-zA-Z0-9]', '-', pname)
        return f"{bn[:MAX_FILENAME_LEN]}-{self._timestamp}"

    def get_next_payload(self, b64_img: str):
        return DiffuseApiPayload(
            api_path=IMG2IMG_PATH,
            preset=self.preset.next,
            req_body_provider=get_i2i_req_body_provider(b64_img),
            preset_name_override=self.preset_name
        )

    def get_rediffuse_payload(self, org_req_body: dict, b64_img: str):
        return DiffuseApiPayload(
            api_path=IMG2IMG_PATH,
            preset=None,
            req_body_provider=get_rediffuse_req_body_provider(
                org_req_body, b64_img),
            preset_name_override=self.preset_name
        )


def _set_model_checkpoint(base_url: str, desired_model_name: str):
    def get_checkpoint_name():
        r = requests.get(urljoin(base_url, MODELS_PATH))
        r.raise_for_status()
        return [m["title"] for m in r.json() if m["model_name"] == desired_model_name][0]

    try:
        desired_checkpoint = get_checkpoint_name()
    except:
        msg = f"Model/checkpoint not found: {desired_model_name=}"
        logger.error(msg)
        raise RuntimeError(msg)

    url = urljoin(base_url, OPTIONS_PATH)
    r = requests.get(url)
    r.raise_for_status()
    rjson: dict = r.json()

    current_checkpoint = rjson.get("sd_model_checkpoint")

    msg = f"{desired_model_name=} {desired_checkpoint=} {current_checkpoint=}"
    logger.info(msg)

    if current_checkpoint == desired_checkpoint:
        logger.info("No need to change checkpoint")
        return

    r = requests.post(url, json=dict(
        sd_model_checkpoint=desired_checkpoint
    ))
    if r.status_code >= 400:
        logger.error(r.text)
    r.raise_for_status()


def diffuse(base_url: str, api_payload: DiffuseApiPayload):
    basename = api_payload.basename
    req_body = api_payload.req_body

    with open(os.path.join(IMG_DIR, f"{basename}.json"), "w") as fp:
        json.dump(req_body, fp, indent=2)

    _set_model_checkpoint(base_url, req_body["model"])

    url = urljoin(base_url, api_payload.api_path)
    r = requests.post(url, json=req_body)
    if r.status_code >= 400:
        logger.error(r.text)
    r.raise_for_status()

    for i, img_b64_str in enumerate(r.json().get("images", [])):
        if api_payload.has_next:
            logger.info("Next preset found. Calling diffuse again...")
            next_payload = api_payload.get_next_payload(img_b64_str)
            return diffuse(base_url, next_payload)
        if api_payload.should_rediffuse:
            logger.info("Rediffuse flag found. Calling diffuse again...")
            rediffuse_payload = api_payload.get_rediffuse_payload(
                req_body, img_b64_str)
            return diffuse(base_url, rediffuse_payload)

        img_file_buffer = io.BytesIO()
        pillow_image = Image.open(io.BytesIO(base64.b64decode(img_b64_str)))
        pillow_image.save(
            img_file_buffer,
            format="jpeg",
            quality=70,
            optimize=True,
            progressive=True
        )
        content_length = img_file_buffer.tell() // 1000

        img_path = os.path.join(IMG_DIR, f"{basename}-{i}.crgimg")
        with open(img_path, 'wb') as fp:
            img_file_buffer.seek(0)
            fp.write(img_file_buffer.read())

        logger.info(f"Image saved. {content_length=} kB, {img_path=}")
