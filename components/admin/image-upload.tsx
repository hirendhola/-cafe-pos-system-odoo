"use client"

import * as React from "react"

import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { extractErrorMessage } from "@/lib/form-error"
import { cn } from "@/lib/utils"

const MAX_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]

export function ImageUpload({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string
  value?: string | null
  onChange: (url: string) => void
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)

  const upload = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG, WEBP, GIF, or AVIF image.")
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error("Image must be smaller than 5MB.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    if (value) formData.append("previousUrl", value)

    setUploading(true)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(extractErrorMessage(data, "Failed to upload image."))
        return
      }

      const data = (await res.json()) as { url: string }
      onChange(data.url)
    } finally {
      setUploading(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) void upload(file)
  }

  const handleRemove = async () => {
    const url = value
    onChange("")

    if (url) {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).catch(() => {})
    }
  }

  return (
    <div
      className={cn(
        "group relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-input",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragActive(false)
        handleFiles(event.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Product" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus /> Replace
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={handleRemove} disabled={uploading}>
              <X /> Remove
            </Button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="size-6" />
          <span className="font-medium text-foreground">Click to upload or drag an image here</span>
          <span className="text-xs">JPG, PNG, WEBP, GIF or AVIF — up to 5MB</span>
        </button>
      )}

      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : null}
    </div>
  )
}
