const fetch = require('node-fetch');

class CorganizeClient {
  constructor({ host, apikey }) {
    this.host = host;
    this.apikey = apikey;
  }

  getActiveFiles(nexttoken) {
    const url = new URL('/Prod/files/active', this.host);
    const headers = { apikey: this.apikey };

    if (nexttoken) {
      headers.nexttoken = nexttoken;
    }

    return fetch(url, { headers });
  }

  getActiveFilesWithPagination(
    progress,
    paginationToken = null,
    limit = null,
    total = 0
  ) {
    return new Promise((resolve, reject) =>
      this.getActiveFiles(paginationToken)
        .then((r) => r.json())
        .then((body) => {
          const nextToken = body?.metadata?.nexttoken;
          const newTotal = total + body.files.length;
          const hasReachedLimit = limit && newTotal >= limit;

          progress(body.files);

          if (nextToken && !hasReachedLimit) {
            // eslint-disable-next-line promise/no-nesting
            return this.getActiveFilesWithPagination(
              progress,
              nextToken,
              limit,
              newTotal
            )
              .then(resolve)
              .catch(reject);
          }
          return resolve(null);
        })
        .catch(reject)
    );
  }

  updateFile(fileid, props) {
    const url = new URL('/Prod/files/upsert', this.host);
    const body = {
      files: [{ ...props, fileid }],
    };
    return fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apikey,
      },
    }).then((res) => res.json());
  }
}

export default CorganizeClient;
