from random import choices
from typing import List
import json

from diffuse.preset import DiffusePreset


class DiffusePresetCollection:
    def __init__(self, preset_root: dict):
        self.preset_root = preset_root

    def select(self, count: int) -> List[DiffusePreset]:
        conf = self.preset_root.get("config", dict())
        preset_dicts = self.preset_root.get("presets", [])
        presets = [DiffusePreset(p, conf) for p in preset_dicts]
        selected = choices(
            presets,
            weights=[p._specs.get("weight", 1) for p in presets],
            k=count
        )
        return [DiffusePreset(p._specs, conf) for p in selected]

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
    req_body = preset.get_req_body()
    print(json.dumps({**preset._specs, **req_body}, indent=2))
