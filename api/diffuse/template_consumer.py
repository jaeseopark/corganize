from functools import reduce
from random import choices
from typing import Callable, List, Set, Union
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
    template_dict: dict
    resolve_saved_prompts: Callable

    def __init__(self, templates: dict, resolve: Callable) -> None:
        self.template_dict = templates or dict()
        self.resolve_saved_prompts = resolve

    def _get_referenced_templates(self, preset: dict) -> List[Union[str, dict]]:
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

        prompt_elements = preset["prompt_elements"]
        assert isinstance(
            prompt_elements, list), f"prompt_elements must be a list {prompt_elements=}"

        return preset

    def handle_string_ref(self, template_ref: str):
        template_ref = TemplateConsumer.randomize(template_ref)
        return self.template_dict.get(template_ref, dict())

    def handle_tag_selectors(self, template_ref: dict):
        def select(candidates: Set[str], selector: dict):
            if isinstance(selector, str):
                selector = dict(add=selector)

            ops = dict(
                add=candidates.update,
                subtract=candidates.difference_update,
                intersect=candidates.intersection_update
            )

            for op, func in ops.items():
                if op in selector:
                    func(self.template_dict.get(f"#{selector[op]}", []))

            return candidates

        selectors = template_ref["selectors"]
        candidates: set = reduce(select, selectors, set())

        if len(candidates) == 0:
            return dict()

        template_ref = choices(list(candidates), k=1)[0]
        return self.get_template(template_ref)

    def handle_one_of(self, template_ref: dict):
        candidates: List[Union[str, dict]] = template_ref["one_of"]
        assert len(candidates) > 0, "at least 1 candidate is required."
        weights = [_get_template_weight(c) for c in candidates]
        template_ref = choices(candidates, weights, k=1)[0]
        return self.get_template(template_ref)

    def get_template_ref_resolver(self, template_ref: Union[str, dict]) -> Callable:
        if isinstance(template_ref, str):
            return self.handle_string_ref

        if isinstance(template_ref, dict):
            if "selectors" in template_ref:
                msg = f"Only one of 'selectors' and 'templates' can exist in a template reference {template_ref=}"
                assert "templates" not in template_ref, msg
                return self.handle_tag_selectors
            if "one_of" in template_ref:
                return self.handle_one_of

            # This is the case where the template ref itself is a template body.
            return lambda _: _

        msg = f"a template reference must be Union[str, dict] {template_ref=}"
        raise AssertionError(msg)

    def get_template(self, template_ref: Union[str, dict]) -> dict:
        resolve: Callable = self.get_template_ref_resolver(template_ref)
        return resolve(template_ref)

    def _merge(self, target: dict, acc: dict = None) -> dict:
        acc = acc or dict(prompt="", negative_prompt="",
                          prompt_elements=[], loras=[])
        target = {**target}

        for key in ("prompt", "negative_prompt"):
            resolved_target = self.resolve_saved_prompts(target[key])
            resolved_acc = self.resolve_saved_prompts(acc[key])
            combined_values = [s for s in [resolved_target, resolved_acc] if s]
            target[key] = ",".join(combined_values)

        for key in ("prompt_elements", "loras"):
            target[key].extend([v for v in acc[key] if v])

        return {**acc, **target}

    def consume(self, preset: dict) -> dict:
        preset = TemplateConsumer._validate_and_sanitize(preset)
        template_refs = self._get_referenced_templates(preset)
        acc = None

        for template_ref in template_refs:
            template = self.get_template(template_ref)
            template = self.consume(template)
            acc = self._merge(template, acc=acc)

        return self._merge(preset, acc=acc)
