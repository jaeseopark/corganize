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
    // TODO: make a new endpoint on the server side.
  }
}

export default CorganizeClient;
