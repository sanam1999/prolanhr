
import { ipcMainHandle } from '../ipcHandlers.js';
import nmap from 'node-nmap';

const { QuickScan, OsAndPortScan, NmapScan } = nmap;

nmap.nmapLocation = 'nmap';

export function registerIpcHandlers() {
  ipcMainHandle('getSimpleObject', async (event, args) => {
    const { type, searchTerm } = args;
    let scan;

    return new Promise((resolve, reject) => {
      try {
        switch (type) {
          case "QuickScan":
            scan = new QuickScan(searchTerm);
            break;
          case "OsAndPortScan":
            scan = new OsAndPortScan(searchTerm);
            break;

          // Custom scans using NmapScan and flags
          case "PortScan":
            scan = new NmapScan(searchTerm, ['-p', '1-65535']);
            break;
          case "ServiceScan":
            scan = new NmapScan(searchTerm, ['-sV']);
            break;
          case "FullScan":
            scan = new NmapScan(searchTerm, ['-p', '1-65535', '-sV', '-O', '-A']);
            break;

          default:
            return reject(new Error("Invalid scan type"));
        }

        scan.on('complete', data => resolve(data));
        scan.on('error', err => reject(err));
        scan.startScan();
      } catch (err) {
        reject(err);
      }
    });
  });

  ipcMainHandle('getName', () => 'Sanam fkjsd');
}
