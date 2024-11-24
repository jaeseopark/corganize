from typing import List
from pydantic import BaseModel

# Define the Pydantic model


class DeleteRequest(BaseModel):
    filenames: List[str]


class ConfigSaveRequest(BaseModel):
    diffusion_enabled: bool
    notes: str
    auto_delete_days: int
    max_images_allowed: int
    diffusion_url: str
    diffusion_sample_size: int
