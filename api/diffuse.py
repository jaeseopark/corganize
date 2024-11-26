from random import choices, randint, uniform
import re
from typing import Any, Callable, List, Union
import json

from utils import get_shuffled_copy

MAX_FILENAME_LEN = 64


def randomize(obj: Any):
    if isinstance(obj, str):
        def _randomize(s: str) -> str:
            matches = re.findall(r"(\[[^\[\]]+\])", s)
            for match in matches:
                candidates = match.strip("[").strip("]").split("|")
                s = s.replace(match, get_shuffled_copy(candidates)[0])
            return s

        first_pass = _randomize(obj)
        if not first_pass:
            return ""
        return _randomize(f"[{first_pass}]")

    return obj


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


class TemplateConsumer:
    """
    Consumes all downstream templates and returns 1 final dictionary.
    Works with any depths -- i.e. nested template references.
    """
    templates: dict
    _resolve: Callable

    def __init__(self, templates: dict, resolve: Callable) -> None:
        self.templates = templates or dict()
        self._resolve = resolve

    @staticmethod
    def _get_templates(preset: dict) -> List[Union[str, dict]]:
        templates = preset.get("templates", [])

        if isinstance(templates, dict) and "one_of" in templates:
            templates = [dict(
                one_of=templates["one_of"]
            )]
        assert isinstance(templates, list), "'templates' must be a list"

        return list(reversed(templates))

    @staticmethod
    def _validate_and_sanitize(preset: dict) -> dict:
        assert isinstance(preset, dict), "preset must be be dictionary"
        preset = json.loads(json.dumps(preset))

        # Assign defualt values
        for key in ("prompt", "negative_prompt"):
            preset[key] = preset.get(key, "")
        for key in ("prompt_elements", "loras"):
            preset[key] = preset.get(key, list())

        assert isinstance(preset["prompt_elements"],
                          list), "prompt_elements must be a list"

        return preset

    def _merge(self, target: dict, acc: dict) -> dict:
        target = {**target}

        for key in ("prompt", "negative_prompt"):
            resolved_target = self._resolve(target[key])
            resolved_acc = self._resolve(acc[key])
            combined_values = [s for s in [resolved_target, resolved_acc] if s]
            target[key] = ",".join(combined_values)

        for key in ("prompt_elements", "loras"):
            target[key].extend([v for v in acc[key] if v])

        return {**acc, **target}

    def consume(self, preset: dict) -> dict:
        preset = TemplateConsumer._validate_and_sanitize(preset)
        templates = TemplateConsumer._get_templates(preset)
        acc = dict(prompt="", negative_prompt="", prompt_elements=[], loras=[])

        for template_ref in templates:
            template_ref: Union[str, object] = randomize(template_ref)
            if isinstance(template_ref, str):
                template = self.templates.get(template_ref, dict())
            elif isinstance(template_ref, object) and "one_of" in template_ref:
                candidates: List[dict] = template_ref["one_of"]
                assert len(candidates) > 0, "at least 1 candidate is required."
                weights = [c.get("_weight", 1) for c in candidates]
                template = choices(candidates, weights, k=1)[0]
            else:
                raise RuntimeError("'template_ref' data type is wrong")

            template = self.consume(template)

            acc = self._merge(template, acc=acc)

        return self._merge(preset, acc=acc)


def randomize_lora(loras: list):
    ret_loras = []
    for lora in loras:
        if "one_of" in lora:
            candidates: List[dict] = lora["one_of"]
            lora = choices(candidates, k=1)
        ret_loras.append(lora)
    return ret_loras


def _validate_final_payload(payload: dict):
    lora_names = [lora["file"] for lora in payload.get("loras", [])]
    unique_lora_names = set(lora_names)
    assert len(lora_names) == len(
        unique_lora_names), "duplicate loras should not exist"


def _get_payload(preset: dict, conf: dict) -> dict:
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

    _validate_final_payload(trimmed_payload)

    return trimmed_payload


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
        # TODO support dictionary here, for now just put an assert statement
        templates = preset.get("templates", [])
        assert isinstance(templates, list), "'templates' must be a list"
        preset["templates"] = templates + [model, "default"]

        self.payload = _get_payload(preset, conf)

    @property
    def preset_name(self) -> str:
        return self._og.get("preset_name")

    @property
    def filename_prefix(self) -> str:
        pname = self.preset_name
        mname = self.payload["model"]
        concat_name = f"{pname}-{mname}"
        return re.sub(r'[^a-zA-Z0-9]', '-', concat_name)[:MAX_FILENAME_LEN].strip("-")


class DiffusePresetCollection:
    def __init__(self, preset_root: dict):
        self.preset_root = preset_root

    def select(self, count: int) -> List[DiffusePreset]:
        conf = self.preset_root.get("config", dict())
        preset_dicts = self.preset_root.get("presets", [])
        presets = [DiffusePreset(p, conf) for p in preset_dicts]
        selected = choices(
            presets,
            weights=[p._og.get("weight", 1) for p in presets],
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

    upper_bound=500
    should_print_each_payload=False
    for i in range(500):
        if i % 10 == 0:
            print(f"{i}/{upper_bound} ({i/upper_bound})")
        # keep calling until something fails
        collection = DiffusePresetCollection.from_dict(config)
        preset = collection.select(1)[0]
        if should_print_each_payload:
            print(json.dumps({**preset._og, **preset.payload}, indent=2))
