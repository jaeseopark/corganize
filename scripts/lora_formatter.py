
import json


def main(lora_array):
    d = {f"lora_{lora['file'].split('_lora_f')[0]}_full": dict(
        loras=[{**lora, **dict(weight=1)}], prompt="", notes="") for lora in lora_array}
    print(json.dumps(d, indent=2).strip("{}").strip("}"))


s = """
[
  {
    "file": "abc.ckpt",
    "weight": 0.5
  }
]
"""

if __name__ == "__main__":
    main(json.loads(s))
