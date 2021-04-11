/* eslint-disable class-methods-use-this */
import { File } from '../entity/File';
import { HypersquirrelClientProps } from '../entity/props';

class HyperSquirrelClient {
  host: string;

  constructor({ host }: HypersquirrelClientProps) {
    this.host = host;
  }

  async scrapeAsync(url: string): Promise<File[]> {
    return fetch(`${this.host}/scrape`, {
      method: 'POST',
      body: JSON.stringify({ url }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then(({ files }: { files: File[] }) => {
        return files.map((f) => {
          return {
            ...f,
            storageservice: 'None',
          };
        });
      });
  }
}

export default HyperSquirrelClient;
