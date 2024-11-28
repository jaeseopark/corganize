from functools import reduce
from random import choices
import re
from typing import Any, List


def _deconstruct_candidate(candidates: List[str]):
    def _get_value_weight(candidate: str):
        matches = re.findall(r"^\s*((0|[1-9]\d*)(\.\d+)?)\:(.+)*$", candidate)
        if not matches:
            return candidate, 1
        return matches[0][-1], float(matches[0][0])

    def _reducer(acc, candidate):
        value, weight = _get_value_weight(candidate)
        acc[0].append(value)
        acc[1].append(weight)
        return acc

    return reduce(_reducer, candidates, ([], []))


class Randomizer:
    @staticmethod
    def apply(obj: Any):
        if isinstance(obj, str):
            def _randomize(s: str) -> str:
                matches = re.findall(r"(\[[^\[\]]+\])", s)
                for match in matches:
                    candidates = match.strip("[").strip("]").split("|")
                    values, weights = _deconstruct_candidate(candidates)
                    s = s.replace(match, choices(values, weights, k=1)[0], 1)
                return s

            first_pass = _randomize(obj)
            if not first_pass:
                return ""
            return _randomize(f"[{first_pass}]")

        return obj
