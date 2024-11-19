import re
from typing import Any, List

from utils import get_shuffled_copy

MAX_PRESET_LEN = 30
KEY_BLACKLIST = set(["type", "notes", "weight"])


def randomize(s: Any):
    if isinstance(s, str):
        matches = re.findall(r"(\[[^()]+\])", s)
        for match in matches:
            candidates = match.strip("[").strip("]").split("|")
            s = s.replace(match, get_shuffled_copy(candidates)[0])
    return s


class DiffuseRequest:
    _request: dict

    def __init__(self, request: dict):
        self._request = request
        assert "prompt" in request, "'prompt' must be present"

    @property
    def prefix(self) -> str:
        return re.sub(r'[^a-zA-Z0-9]', '-', self._request["preset_name"])[:MAX_PRESET_LEN].strip("-")

    def to_diffbee_payload(self, num_imgs=1) -> dict:
        # See https://github.com/jaeseopark/diffusionbee-stable-diffusion-rest-api?tab=readme-ov-file#payload
        return {
            **{k: randomize(v) for k, v in self._request.items() if k not in KEY_BLACKLIST},
            "selected_aspect_ratio": "Portrait",
            "img_width": 448,
            "img_height": 576,
            "num_imgs": num_imgs
        }


def _expand(requests: List[dict]):
    global_request, * \
        _ = [r for r in requests if r.get("type") == "global"] or [{}]

    expanded: List[DiffuseRequest] = []
    for request in requests:
        if request.get("type") == "global" or not request.get("enabled", True):
            continue
        expanded.extend(
            [DiffuseRequest({**global_request, **request})] * request.get("weight", 1))
    return expanded


class DiffuseRequestCollection:
    def __init__(self, requests: List[dict]):
        self.expanded_requests = _expand(requests)

    def select(self, count: int) -> List[DiffuseRequest]:
        return get_shuffled_copy(self.expanded_requests)[:count]
