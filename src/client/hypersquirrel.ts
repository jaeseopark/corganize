import { File } from '../entity/File';
import { HypersquirrelClientProps } from '../entity/props';

const dedupFilesById = (files: File[]) =>
  files.filter((v, i, a) => a.findIndex((f) => f.fileid === v.fileid) === i);

class HyperSquirrelClient {
  host: string;

  constructor({ host }: HypersquirrelClientProps) {
    this.host = host;
  }

  async scrapeAsync(...urls: string[]): Promise<File[]> {
    const scrapeSingleUrl = (url: string) =>
      fetch(`${this.host}/scrape`, {
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

    return Promise.allSettled(urls.map((url) => scrapeSingleUrl(url)))
      .then((results) =>
        results.reduce((acc, result) => {
          if (result.status === 'fulfilled') {
            acc.push(...result.value);
          }
          return acc;
        }, new Array<File>())
      )
      .then(dedupFilesById);
  }
}

export default HyperSquirrelClient;
