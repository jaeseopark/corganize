/* eslint-disable @typescript-eslint/no-unused-vars */
class CorganizeClient {
  constructor({ host, apikey }) {
    this.host = host;
    this.apikey = apikey;
  }

  getFiles(isactive = null, ispublic = null) {
    // TODO use isactive and ispublic
    const url = new URL('/Prod/files', this.host);
    return fetch(url, {
      headers: {
        apikey: this.apikey,
      },
    });
  }
}

export default CorganizeClient;
