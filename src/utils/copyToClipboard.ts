import toast from 'react-hot-toast'

export async function copyToClipboard(text: string, successMessage = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch (err) {
    toast.error('Failed to copy to clipboard')
    console.error('Failed to copy:', err)
  }
}

