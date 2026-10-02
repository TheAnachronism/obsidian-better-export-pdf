export const remote = {
  shell: {
    async openPath(_filePath) {},
  },
  dialog: {
    async showSaveDialog() {
      return { canceled: true };
    },
    async showOpenDialog() {
      return { canceled: true, filePaths: [] };
    },
  },
  getCurrentWebContents() {
    return { openDevTools() {} };
  },
};

const electron = { remote };

export default electron;
