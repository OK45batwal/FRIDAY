import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: '0.1.0'
});
