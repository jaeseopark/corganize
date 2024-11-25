from datetime import datetime
import json
import os
from const import BACKUP_DIR, DEFAULT_CONFIG_PATH, DEFAULT_OVERRIDE_CONFIG_PATH, OVERRIDE_CONFIG_PATH


def get_config(default_path=DEFAULT_CONFIG_PATH, override_path=OVERRIDE_CONFIG_PATH or DEFAULT_OVERRIDE_CONFIG_PATH):
    def _get_config():
        for path in (override_path, default_path):
            if path and os.path.exists(path):
                with open(path) as fp:
                    return json.load(fp)
        raise RuntimeError("Config files not found")

    return _get_config()


def save_config(config: dict, path=OVERRIDE_CONFIG_PATH or DEFAULT_OVERRIDE_CONFIG_PATH):
    with open(path, "w") as fp:
        json.dump(config, fp, indent=2)


def backup_config(config=None) -> str:
    os.makedirs(BACKUP_DIR, exist_ok=True)

    config = config or get_config()
    formatted = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    backup_path = os.path.join(BACKUP_DIR, f"{formatted}.json")
    with open(backup_path, "w") as fp:
        json.dump(config, fp, indent=2)

    return backup_path
