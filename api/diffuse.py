import os
from random import choices, randint, uniform
import re
from typing import Any, List
import json

from utils import get_shuffled_copy

MAX_PRESET_LEN = 30


def randomize(obj: Any):
    if isinstance(obj, str):
        def _randomize(s: str) -> str:
            matches = re.findall(r"(\[[^\[\]]+\])", s)
            for match in matches:
                candidates = match.strip("[").strip("]").split("|")
                s = s.replace(match, get_shuffled_copy(candidates)[0])
            return s

        first_pass = _randomize(obj)
        second_pass = _randomize(f"[{first_pass}]")
        return second_pass

    return obj


def resolve(prompt: str, prompt_lookup: dict):
    prompt = randomize(prompt)
    matches = re.findall(r"(\/[a-zA-Z0-9_]+)", prompt)
    for match in matches:
        key = match.strip("/")
        if key in prompt_lookup:
            resolved = resolve(prompt_lookup[key], prompt_lookup)
            prompt = prompt.replace(match, resolved, 1)

    return prompt


def merge(target: dict, acc: dict):
    target = {**target}

    for key in ("prompt", "negative_prompt"):
        combined_values = [s for s in ([target[key]] + [acc[key]]) if s]
        target[key] = ",".join(combined_values)

    for key in ("prompt_elements", "loras"):
        target[key].extend(acc[key])

    return {**acc, **target}


def consume_templates(preset: dict, available_templates):
    available_templates = available_templates or dict()
    preset = json.loads(json.dumps(preset))

    # Assign defualt values
    for key in ("prompt", "negative_prompt"):
        preset[key] = preset.get(key, "")
    for key in ("prompt_elements", "loras"):
        preset[key] = preset.get(key, list())

    acc = dict(prompt="", negative_prompt="", prompt_elements=[], loras=[])
    for template_name in reversed(preset.get("templates", [])):
        template_name = randomize(template_name)
        template = available_templates.get(template_name, dict())
        template = consume_templates(template, available_templates)

        acc = merge(template, acc=acc)

    return merge(preset, acc=acc)


def _get_payload_and_enabled(preset: dict, conf: dict) -> dict:
    """
    See https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API
    """
    preset = consume_templates(
        preset,
        available_templates=conf.get("templates")
    )
    saved_prompts = conf.get("saved_prompts")

    # Add keywords
    kws = [resolve(kw, saved_prompts)
           for kw in preset.get("prompt_elements", [])]

    prompt = ",".join([kw for kw in kws if kw] + [preset["prompt"]])
    preset["prompt"] = resolve(prompt, saved_prompts)

    for lora in preset.get("loras", []):
        weight = lora.get("weight")
        if not isinstance(weight, list):
            continue

        assert len(weight) == 2, "a weight range must be 2"
        lora["weight"] = uniform(weight[0], weight[1])

    allowed_keys = conf.get("allowed_keys")
    trimmed_payload = {
        **{k: randomize(v) for k, v in preset.items() if allowed_keys is None or k in allowed_keys},
        "seed": randint(0, 2**32 - 1)
    }

    return trimmed_payload, preset.get("enabled", True)


class DiffusePreset:
    def __init__(self, preset: dict, conf: dict):
        conf = conf or dict()
        self._og = preset

        preset = json.loads(json.dumps(preset))
        assert "preset_name" in preset, "'preset_name' must be set"
        preset["prompt"] = preset.get("prompt", "")

        default_model = conf.get("templates", dict()).get(
            "default", dict()).get("model")
        model = preset.get("model", default_model)
        assert model, "'model' must be set either in the default template or in each preset"

        model = randomize(model)
        preset["model"] = model

        # In the order of descreasing importance
        # The latter 2 are just for inheritance purposes, so they can be put at the end.
        preset["templates"] = preset.get("templates", []) + [model, "default"]

        self.payload, self.enabled = _get_payload_and_enabled(preset, conf)

    @property
    def preset_name(self) -> str:
        return self._og.get("preset_name")

    @property
    def prefix(self) -> str:
        pname = self.preset_name or ""
        mname = self.payload.get("model", "")
        return re.sub(r'[^a-zA-Z0-9]', '-', pname+mname)[:MAX_PRESET_LEN].strip("-")


class DiffusePresetCollection:
    def __init__(self, preset_root: dict):
        self.preset_root = preset_root

    def select(self, count: int) -> List[DiffusePreset]:
        conf = self.preset_root.get("config", dict())
        preset_dicts = self.preset_root.get("presets", [])
        presets = [DiffusePreset(p, conf) for p in preset_dicts]
        weighted = [p for p in presets if p.enabled]
        selected = choices(
            weighted,
            weights=[p._og.get("sampling_weight", 1) for p in weighted],
            k=count
        )
        return [DiffusePreset(p._og, conf) for p in selected]

    @staticmethod
    def from_dict(config: dict):
        return DiffusePresetCollection(dict(
            config=config,
            presets=config["presets"]
        ))


if __name__ == "__main__":
    from conf import get_config
    config = get_config(override_path="mnt/data/config.json")
    collection = DiffusePresetCollection.from_dict(config)
    preset = collection.select(1)[0]
    print(json.dumps({**preset._og, **preset.payload}, indent=2))
