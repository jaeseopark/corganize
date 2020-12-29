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

  async downloadFileAsync(fileId: string, localPath: string, progressCallback) {
    google.options({ auth: this.getOAuthClient() });
    const tmpLocalPath = `${localPath}.download`;
    let progress = 0;

    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      const { data, headers } = res;
      const contentLength = headers['content-length'];

      data
        .on('end', () => {
          fs.rename(tmpLocalPath, localPath);
          resolve(localPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('data', (d) => {
          progress += d.length;
          if (progressCallback) {
            progressCallback({
              percentage: progress / contentLength,
            });
          }
        })
        .pipe(fs.createWriteStream(tmpLocalPath));
    });
  }
}

export default GdriveClient;
