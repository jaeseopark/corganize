import json
import os
from const import DEFAULT_CONFIG_PATH, DEFAULT_OVERRIDE_CONFIG_PATH, OVERRIDE_CONFIG_PATH


def get_config(default_path = DEFAULT_CONFIG_PATH, override_path = OVERRIDE_CONFIG_PATH or DEFAULT_OVERRIDE_CONFIG_PATH):
    def _get_config():
        for path in (override_path, default_path):
            if path and os.path.exists(path):
                with open(path) as fp:
                    return json.load(fp)
        raise RuntimeError("Config files not found")

    return _get_config()
