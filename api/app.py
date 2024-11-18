import logging
import os
import json
from typing import List, Set
import uuid

import requests
from urllib.parse import urljoin

from utils import get_old_files
from diffuse import DiffuseRequestCollection

AUTO_DELETE_DAYS = int(os.getenv("AUTO_DELETE_DAYS", "3"))
MAX_IMAGES_ALLOWED = int(os.getenv("MAX_IMAGES_ALLOWED", "2000"))
DIFFBEE_URL = os.getenv("DIFFUSION_BEE_URL").strip("/")

DATA_DIR = "/data"
IMG_DIR = os.path.join(DATA_DIR, "images")

os.makedirs(IMG_DIR, exist_ok=True)

logger = logging.getLogger("corganize")


def select_diffuse_requests(count: int):
    with open(os.path.join(DATA_DIR, "diffuse_requests.json")) as fp:
        return DiffuseRequestCollection(json.load(fp)).select(count)


class Corganize:
    filenames_to_delete: Set[str] = set()

    def get_image_filenames(self):
        return [filename for filename in os.listdir(IMG_DIR) if filename not in self.filenames_to_delete]

    def generate(self):
        logger.info("Generating...")

        filenames = self.get_image_filenames()
        if len(filenames) > MAX_IMAGES_ALLOWED:
            msg = f"Library size is too big. {len(filenames)=} {MAX_IMAGES_ALLOWED=}"
            logger.info(msg)
            return

        diffuse_requests = select_diffuse_requests(1)

        for diffuse_request in diffuse_requests:
            url = urljoin(DIFFBEE_URL, "generate/single")
            r = requests.post(url, json=diffuse_request.to_diffbee_payload())
            r.raise_for_status()

            image_path = os.path.join(IMG_DIR, f"{uuid.uuid4()}.crgimg")
            with open(image_path, "wb") as fp:
                fp.write(r.content)

            content_length = int(r.headers.get("Content-Length"))//1000
            logger.info(f"Image saved. {content_length=} kB, {image_path=}")

    def delete(self, filenames: List[str]):
        # TODO: critical section implementation
        self.filenames_to_delete.update(filenames)

    def cleanup(self):
        logger.info("Cleanup in progress...")
        old_filenames = get_old_files(IMG_DIR, age_seconds=AUTO_DELETE_DAYS*24*3600)
        self.filenames_to_delete.update(old_filenames)
        for filename in self.filenames_to_delete:
            os.remove(os.path.join(IMG_DIR, filename))
            logger.info(f"deleted. {filename=}")
        self.filenames_to_delete.clear()
        logger.info("Cleanup done")
