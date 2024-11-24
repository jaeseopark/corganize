import os


DATA_DIR = "/data"
IMG_DIR = os.path.join(DATA_DIR, "images")
DEFAULT_CONFIG_PATH = "./default_config.json"
OVERRIDE_CONFIG_PATH = os.getenv("OVERRIDE_CONFIG_PATH")
DEFAULT_OVERRIDE_CONFIG_PATH = os.path.join(DATA_DIR, "config.json")
