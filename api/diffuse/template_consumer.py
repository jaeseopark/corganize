from random import choices
from typing import Callable, List, Union
import json

from diffuse.randomizer import Randomizer


def _get_template_weight(c):
    return c.get("_weight", 1) if isinstance(c, dict) else 1


class TemplateConsumer:
    randomize = Randomizer.apply

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

    def get_template(self, template_ref: Union[str, dict]) -> dict:
        if isinstance(template_ref, str):
            template_ref = TemplateConsumer.randomize(template_ref)
            return self.templates.get(template_ref, dict())
        elif isinstance(template_ref, dict):
            if "one_of" not in template_ref:
                # This is the template definition.
                return template_ref

            candidates: List[Union[str, dict]] = template_ref["one_of"]
            assert len(candidates) > 0, "at least 1 candidate is required."
            weights = [_get_template_weight(c) for c in candidates]
            template_ref = choices(candidates, weights, k=1)[0]
            return self.get_template(template_ref)

        msg = "a template reference must be either a string or a dict"
        raise RuntimeError(msg)

    def consume(self, preset: dict) -> dict:
        preset = TemplateConsumer._validate_and_sanitize(preset)
        templates = TemplateConsumer._get_templates(preset)
        acc = dict(prompt="", negative_prompt="", prompt_elements=[], loras=[])

        for template_ref in templates:
            template = self.get_template(template_ref)
            template = self.consume(template)
            acc = self._merge(template, acc=acc)

        return self._merge(preset, acc=acc)
