const fetch = require('node-fetch');

class CorganizeClient {
  constructor({ host, apikey }) {
    this.host = host;
    this.apikey = apikey;
  }

  getRecentFilesWithPagination(progress, limit = null) {
    return this.getFilesWithPagination('/Prod/files', progress, limit);
  }

  getActiveFilesWithPagination(progress, limit = null) {
    return this.getFilesWithPagination('/Prod/files/active', progress, limit);
  }

  getIncompleteFilesWithPagination(progress, limit = null) {
    return this.getFilesWithPagination('/Prod/files/incomplete', progress, limit);
  }

  getFiles(path, nexttoken) {
    const url = new URL(path, this.host);
    const headers = { apikey: this.apikey };

    if (nexttoken) {
      headers.nexttoken = nexttoken;
    }

    return fetch(url, { headers });
  }

  getFilesWithPagination(
    path,
    progress,
    limit,
    paginationToken = null,
    total = 0
  ) {
    return new Promise((resolve, reject) =>
      this.getFiles(path, paginationToken)
        .then((r) => r.json())
        .then((body) => {
          const nextToken = body?.metadata?.nexttoken;
          const newTotal = total + body.files.length;
          const hasReachedLimit = limit && newTotal >= limit;

          progress(body.files);

          if (nextToken && !hasReachedLimit) {
            // eslint-disable-next-line promise/no-nesting
            return this.getFilesWithPagination(
              path,
              progress,
              limit,
              nextToken,
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
    })
      .then((res) => res.json())
      .then((resArray) => resArray[0]);
  }
}

export default CorganizeClient;
