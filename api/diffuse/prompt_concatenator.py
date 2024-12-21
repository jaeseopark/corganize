import json
from typing import Callable, List, Union
from random import choices, uniform

from utils import find_duplicates


def _randomize_lora(loras: List[dict]) -> List[dict]:
    ret_loras = []
    for lora in loras:
        if "one_of" in lora:
            candidates: List[dict] = lora["one_of"]
            lora = choices(candidates, k=1)[0]
        assert isinstance(lora, dict), f"lora must be a dictionary, {lora=}"
        ret_loras.append({**lora})
    return ret_loras


def _randomize_weights(loras: List[dict]) -> List[dict]:
    """
    Converts weight=[float, float] to a single float.
    """

    # make a copy
    loras = json.loads(json.dumps(loras))

    for lora in loras:
        weight = lora.get("weight")
        if not isinstance(weight, list):
            continue

        assert len(weight) == 2, "a weight range must be 2"
        picked_weight = uniform(weight[0], weight[1])
        lora["weight"] = picked_weight

    return loras


def _get_lora_tags(loras: List[dict]) -> str:
    loras = _randomize_lora(loras)  # process "one_of"s
    loras = _randomize_weights(loras)  # process weight ranges

    # A little set of validations
    for lora in loras:
        assert "alias" in lora, f"'alias' must be set {lora=}"
        assert "weight" in lora, f"'weight' must be set {lora=}"

    aliases = [lora["alias"] for lora in loras]
    dups = find_duplicates(aliases)
    assert len(dups) == 0, f"duplicate loras should not exist {dups=}"

    def get_tag(lora: dict):
        return f"<lora:{lora['alias']}:{lora['weight']}>"
    return "".join(map(get_tag, loras))


class PromptConcatenator:
    def __init__(self, resolve: Callable) -> None:
        self.resolve = resolve

    def select_and_resolve(self, kw: Union[dict, str]):
        def select():
            if isinstance(kw, dict):
                assert "one_of" in kw, f"'one_of' needs to be present {kw=}"
                return choices(kw["one_of"], k=1)[0]
            return kw

        return self.resolve(select())

    def concatenate(self, prompt_elements: Union[List[str], None], prompt: str, loras: Union[List[dict], None]) -> str:
        kws = [self.select_and_resolve(kw) for kw in prompt_elements or []]
        prompt = ",".join([kw for kw in kws if kw] + [prompt])
        return self.resolve(prompt) + _get_lora_tags(loras or [])
