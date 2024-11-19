import re
from typing import List

from utils import get_shuffled_copy


def randomize_prompt(s: str):
    matches = re.findall(r"(\([^()]+\))", s)
    for match in matches:
        candidates = match.strip("(").strip(")").split("|")
        s = s.replace(match, get_shuffled_copy(candidates)[0])
    return s


class DiffuseRequest:
    _request: dict

    def __init__(self, request: dict):
        self._request = request
        assert "prompt" in request, "'prompt' must be present"

    def to_diffbee_payload(self) -> dict:
        # See https://github.com/jaeseopark/diffusionbee-stable-diffusion-rest-api?tab=readme-ov-file#payload
        return {
            **self._request,
            "prompt": randomize_prompt(self._request["prompt"]),
            "selected_aspect_ratio": "Portrait",
            "img_width": 448,
            "img_height": 576,
            "guidance_scale": 6.5
        }


def _expand(requests: List[dict]):
    expanded: List[DiffuseRequest] = []
    for request in requests:
        if not request.get("enabled", True):
            continue
        expanded.extend([DiffuseRequest(request)] * request.get("weight", 1))
    return expanded


class DiffuseRequestCollection:
    def __init__(self, requests: List[dict]):
        self.expanded_requests = _expand(requests)

    def select(self, count: int) -> List[DiffuseRequest]:
        return get_shuffled_copy(self.expanded_requests)[:count]
