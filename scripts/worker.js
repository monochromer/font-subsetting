importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js')

let pyodideReadyPromise
let pythonSourcePromise

async function loadPythonSource() {
  const response = await fetch('subset.py');
  const text = await response.text();
  return text;
}

async function setupPyodide() {
  const pyodide = await loadPyodide()

  await Promise.all(
    ['Brotli', 'fonttools']
      .map((packageName) => pyodide.loadPackage(packageName))
  );

  return pyodide
}

function waitPyodide() {
  if (pyodideReadyPromise) {
    return pyodideReadyPromise
  }

  pyodideReadyPromise = setupPyodide()

  return pyodideReadyPromise
}

async function subsetFontFromBuffer(inputFontBuffer, pythonSource, options) {
  const pyodide = await waitPyodide()

  const TEMP_INPUT_FONT_FILE = `./${crypto.randomUUID()}`
  const TEMP_OUTPUT_FONT_FILE = `./${crypto.randomUUID()}`

  pyodide.FS.writeFile(TEMP_INPUT_FONT_FILE, inputFontBuffer)

  const subset_font = pyodide.runPython(pythonSource)

  subset_font(new Map(Object.entries({
    ...options,
    ...{
      'input-file': TEMP_INPUT_FONT_FILE,
      'output-file': TEMP_OUTPUT_FONT_FILE
    }
  })))

  const processedFile = pyodide.FS.readFile(TEMP_OUTPUT_FONT_FILE)

  pyodide.FS.unlink(TEMP_INPUT_FONT_FILE)
  pyodide.FS.unlink(TEMP_OUTPUT_FONT_FILE)

  return processedFile
}

waitPyodide()
  .then(() => {
    self.postMessage({
      type: 'meta',
      payload: 'pyodide loaded'
    })
  })
  .catch(console.error)

pythonSourcePromise = loadPythonSource()
  .catch(console.error)

self.addEventListener('message', async (event) => {
  try {
    const { type, payload } = event.data

    if (type === 'file') {
      const pythonSource = await pythonSourcePromise
      const fileBuffer = await payload.file.arrayBuffer()
      const fileBufferView = new Uint8Array(fileBuffer)
      const outputFileBuffer = await subsetFontFromBuffer(fileBufferView, pythonSource, payload.options)
      self.postMessage({
        type: 'file',
        payload: {
          fileId: payload.fileId,
          fileBuffer: outputFileBuffer
        }
      })
    }
  } catch (error) {
    console.error(error)
  }
})
