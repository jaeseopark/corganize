from random import choices, randint, uniform
import re
from typing import Callable, List
import json

from diffuse.template_consumer import TemplateConsumer
from diffuse.randomizer import Randomizer


MAX_FILENAME_LEN = 64

randomize = Randomizer.apply


def get_resolve_func(prompt_lookup: dict):
    def _resolve(prompt: str):
        prompt = randomize(prompt)
        matches = re.findall(r"(\/[a-zA-Z0-9_]+)", prompt)
        for match in matches:
            key = match.strip("/")
            if key in prompt_lookup:
                resolved = _resolve(prompt_lookup[key])
                prompt = prompt.replace(match, resolved, 1)

        return prompt

    return _resolve


def _randomize_weights(loras: List[dict]):
    if not loras:
        return []

    def randomize_lora(loras: list):
        ret_loras = []
        for lora in loras:
            if "one_of" in lora:
                candidates: List[dict] = lora["one_of"]
                lora = choices(candidates, k=1)
            ret_loras.append(lora)
        return ret_loras

    for lora in randomize_lora(loras):
        weight = lora.get("weight")
        if not isinstance(weight, list):
            continue

        assert len(weight) == 2, "a weight range must be 2"
        picked_weight = uniform(weight[0], weight[1])
        lora["weight"] = picked_weight


def _get_lora_tags(loras: List[dict]) -> str:
    loras = loras or []

    aliases = [lora["alias"] for lora in loras]
    msg = "duplicate loras should not exist"
    assert len(aliases) == len(set(aliases)), msg

    def get_tag(lora: dict):
        return f"<lora:{lora['alias']}:{lora['weight']}>"
    return "".join(map(get_tag, loras))


def _concatenate(prompt_elements: List[str], prompt: str, loras: List[str], resolve: Callable) -> str:
    kws = [resolve(kw) for kw in prompt_elements or []]
    prompt = ",".join([kw for kw in kws if kw] + [prompt])
    return resolve(prompt) + _get_lora_tags(loras)


def _get_req_body(preset: dict, conf: dict) -> dict:
    """
    See https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API
    """
    allowed_keys = conf.get("allowed_keys")
    resolve = get_resolve_func(conf.get("saved_prompts"))
    template_consumer = TemplateConsumer(conf.get("templates"), resolve)
    preset = template_consumer.consume(preset)

    assert preset.get("model"), "'model' must be set"

    preset["prompt"] = _concatenate(
        preset.get("prompt_elements"),
        preset.get("prompt"),
        _randomize_weights(preset.get("loras")),
        resolve
    )

    return {
        **{k: randomize(v) for k, v in preset.items() if allowed_keys is None or k in allowed_keys},
        "seed": randint(0, 2**32 - 1)
    }


class DiffusePreset:
    _specs: dict
    _conf: dict
    next = None  # type: DiffusePreset
    should_rediffuse: bool = False

    def __init__(self, preset: dict, conf: dict):
        conf = conf or dict()

        preset = json.loads(json.dumps(preset))
        preset["prompt"] = preset.get("prompt", "")
        assert isinstance(preset["prompt"], str), "prompt must be a string"

        # In the order of descreasing importance
        # The latter 2 are just for inheritance purposes, so they can be put at the end.
        # TODO support dictionary here, for now just put an assert statement
        templates = preset.get("templates", [])
        assert isinstance(templates, list), "'templates' must be a list"
        preset["templates"] = templates + ["default"]

        self._specs = preset
        self._conf = conf
        self.should_rediffuse = preset.get("rediffuse") is True

        next = preset.get("next")
        if next:
            self.next = DiffusePreset(next, conf)

    def get_req_body(self):
        return _get_req_body(self._specs, self._conf)

    @property
    def preset_name(self) -> str:
        return self._specs.get("preset_name")
