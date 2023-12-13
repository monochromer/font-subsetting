import { formatFileSize, parseFileName } from './utils.js';
const worker = new Worker(new URL('worker.js', import.meta.url))

function subsetFont(file, options) {
  return new Promise((resolve, reject) => {
    const opts = {
      'desubroutinize': false,
      'no-hinting': false,
      'layout-features': '*'
    }

    for (const key of ['flavor', 'text', 'unicodes']) {
      if (options[key]) {
        opts[key] = options[key]
      }
    }

    const fileId = [file.name, file.size, file.lastModified].join('_')

    worker.postMessage({
      type: 'file',
      payload: {
        fileId,
        file,
        options: opts
      }
    })

    worker.addEventListener('message', function onWorkerMessage(event) {
      const { type, payload } = event.data

      if (fileId === payload.fileId) {
        worker.removeEventListener('message', onWorkerMessage)
        if (type === 'file' ) {
          resolve(payload)
        } else if (type === 'error') {
          reject(payload.error)
        }
      }
    })
  })
}

let isLoading = false

function setLoading(flag) {
  const button = document.querySelector('.button[type="submit"]');
  button.classList.toggle('button_is-loading', flag)
  isLoading = flag
}

const fileControl = document.querySelector('label.file-control');
fileControl.addEventListener('change', (event) => {
  const [file] = event.target.files;
  const label = fileControl.querySelector('.file-control__label');
  label.textContent = file.name + ', ' + formatFileSize(file.size);
})

document.addEventListener('submit', async (event) => {
  event.preventDefault()

  if (isLoading) {
    return
  }

  try {
    setLoading(true)

    const form = event.target
    const formData = new FormData(form)

    let file
    const options = {}

    formData.forEach((value, key) => {
      if (key === 'file') {
        file = value;
        return;
      }

      if (value) {
        options[key] = value
      }
    })

    if (!file) {
      return
    }

    const result = await subsetFont(file, options)

    const link = document.querySelector('a.file-control')
    const linkLabel = link.querySelector('.file-control__label')

    const fileNameData = parseFileName(file.name)
    const ext = options.flavor ? options.flavor : fileNameData.ext
    const newFileName = fileNameData.baseName + `.${ext}`

    const blob = new Blob([result.fileBuffer])
    link.setAttribute('download', newFileName)
    link.href = URL.createObjectURL(blob)
    linkLabel.textContent = newFileName + ', ' + formatFileSize(blob.size)
  } finally {
    setLoading(false);
  }
})