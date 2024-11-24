```shell
UID=$(id -u) GID=$(id -g) docker-compose up --build
```

```shell
UID=$(id -u) GID=$(id -g) docker-compose up --build -d
docker-compose logs --tail=100 -f api
```

## Environment Variables

| Name                    | Required | Description                                                                           |
| ----------------------- | -------- | ------------------------------------------------------------------------------------- |
| `DIFFUSION_URL`         | Yes      | URL to the Stable Diffusion HTTP API. Ex. `http://atlas:7859`                         |
| `OVERRIDE_CONFIG_PATH`  | No       | Path to the diffusion config override file. Defaults to `/mnt/data/diffusion/config`. |
| `AUTO_DELETE_DAYS`      | No       | Number of days before generated images get auto_deleted. Defaults to 3.               |
| `MAX_IMAGES_ALLOWED`    | No       | Number of images allowed in the library. Defaults to 2000.                            |
| `DIFFUSION_SAMPLE_SIZE` | No       | Number of presets to select in each round of diffusion. Defaults to 4.                |

## Preset

- `sampling_weight`: Liklihood of the preset getting selected in the sampling process.
- `batch_count`: How many images to diffuse when the preset does get selected.
