import { renameSync } from "fs";

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

  async downloadFileAsync(fileId: string, localPath: string, progressCallback) {
    google.options({ auth: this.getOAuthClient() });

    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      const tmpLocalPath = `${localPath}.download`;
      const dest = fs.createWriteStream(tmpLocalPath);
      const { data } = res;
      let downloadedBytes = 0;

      try {
        data.on('error', (error) => {
          throw error;
        });
        data.on('data', (d) => {
          if (progressCallback) {
            downloadedBytes += d.length;
            progressCallback({
              fileId,
              downloadedBytes,
            });
          }
        });
        data.on('finish', () => {
          setTimeout(() => {
            // wait 1.5s before removing the .download extension so the file pointer is properly closed, etc.
            renameSync(tmpLocalPath, localPath);
            resolve(localPath);
          }, 1500);
        });
        data.pipe(dest);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default GdriveClient;
