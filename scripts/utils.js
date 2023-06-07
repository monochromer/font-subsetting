export function parseFileName(fileName) {
  const dividerIndex = (Math.max(0, fileName.lastIndexOf('.')) || Infinity)
  const baseName = fileName.slice(0, dividerIndex)
  const ext = fileName.slice(dividerIndex + 1)
  return {
    baseName,
    ext
  }
}

export function formatFileSize(bytes, decimals = 2) {
  if (bytes == 0) {
    return '0 Bytes'
  };

  const
    k = 1024,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}