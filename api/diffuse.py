from random import shuffle
from typing import List


class DiffuseRequest:
    # See https://github.com/jaeseopark/diffusionbee-stable-diffusion-rest-api?tab=readme-ov-file#payload
    _request: dict
    _prompt_variations: List[str] = []

    def __init__(self, request: dict) -> None:
        self._request = request
        self._prompt_variations = [request["prompt"]]  # TODO: write logic here

    def to_diffbee_payload(self) -> dict:
        shuffle(self._prompt_variations)
        return {
            **self._request,
            "prompt": self._prompt_variations[0]
        }


def _expand(requests: List[dict]):
    expanded: List[DiffuseRequest] = []
    for request in requests:
        expanded.extend([DiffuseRequest(request)] * request.get("weight", 1))
    return expanded


class DiffuseRequestCollection:
    def __init__(self, requests: List[dict]):
        self.expanded_requests = _expand(requests)

    def select(self, count: int) -> List[DiffuseRequest]:
        # Shuffle in place which is fine for this use case.
        shuffle(self.expanded_requests)
        return self.expanded_requests[:count]
