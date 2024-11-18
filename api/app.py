import os
import json
import uuid

import requests
from urllib.parse import urljoin

from diffuse import DiffuseRequestCollection

MAX_IMAGES_ALLOWED = 10000
DIFFBEE_URL = os.getenv("DIFFUSION_BEE_URL").strip("/")
DATA_DIR = "/data"
IMG_DIR = os.path.join(DATA_DIR, "images")

os.makedirs(IMG_DIR, exist_ok=True)


def select_diffuse_requests(count: int):
    # TODO: move this to DB
    with open(os.path.join(DATA_DIR, "diffuse_requests.json")) as fp:
        return DiffuseRequestCollection(json.load(fp)).select(count)


class Corganize:
    # It does straight read/write operations on the local fs for now.
    # Add Postgres calls in the future

    def get_image_filenames(self):
        return os.listdir(IMG_DIR)

    def generate(self):
        print("Generating...")

        # TODO: disk space check
        if len(self.get_image_filenames()) > MAX_IMAGES_ALLOWED:
            return

        diffuse_requests = select_diffuse_requests(1)

        for diffuse_request in diffuse_requests:
            url = urljoin(DIFFBEE_URL, "generate/single")
            r = requests.post(url, json=diffuse_request.to_diffbee_payload())
            r.raise_for_status()

            image_path = os.path.join(IMG_DIR, f"{uuid.uuid4()}.crgimg")
            with open(image_path, "wb") as fp:
                fp.write(r.content)

            print(f"Image saved. {image_path=}")
