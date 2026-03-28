'use client'

import { useState } from 'react'
import type { InvoiceOrderData } from '@/components/invoice/types'
import { generateInvoicePdf } from '@/lib/invoice/generateInvoicePdf'

interface InvoiceDownloadButtonProps {
  invoice: InvoiceOrderData
  label?: string
  className?: string
}

export function InvoiceDownloadButton({
  invoice,
  label = 'Download Invoice',
  className,
}: InvoiceDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      await generateInvoicePdf(invoice)
    } catch (error) {
      console.error('Invoice download failed:', error)
      window.alert('Failed to download invoice. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className={
        className ||
        'inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
      }
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {isDownloading ? 'Generating...' : label}
    </button>
  )
}
