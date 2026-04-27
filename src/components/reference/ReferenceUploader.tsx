import { useState, useRef, useCallback } from 'react'
import { usePromptSmithStore } from '@/store/prompt-store'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  CircleNotch, 
  Fingerprint
} from '@phosphor-icons/react'
import type { ReferenceImage, ExtractedTag } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ReferenceUploader() {
  const referenceImages = usePromptSmithStore((s) => s.referenceImages)
  const addReferenceImage = usePromptSmithStore((s) => s.addReferenceImage)
  const removeReferenceImage = usePromptSmithStore((s) => s.removeReferenceImage)
  const [dragActive, setDragActive] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const analyzeImage = useCallback(async (image: ReferenceImage) => {
    setAnalyzingId(image.id)
    
    await new Promise(r => setTimeout(r, 1200))
    
    const mockTags: ExtractedTag[] = [
      { id: 'person', label: 'Person', confidence: 0.98, source: 'clip' },
      { id: 'portrait', label: 'Portrait', confidence: 0.92, source: 'clip' },
      { id: 'modern', label: 'Modern Art', confidence: 0.85, source: 'clip' },
    ]
    
    const updatedImage: ReferenceImage = {
      ...image,
      extractedTags: mockTags,
      analysis: {
        style: 'Modern Photography',
        mood: 'Cinematic',
        dominantColors: ['#6366f1', '#06b6d4', '#000000'],
        composition: {
          ruleOfThirds: true,
          centerComposition: false,
          diagonal: false,
          symmetry: false,
          leadingLines: true,
          depth: 'shallow',
          framing: 'portrait'
        }
      }
    }
    
    addReferenceImage(updatedImage)
    setAnalyzingId(null)
  }, [addReferenceImage])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const image: ReferenceImage = {
          id: crypto.randomUUID(),
          dataUrl: e.target?.result as string,
          extractedTags: [],
          uploadedAt: Date.now(),
          name: file.name,
        }
        analyzeImage(image)
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Fingerprint weight="bold" className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Visual Context</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{referenceImages.length}/3</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative h-16 rounded-2xl border border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 group overflow-hidden",
          dragActive 
            ? "border-accent bg-accent/10" 
            : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
        )}
      >
        <AnimatePresence>
          {dragActive ? (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-accent">
              <Upload weight="bold" className="w-5 h-5 animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">Release</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-white/60 transition-colors">
              <Upload weight="bold" className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Inject Ref</span>
            </div>
          )}
        </AnimatePresence>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
        <AnimatePresence initial={false}>
          {referenceImages.map((img) => (
            <motion.div
              layout
              key={img.id}
              initial={{ scale: 0.8, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.8, opacity: 0, x: -20 }}
              className="relative w-20 h-20 rounded-2xl border border-white/10 overflow-hidden flex-shrink-0 group"
            >
              <img src={img.dataUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); removeReferenceImage(img.id); }}
                  className="p-1.5 rounded-lg bg-destructive text-white hover:scale-110 transition-transform"
                >
                  <X weight="bold" className="w-3 h-3" />
                </button>
              </div>
              {analyzingId === img.id && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                  <CircleNotch weight="bold" className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
              {img.extractedTags.length > 0 && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-accent text-[8px] font-black text-black uppercase">
                  {img.extractedTags.length}N
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {referenceImages.length === 0 && (
          <div className="w-full flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl border-dashed">
            <ImageIcon weight="thin" className="w-8 h-8 text-white/5" />
          </div>
        )}
      </div>
    </div>
  )
}
