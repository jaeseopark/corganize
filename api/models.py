from typing import List
from pydantic import BaseModel

# Define the Pydantic model
class DeleteRequest(BaseModel):
    filenames: List[str]
