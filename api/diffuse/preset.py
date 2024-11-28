from random import choices, randint, uniform
import re
from typing import List
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


def randomize_lora(loras: list):
    ret_loras = []
    for lora in loras:
        if "one_of" in lora:
            candidates: List[dict] = lora["one_of"]
            lora = choices(candidates, k=1)
        ret_loras.append(lora)
    return ret_loras


def _validate_final_req_body(req_body: dict):
    def _check_loras():
        aliases = [lora["alias"] for lora in req_body.get("loras", [])]
        msg = "duplicate loras should not exist"
        assert len(aliases) == len(set(aliases)), msg

    _check_loras()
    assert req_body.get("batch_count", 1) == 1, "'batch_count' should be 1"
    assert req_body.get("model"), "'model' must be set"


def _get_req_body(preset: dict, conf: dict) -> dict:
    """
    See https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API
    """
    resolve = get_resolve_func(conf.get("saved_prompts"))
    template_consumer = TemplateConsumer(conf.get("templates"), resolve)
    preset = template_consumer.consume(preset)

    # Add keywords
    kws = [resolve(kw) for kw in preset.get("prompt_elements", [])]

    prompt = ",".join([kw for kw in kws if kw] + [preset["prompt"]])
    preset["prompt"] = resolve(prompt)

    for lora in randomize_lora(preset.get("loras", [])):
        alias = lora.get("alias")
        weight = lora.get("weight")
        if not isinstance(weight, list):
            continue

        assert len(weight) == 2, "a weight range must be 2"
        picked_weight = uniform(weight[0], weight[1])
        lora["weight"] = picked_weight

        preset["prompt"] += f"<lora:{alias}:{picked_weight}>"

    allowed_keys = conf.get("allowed_keys")
    trimmed_req_body = {
        **{k: randomize(v) for k, v in preset.items() if allowed_keys is None or k in allowed_keys},
        "seed": randint(0, 2**32 - 1)
    }

    _validate_final_req_body(trimmed_req_body)

    return trimmed_req_body


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
