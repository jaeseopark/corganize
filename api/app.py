import base64
import io
import logging
import os
import json
import threading
from typing import Callable, List, Set
import uuid

import requests
from urllib.parse import urljoin
from PIL import Image

from const import IMG_DIR
from conf import get_config
from models import ConfigSaveRequest
from utils import get_old_files
from diffuse import DiffusePreset, DiffusePresetCollection

os.makedirs(IMG_DIR, exist_ok=True)

logger = logging.getLogger("corganize")
lock = threading.Lock()


def select_presets(count: int) -> List[DiffusePreset]:
    logger.info("Accessing local FS for diffusion presets...")
    collection = DiffusePresetCollection.from_dict(get_config())
    return collection.select(count)


def _diffuse(base_url: str, preset: DiffusePreset):
    logger.info(f"{preset.preset_name=}")
    logger.info(f"payload: {json.dumps(preset.payload)}")

    url = urljoin(base_url, "sdapi/v1/txt2img")
    r = requests.post(url, json=preset.payload)
    if r.status_code >= 400:
        logger.error(r.text)
    r.raise_for_status()

    for img_b64_str in r.json().get("images", []):
        filename = f"{preset.prefix}-{uuid.uuid4()}.crgimg"
        dest_path = os.path.join(IMG_DIR, filename)
        pillow_image = Image.open(
            io.BytesIO(base64.b64decode(img_b64_str)))

        img_file_buffer = io.BytesIO()
        pillow_image.save(img_file_buffer, format="jpeg",
                          quality=70, optimize=True, progressive=True)
        content_length = img_file_buffer.tell() // 1000

        with open(dest_path, 'wb') as fp:
            img_file_buffer.seek(0)
            fp.write(img_file_buffer.read())

        logger.info(f"Image saved. {content_length=} kB, {dest_path=}")

    logger.info("Generation done")


class Corganize:
    filenames_to_delete: Set[str] = set()
    config = dict(
        diffusion_enabled=True,
        notes="",
        auto_delete_days=int(os.getenv("AUTO_DELETE_DAYS", "3")),
        max_images_allowed=int(os.getenv("MAX_IMAGES_ALLOWED", "2000")),
        diffusion_url=os.getenv("DIFFUSION_URL", "").strip("/"),
        diffusion_sample_size=int(os.getenv("DIFFUSION_SAMPLE_SIZE", "4"))
    )
    _broadcast_diffusion: Callable
    _broadcast_cleanup: Callable

    def get_image_filenames(self):
        return [filename for filename in os.listdir(IMG_DIR) if filename not in self.filenames_to_delete]

    def get_recent_image_filenames(self):
        return sorted(
            self.get_image_filenames(),
            key=lambda filename: os.path.getctime(
                os.path.join(IMG_DIR, filename)),
            reverse=True
        )

    def diffuse(self):
        if not self.config["diffusion_enabled"]:
            logger.info("Diffusion disabled.")
            self.broadcast_diffusion("skipped", dict(
                message="diffusion is disabled in the app config"
            ))
            return

        logger.info("Diffusing...")

        filenames = self.get_image_filenames()
        if len(filenames) > self.config["max_images_allowed"]:
            msg = f"Library size is too big. {len(filenames)=} {self.config['max_images_allowed']=}"
            logger.info(msg)
            return

        sample_size = self.config["diffusion_sample_size"]
        presets = select_presets(sample_size)

        self.broadcast_diffusion("pending", dict(
            preset_names=[p.preset_name for p in presets],
            count=len(presets),
            sample_size=sample_size
        ))

        for preset in presets:
            self.broadcast_diffusion("processing", dict(
                preset_name=preset.preset_name,
                batch_count=preset.payload["batch_count"]
            ))
            _diffuse(self.config["diffusion_url"], preset)
            self.broadcast_diffusion("partially-done", dict(
                preset_name=preset.preset_name,
                batch_count=preset.payload["batch_count"]
            ))

        self.broadcast_diffusion("done")

    def set_config(self, config: ConfigSaveRequest):
        self.config = config.__dict__

    def delete(self, filenames: List[str]):
        lock.acquire()
        self.filenames_to_delete.update(filenames)
        lock.release()

    def cleanup(self):
        deleted_filenames = []
        lock.acquire()
        logger.info("Cleanup in progress...")
        self.broadcast_cleanup("in progress")
        old_filenames = get_old_files(
            IMG_DIR, age_seconds=self.config["auto_delete_days"]*24*3600)
        self.filenames_to_delete.update(old_filenames)
        for filename in self.filenames_to_delete:
            os.remove(os.path.join(IMG_DIR, filename))
            logger.info(f"Deleted. {filename=}")
            deleted_filenames.append(filename)
        self.filenames_to_delete.clear()
        logger.info("Cleanup done")
        self.broadcast_cleanup(
            "done",
            dict(
                filenames=deleted_filenames,
                count=len(deleted_filenames)
            )
        )
        lock.release()

    def broadcast_diffusion(self, message: dict, metadata: dict = None):
        if not self._broadcast_diffusion:
            return

        self._broadcast_diffusion(
            dict(message=message, metadata=metadata or dict()))

    def broadcast_cleanup(self, message: dict, metadata: dict = None):
        if not self._broadcast_cleanup:
            return

        self._broadcast_cleanup(
            dict(message=message, metadata=metadata or dict()))
