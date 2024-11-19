import io
import logging
import os
import json
import threading
from typing import List, Set
import uuid
import zipfile

import requests
from urllib.parse import urljoin

from utils import get_old_files
from diffuse import DiffuseRequestCollection

AUTO_DELETE_DAYS = int(os.getenv("AUTO_DELETE_DAYS", "3"))
MAX_IMAGES_ALLOWED = int(os.getenv("MAX_IMAGES_ALLOWED", "2000"))
DIFFUSE_BATCH_SIZE = int(os.getenv("DIFFUSE_BATCH_SIZE", "4"))
DIFFBEE_URL = os.getenv("DIFFUSION_BEE_URL").strip("/")

DATA_DIR = "/data"
IMG_DIR = os.path.join(DATA_DIR, "images")

os.makedirs(IMG_DIR, exist_ok=True)

logger = logging.getLogger("corganize")
lock = threading.Lock()


def select_diffuse_request():
    with open(os.path.join(DATA_DIR, "diffuse_requests.json")) as fp:
        return DiffuseRequestCollection(json.load(fp)).select(1)[0]


class Corganize:
    filenames_to_delete: Set[str] = set()
    notes: str = ""

    def get_image_filenames(self):
        return [filename for filename in os.listdir(IMG_DIR) if filename not in self.filenames_to_delete]

    def get_recent_image_filenames(self):
        return sorted(
            self.get_image_filenames(), 
            key=lambda filename: os.path.getctime(os.path.join(IMG_DIR, filename)),
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
        payload = diffuse_request.to_diffbee_payload(num_imgs=DIFFUSE_BATCH_SIZE)
        r = requests.post(urljoin(DIFFBEE_URL, "generate"), json=payload)
        r.raise_for_status()

        zip_data = io.BytesIO(r.content)
        with zipfile.ZipFile(zip_data, 'r') as zf:
            for arcname in zf.namelist():
                dest_path = os.path.join(IMG_DIR, f"{diffuse_request.prefix}-{uuid.uuid4()}.crgimg")
                with zf.open(arcname) as img_buffer, open(dest_path, 'wb') as fp:
                    fp.write(img_buffer.read())
                    content_length = img_buffer.tell()//1000
                    logger.info(f"Image saved. {content_length=} kB, {dest_path=}")

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
        old_filenames = get_old_files(IMG_DIR, age_seconds=AUTO_DELETE_DAYS*24*3600)
        self.filenames_to_delete.update(old_filenames)
        for filename in self.filenames_to_delete:
            os.remove(os.path.join(IMG_DIR, filename))
            logger.info(f"Deleted. {filename=}")
        self.filenames_to_delete.clear()
        logger.info("Cleanup done")
        lock.release()
