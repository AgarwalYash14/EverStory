import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Image, Lock, Globe } from 'lucide-react'
import { useCreatePost, useOptimizeImage } from '../../../services/postsService'
import imageCompression from 'browser-image-compression'

const CreatePost = () => {
    const [caption, setCaption] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [compressing, setCompressing] = useState(false)
    const [imageSize, setImageSize] = useState<{
        original: string
        compressed: string
        optimized?: string
    }>({ original: '0 KB', compressed: '0 KB' })
    const [optimizationDetails, setOptimizationDetails] = useState<any>(null)
    const [optimizing, setOptimizing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    // Use createPost mutation from React Query
    const createPostMutation = useCreatePost()
    const optimizeImageMutation = useOptimizeImage()

    // Calculate file size in KB or MB
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // Handle file selection with compression
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setSelectedFile(null)
            setPreviewUrl(null)
            return
        }

        const file = e.target.files[0]

        // Create preview URL for the selected image
        const fileReader = new FileReader()
        fileReader.onload = () => {
            setPreviewUrl(fileReader.result as string)
        }
        fileReader.readAsDataURL(file)

        // Save original file size
        const originalSize = formatFileSize(file.size)
        setImageSize((prev) => ({ ...prev, original: originalSize }))

        try {
            setCompressing(true)

            // Client-side compression options
            const options = {
                maxSizeMB: 1, // Max file size in MB
                maxWidthOrHeight: 1920, // Max width/height in pixels
                useWebWorker: true,
                initialQuality: 0.8, // Initial quality level
            }

            // Compress image client-side
            const compressedFile = await imageCompression(file, options)

            // Update the file size comparison after client-side compression
            setImageSize((prev) => ({
                ...prev,
                compressed: formatFileSize(compressedFile.size),
            }))

            // Now optimize with server-side (if available)
            try {
                setOptimizing(true)
                const optimizationResult =
                    await optimizeImageMutation.mutateAsync(compressedFile)
                setOptimizationDetails(optimizationResult)

                if (optimizationResult?.bytes) {
                    // Update with final optimized size
                    setImageSize((prev) => ({
                        ...prev,
                        optimized: formatFileSize(optimizationResult.bytes),
                    }))
                }

                // Use the server-optimized URL for preview if available
                if (optimizationResult?.original_url) {
                    // For server-side preview, check if it's a full URL
                    const imageUrl = optimizationResult.original_url.startsWith(
                        'http'
                    )
                        ? optimizationResult.original_url
                        : `http://localhost:8080${optimizationResult.original_url}`

                    setPreviewUrl(imageUrl)
                }
            } catch (error) {
                console.error('Server optimization error:', error)
                // Continue with client-side optimized image
            } finally {
                setOptimizing(false)
            }

            // Use compressed file for upload regardless of server optimization
            setSelectedFile(compressedFile)
            setCompressing(false)
        } catch (error) {
            console.error('Image compression error:', error)
            setCompressing(false)
            // Fallback to original file
            setSelectedFile(file)
        }
    }

    // Open file explorer when clicking on the upload area
    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!selectedFile) {
            alert('Please select an image to upload')
            return
        }

        // Simulate upload progress for better UX
        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval)
                    return prev
                }
                return prev + 10
            })
        }, 200)

        try {
            await createPostMutation.mutateAsync({
                caption,
                is_private: isPrivate,
                // If we have optimization details with a Cloudinary public ID, pass it along
                ...(optimizationDetails?.public_id
                    ? {
                          cloudinary_public_id: optimizationDetails.public_id,
                          image_url: optimizationDetails.original_url,
                      }
                    : {}),
                // Always include the image file as fallback
                image: selectedFile,
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            // Redirect to home page after successful upload
            setTimeout(() => {
                navigate('/')
            }, 1000)
        } catch (error) {
            clearInterval(progressInterval)
            setUploadProgress(0)
            console.error('Error creating post:', error)
            alert('Failed to create post. Please try again.')
        }
    }

    // Calculate optimization message
    const getOptimizationMessage = () => {
        if (optimizing) return 'Further optimizing on server...'
        if (compressing) return 'Optimizing image...'

        const sizes = []
        if (imageSize.original) sizes.push(imageSize.original)
        if (imageSize.compressed) sizes.push(imageSize.compressed)
        if (imageSize.optimized) sizes.push(imageSize.optimized)

        if (sizes.length <= 1) return ''

        return `Optimized: ${sizes[0]} → ${sizes[sizes.length - 1]}`
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="text-neutral-darkest dark:text-neutral-lightest mb-6 text-3xl">
                Create New Post
            </h1>

            <form onSubmit={handleSubmit}>
                {/* Image upload area */}
                <div
                    className={`mb-4 cursor-pointer rounded-lg border-2 border-dashed p-6 ${
                        previewUrl
                            ? 'border-primary-light'
                            : 'border-border-light hover:border-primary-light'
                    } dark:border-border-dark dark:hover:border-primary-light flex items-center justify-center transition-colors`}
                    onClick={handleUploadClick}
                >
                    {previewUrl ? (
                        <div className="w-full">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="mx-auto max-h-96 rounded-lg"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                            {/* Display size comparison */}
                            <div className="text-neutral-medium mt-4 text-center text-sm">
                                <p>{getOptimizationMessage()}</p>

                                {/* Show responsive size options if available */}
                                {optimizationDetails?.responsive_urls && (
                                    <p className="mt-2 text-xs">
                                        {`Responsive sizes: ${optimizationDetails.responsive_urls.map((u: any) => u.width).join('px, ')}px`}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Upload className="text-neutral-medium mx-auto mb-2 h-12 w-12" />
                            <p className="text-neutral-medium text-sm">
                                Click to upload an image
                            </p>
                            <p className="text-neutral-medium mt-1 text-xs">
                                JPG, PNG, GIF files are supported
                            </p>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {uploadProgress > 0 && (
                    <div className="mb-4">
                        <div className="bg-neutral-light dark:bg-neutral-dark h-2.5 w-full rounded-full">
                            <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-neutral-medium mt-1 text-right text-sm">
                            {uploadProgress}%
                        </p>
                    </div>
                )}

                {/* Caption input */}
                <div className="mb-4">
                    <label
                        htmlFor="caption"
                        className="text-neutral-darkest dark:text-neutral-lightest mb-2 block text-sm font-medium"
                    >
                        Caption (optional)
                    </label>
                    <textarea
                        id="caption"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="border-border-light focus:border-primary focus:ring-primary dark:border-border-dark dark:text-neutral-lightest w-full rounded-lg border p-2 dark:bg-transparent"
                        rows={3}
                        placeholder="Write a caption for your post..."
                    ></textarea>
                </div>

                {/* Privacy settings */}
                <div className="mb-6">
                    <span className="text-neutral-darkest dark:text-neutral-lightest mb-2 block text-sm font-medium">
                        Privacy Setting
                    </span>
                    <div className="flex space-x-4">
                        <label
                            className={`flex cursor-pointer items-center rounded-lg border p-3 ${
                                !isPrivate
                                    ? 'border-primary bg-primary-light/20 dark:bg-primary-dark/20'
                                    : 'border-border-light dark:border-border-dark'
                            }`}
                        >
                            <input
                                type="radio"
                                name="privacy"
                                checked={!isPrivate}
                                onChange={() => setIsPrivate(false)}
                                className="hidden"
                            />
                            <Globe className="text-primary mr-2 h-5 w-5" />
                            <div>
                                <p className="text-neutral-darkest dark:text-neutral-lightest font-medium">
                                    Public
                                </p>
                                <p className="text-neutral-medium dark:text-neutral-medium text-xs">
                                    Everyone can see this post
                                </p>
                            </div>
                        </label>

                        <label
                            className={`flex cursor-pointer items-center rounded-lg border p-3 ${
                                isPrivate
                                    ? 'border-primary bg-primary-light/20 dark:bg-primary-dark/20'
                                    : 'border-border-light dark:border-border-dark'
                            }`}
                        >
                            <input
                                type="radio"
                                name="privacy"
                                checked={isPrivate}
                                onChange={() => setIsPrivate(true)}
                                className="hidden"
                            />
                            <Lock className="text-primary mr-2 h-5 w-5" />
                            <div>
                                <p className="text-neutral-darkest dark:text-neutral-lightest font-medium">
                                    Private
                                </p>
                                <p className="text-neutral-medium dark:text-neutral-medium text-xs">
                                    Only your friends can see this post
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="bg-neutral-light text-neutral-dark hover:bg-neutral-light dark:bg-neutral-dark dark:text-neutral-light dark:hover:bg-neutral-dark rounded-lg px-4 py-2 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            !selectedFile ||
                            createPostMutation.isPending ||
                            compressing ||
                            optimizing
                        }
                        className="bg-primary text-neutral-lightest hover:bg-primary-dark disabled:bg-neutral-medium dark:disabled:bg-neutral-dark rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed"
                    >
                        {createPostMutation.isPending
                            ? 'Posting...'
                            : compressing || optimizing
                              ? 'Optimizing...'
                              : 'Create Post'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default CreatePost
