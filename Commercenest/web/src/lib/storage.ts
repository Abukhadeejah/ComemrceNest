import { supabaseAdmin } from '@/server/supabaseAdmin'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export class StorageService {
  private static bucketName = 'product-images'

  /**
   * Upload a single image to Supabase Storage
   */
  static async uploadImage(
    file: File, 
    tenantId: string, 
    productId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomId}.${extension}`
      
      // Create path with tenant isolation
      const path = productId 
        ? `${tenantId}/products/${productId}/${filename}`
        : `${tenantId}/temp/${filename}`

      // Upload file
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(this.bucketName)
        .getPublicUrl(path)

      return {
        url: urlData.publicUrl,
        path: path
      }
    } catch (error) {
      return {
        url: '',
        path: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadImages(
    files: File[], 
    tenantId: string, 
    productId?: string,
    onProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadImage(
        files[i], 
        tenantId, 
        productId,
        (progress) => onProgress?.(i, progress)
      )
      results.push(result)
    }
    
    return results
  }

  /**
   * Delete an image from storage
   */
  static async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([path])

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }

      return true
    } catch (error) {
      // Failed to delete image
      return false
    }
  }

  /**
   * Get signed URL for private images
   */
  static async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .createSignedUrl(path, expiresIn)

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`)
      }

      return data.signedUrl
    } catch (error) {
      // Failed to get signed URL
      return null
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'File too large. Maximum size is 5MB.' 
      }
    }

    return { valid: true }
  }

  /**
   * Compress image before upload (client-side)
   */
  static async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }
}

