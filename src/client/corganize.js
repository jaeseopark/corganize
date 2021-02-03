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

  getFilesWithPagination(path, cb, limit, paginationToken = null, total = 0) {
    return new Promise((resolve, reject) =>
      this.getFiles(path, paginationToken)
        .then((r) => r.json())
        .then((body) => {
          return [
            body?.metadata?.nexttoken,
            body.files.filter((f) => f.ispublic !== false || f.locationref),
          ];
        })
        .then((transformedBody) => {
          const [token, files] = transformedBody;
          const newTotal = total + files.length;
          const hasReachedLimit = limit && newTotal >= limit;

          // eslint-disable-next-line promise/no-callback-in-promise
          cb(files);

          if (token && !hasReachedLimit) {
            // eslint-disable-next-line promise/no-nesting
            return this.getFilesWithPagination(path, cb, limit, token, newTotal)
              .then(resolve)
              .catch(reject);
          }
          return resolve(null);
        })
        .catch(reject)
    );
  }

  updateFile(fileid, props) {
    const url = new URL('/Prod/files', this.host);
    const body = { ...props, fileid };
    return fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apikey,
      },
    }).then((res) => res.json());
  }

  deleteFile(fileid) {
    const url = new URL('/Prod/files', this.host);
    return fetch(url, {
      method: 'DELETE',
      body: JSON.stringify({ fileid }),
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apikey,
      },
    }).then((res) => res.json());
  }
}

export default CorganizeClient;
