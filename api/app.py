import logging
import os
import threading
from typing import Callable, List, Set


from const import IMG_DIR
from conf import get_config
from models import ConfigSaveRequest
from utils import get_old_files

from diffuse.api import DiffuseApiPayload, diffuse
from diffuse.collection import DiffusePreset, DiffusePresetCollection

os.makedirs(IMG_DIR, exist_ok=True)

logger = logging.getLogger("corganize")
lock = threading.Lock()


def select_presets(count: int) -> List[DiffusePreset]:
    logger.info("Accessing local FS for diffusion presets...")
    collection = DiffusePresetCollection.from_dict(get_config())
    return collection.select(count)


class Corganize:
    filenames_to_delete: Set[str] = set()
    envvars = dict(
        diffusion_enabled=True,
        notes="",
        auto_delete_days=int(os.getenv("AUTO_DELETE_DAYS", "1")),
        max_images_allowed=int(os.getenv("MAX_IMAGES_ALLOWED", "500")),
        diffusion_url=os.getenv("DIFFUSION_URL", "").strip("/"),
        diffusion_sample_size=int(os.getenv("DIFFUSION_SAMPLE_SIZE", "4"))
    )
    _broadcast_diffusion: Callable
    _broadcast_cleanup: Callable

    def get_image_filenames(self):
        def _is_valid(filename: str) -> bool:
            return filename not in self.filenames_to_delete and filename.endswith(".crgimg")
        return [filename for filename in os.listdir(IMG_DIR) if _is_valid(filename)]

    def get_recent_image_filenames(self):
        return sorted(
            self.get_image_filenames(),
            key=lambda filename: os.path.getctime(
                os.path.join(IMG_DIR, filename)),
            reverse=True
        )

    def diffuse(self):
        if not self.envvars["diffusion_enabled"]:
            logger.info("Diffusion disabled.")
            self.broadcast_diffusion("skipped", dict(
                message="diffusion is disabled in the app config"
            ))
            return

        logger.info("Diffusing...")

        filenames = self.get_image_filenames()
        if len(filenames) > self.envvars["max_images_allowed"]:
            msg = f"Library size is too big. {len(filenames)=} {self.envvars['max_images_allowed']=}"
            logger.info(msg)
            self.broadcast_diffusion("skipped", dict(
                message="Library size is too big",
                metadata=dict(
                    size=len(filenames),
                    limit=self.envvars['max_images_allowed']
                )
            ))
            return

        base_url = self.envvars["diffusion_url"]
        sample_size = self.envvars["diffusion_sample_size"]
        for _ in range(sample_size):
            # Doing this in a for loop because the # of presets may be lower than sample_size
            presets = select_presets(1)

            for preset in presets:
                self.broadcast_diffusion("processing", dict(
                    preset_name=preset.preset_name,
                ))
                logger.info(f"Starting {preset.preset_name=}")
                diffuse(base_url, DiffuseApiPayload(preset))
                logger.info(f"Generation done: {preset.preset_name=}")
                self.broadcast_diffusion("partially-done", dict(
                    preset_name=preset.preset_name,
                ))

        self.broadcast_diffusion("done")
        logger.info("Generation done: all")

    def override_envvars(self, config: ConfigSaveRequest):
        self.envvars = config.__dict__

    def delete(self, filenames: List[str]):
        lock.acquire()
        self.filenames_to_delete.update(filenames)
        lock.release()

    def cleanup(self):
        def _cleanup():
            deleted_filenames = []
            logger.info("Cleanup in progress...")
            self.broadcast_cleanup("in progress")
            threshold = self.envvars["auto_delete_days"]*24*3600
            old_filenames = get_old_files(IMG_DIR, age_seconds=threshold)
            self.filenames_to_delete.update(old_filenames)
            for filename in self.filenames_to_delete:
                path = os.path.join(IMG_DIR, filename)
                if os.path.exists(path):
                    os.remove(path)
                    logger.info(f"Deleted. {filename=}")
                    deleted_filenames.append(filename)
                else:
                    logger.warning(f"Not found {path=}")
            self.filenames_to_delete.clear()
            logger.info("Cleanup done")
            self.broadcast_cleanup(
                "done",
                dict(
                    filenames=deleted_filenames,
                    count=len(deleted_filenames)
                )
            )

        lock.acquire()
        try:
            _cleanup()
        finally:
            lock.release()

    def broadcast_diffusion(self, message: dict, metadata: dict = None):
        if not self._broadcast_diffusion:
            return

        self._broadcast_diffusion(
            dict(message=message, metadata=metadata or dict()))

    def broadcast_cleanup(self, message: dict, metadata: dict = None):
        if not self._broadcast_cleanup:
            return

        self._broadcast_cleanup(
            dict(message=message, metadata=metadata or dict()))
