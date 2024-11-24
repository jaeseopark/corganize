## Development

```shell
UID=$(id -u) GID=$(id -g) docker-compose -f docker-compose-dev.yml up --build
```

```shell
UID=$(id -u) GID=$(id -g) docker-compose -f docker-compose-dev.yml up --build -d
docker-compose logs --tail=100 -f api
```

## Packaging for Production

```shell
# API
TODO: work in progress...
# UI
TODO: work in progress...
```

## Usage

```shell
UID=$(id -u) GID=$(id -g) docker-compose up -d
```

### Environment Variables

| Name                    | Required | Description                                                                           |
| ----------------------- | -------- | ------------------------------------------------------------------------------------- |
| `DIFFUSION_URL`         | Yes      | URL to the Stable Diffusion HTTP API. Ex. `http://atlas:7859`                         |
| `OVERRIDE_CONFIG_PATH`  | No       | Path to the diffusion config override file. Defaults to `/mnt/data/diffusion/config`. |
| `AUTO_DELETE_DAYS`      | No       | Number of days before generated images get auto_deleted. Defaults to 3.               |
| `MAX_IMAGES_ALLOWED`    | No       | Number of images allowed in the library. Defaults to 2000.                            |
| `DIFFUSION_SAMPLE_SIZE` | No       | Number of presets to select in each round of diffusion. Defaults to 4.                |

## Guide to Using Presets

- `sampling_weight`: Liklihood of the preset getting selected in the sampling process.
- `batch_count`: How many images to diffuse when the preset does get selected.

TODO: more instructions
