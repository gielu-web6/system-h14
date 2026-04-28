import mammoth from 'mammoth'

export async function parseFile(fileBuffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'docx':
      return parseDOCX(fileBuffer)
    case 'txt':
    case 'md':
    case 'csv':
    case 'text':
      return fileBuffer.toString('utf-8')
    case 'pdf':
      // PDF text extraction requires pdfjs-dist which has complex server-side setup.
      // Return empty string — users should upload PDF content as .txt
      return ''
    default:
      return fileBuffer.toString('utf-8')
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
