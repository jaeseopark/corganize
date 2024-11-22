import base64
import io
import logging
import os
import json
import threading
from typing import List, Set
import uuid

import requests
from urllib.parse import urljoin
from PIL import Image

from utils import get_old_files
from diffuse import DiffuseRequestCollection

AUTO_DELETE_DAYS = int(os.getenv("AUTO_DELETE_DAYS", "30"))
MAX_IMAGES_ALLOWED = int(os.getenv("MAX_IMAGES_ALLOWED", "2000"))
DF_URL = os.getenv("DF_URL", "").strip("/")

DATA_DIR = "/data"
IMG_DIR = os.path.join(DATA_DIR, "images")

os.makedirs(IMG_DIR, exist_ok=True)

logger = logging.getLogger("corganize")
lock = threading.Lock()


def select_diffuse_request():
    logger.info("Accessing local FS for diffusion presets...")
    collection = DiffuseRequestCollection.from_dir(
        os.path.join(DATA_DIR, "diffusion"))
    selected_preset = collection.select(1)[0]
    logger.info(f"{selected_preset.preset_name=}")
    return selected_preset


class Corganize:
    filenames_to_delete: Set[str] = set()
    notes: str = ""

    def get_image_filenames(self):
        return [filename for filename in os.listdir(IMG_DIR) if filename not in self.filenames_to_delete]

    def get_recent_image_filenames(self):
        return sorted(
            self.get_image_filenames(),
            key=lambda filename: os.path.getctime(
                os.path.join(IMG_DIR, filename)),
            reverse=True
        )

    def generate(self):
        logger.info("Generating...")

        filenames = self.get_image_filenames()
        if len(filenames) > MAX_IMAGES_ALLOWED:
            msg = f"Library size is too big. {len(filenames)=} {MAX_IMAGES_ALLOWED=}"
            logger.info(msg)
            return

        diffuse_request = select_diffuse_request()

        logger.info(f"payload: {json.dumps(diffuse_request.payload)}")

        url = urljoin(DF_URL, "sdapi/v1/txt2img")
        r = requests.post(url, json=diffuse_request.payload)
        if r.status_code >= 400:
            logger.error(r.text)
        r.raise_for_status()

        for img_b64_str in r.json().get("images", []):
            filename = f"{diffuse_request.prefix}-{uuid.uuid4()}.crgimg"
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

    def delete(self, filenames: List[str]):
        lock.acquire()
        self.filenames_to_delete.update(filenames)
        lock.release()

    def get_notes(self):
        return self.notes

    def save_notes(self, value: str):
        self.notes = value

    def cleanup(self):
        lock.acquire()
        logger.info("Cleanup in progress...")
        old_filenames = get_old_files(
            IMG_DIR, age_seconds=AUTO_DELETE_DAYS*24*3600)
        self.filenames_to_delete.update(old_filenames)
        for filename in self.filenames_to_delete:
            os.remove(os.path.join(IMG_DIR, filename))
            logger.info(f"Deleted. {filename=}")
        self.filenames_to_delete.clear()
        logger.info("Cleanup done")
        lock.release()
