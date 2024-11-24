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


def backup_config():
    conf = get_config()
    backup_path = os.path.join(BACKUP_DIR, f"{datetime.now()}.json")
    with open(backup_path, "w") as fp:
        json.dump(conf, fp, indent=2)
