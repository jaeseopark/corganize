const fetch = require('node-fetch');

class CorganizeClient {
  constructor({ host, apikey }) {
    this.host = host;
    this.apikey = apikey;
  }

  getActiveFiles() {
    const url = new URL('/Prod/files/active', this.host);
    return fetch(url, {
      headers: {
        apikey: this.apikey,
      },
    });
  }

  updateFav(fileid, newValue) {
    const url = new URL('/Prod/files/upsert', this.host);
    const body = {
      files: [
        {
          fileid,
          isactive: newValue,
        },
      ],
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
