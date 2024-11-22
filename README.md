```shell
UID=$(id -u) GID=$(id -g) docker-compose up --build
```

```shell
UID=$(id -u) GID=$(id -g) docker-compose up --build -d
docker-compose logs --tail=100 -f api
```
