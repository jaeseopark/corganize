/* eslint-disable import/prefer-default-export */
const fs = require('fs');
const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

const drive = google.drive({ version: 'v3' });

class GdriveClient {
  constructor(config) {
    this.config = config;
    this.oAuthClient = null;
  }

  getTokenPath() {
    return this.config.creds.path.replace('.json', '_store.json');
  }

  doesTokenExist() {
    const tokenPath = this.getTokenPath();
    return fs.existsSync(tokenPath);
  }

  saveAuthCode(code) {
    const tokenPath = this.getTokenPath();
    const client = this.getOAuthClient();
    client.getToken(code, (err, token) => {
      if (err) throw err;
      client.setCredentials(token);
      fs.writeFileSync(tokenPath, JSON.stringify(token));
    });
  }

  getOAuthClient() {
    if (!this.oAuthClient) {
      const credentials = JSON.parse(fs.readFileSync(this.config.creds.path));
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      const client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      if (this.doesTokenExist()) {
        const token = fs.readFileSync(this.getTokenPath());
        client.setCredentials(JSON.parse(token));
      }

      this.oAuthClient = client;
    }

    return this.oAuthClient;
  }

  getAuthUrl() {
    return this.getOAuthClient().generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  downloadFileSync(fileId: string, localPath: string, progressCallback = null) {
    const wrapper = async () => {
      // eslint-disable-next-line no-return-await
      return await this.downloadFileAsync(fileId, localPath, progressCallback);
    };
    return wrapper();
  }

  async downloadFileAsync(fileId: string, localPath: string, progressCallback) {
    google.options({ auth: this.getOAuthClient() });

    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    return new Promise((resolve, reject) => {
      const contentLength = res.headers['content-legnth'];
      const dest = fs.createWriteStream(localPath);
      const { data } = res;
      let totalBytesReceived = 0;

      try {
        data.on('error', (error) => {
          throw error;
        });
        data.on('data', (d) => {
          if (progressCallback) {
            totalBytesReceived += d;
            progressCallback({
              fileId,
              totalBytesReceived,
              contentLength,
              percentage: totalBytesReceived / contentLength,
            });
          }
        });
        data.on('finish', () => {
          // dest.close();
          resolve(localPath);
        });
        data.pipe(dest);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default GdriveClient;
