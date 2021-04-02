/* eslint-disable class-methods-use-this */
import { File } from '../entity/File';

class HyperSquirrelClient {
  async scrapeAsync(url: string): Promise<File[]> {
    // mock

    const a = [];
    for (let index = 0; index < 2; index++) {
      a.push({
        fileid: 'appleca',
        sourceurl: `https://apple.ca/${url}/${index}`,
        storageservice: 'None',
        filename: 'apple.ca',
      });
    }

    return a;
  }
}

export default HyperSquirrelClient;
