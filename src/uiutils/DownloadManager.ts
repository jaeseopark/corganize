import { ipcRenderer } from 'electron';

type Download = {
  fileid: string;

  // range 0-1 (float)
  percentage: number;
};

class DownloadManager {
  downloads: Map<string, Download> = new Map();

  downloadListener: Function;

  constructor() {
    this.downloadListener = (_event, { fileid, percentage }) => {
      this.downloads.set(fileid, { fileid, percentage });
    };

    ipcRenderer.on('downloadProgress', this.downloadListener);
  }

  removeListener() {
    ipcRenderer.removeListener('downloadProgress', this.downloadListener);
  }

  put(fileid: string, percentage: number) {
    this.downloads.set(fileid, { fileid, percentage });
  }

  getActiveDownloadCount() {
    return Object.values(this.downloads).filter(
      (d: Download) => d.percentage < 1
    ).length;
  }

  isActive(fileid: string) {
    const d = this.downloads.get(fileid);
    return d && d.percentage < 1;
  }
}

export default DownloadManager;
