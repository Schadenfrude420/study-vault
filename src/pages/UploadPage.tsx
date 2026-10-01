import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { FileText, UploadCloud, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const degreeDepartments: Record<string, string[]> = {
  'B.Tech': ['Information Technology', 'Electronics & Communication Engineering', 'Energy Engineering', 'Biomedical Engineering'],
  'B.Arch': ['Architecture'],
  'B.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Botany', 'Zoology', 'Environmental Science', 'Biotechnology', 'Computer Science'],
  'B.A': ['English', 'History', 'Political Science', 'Economics', 'Sociology', 'Philosophy', 'Education', 'Khasi', 'Garo', 'Geography'],
  'B.A. LL.B (Hons)': ['Law'],
  'BBA': ['Management'],
  'B.Com': ['Commerce'],
  'BCA': ['Computer Application'],
  'BTTM': ['Tourism and Travel Management'],
  'M.Tech': ['Information Technology', 'Electronics & Communication Engineering', 'Energy Engineering', 'Biomedical Engineering'],
  'M.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Botany', 'Zoology', 'Environmental Science', 'Biotechnology', 'Computer Science', 'Geology', 'Geography', 'Anthropology'],
  'M.A': ['English', 'History', 'Political Science', 'Economics', 'Sociology', 'Philosophy', 'Education', 'Khasi', 'Garo', 'Geography', 'Linguistics', 'Cultural & Creative Studies'],
  'M.Com': ['Commerce'],
  'MBA': ['Management'],
  'MCA': ['Computer Application'],
  'LL.M': ['Law'],
  'M.Ed': ['Education'],
  'Int. M.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology'],
  'Int. M.A': ['English', 'History', 'Political Science', 'Economics'],
  'Int. M.Tech': ['Information Technology', 'Electronics & Communication Engineering'],
}

const degreeSemesterCount: Record<string, number> = {
  'B.Tech': 8, 'B.Arch': 10, 'B.Sc': 6, 'B.A': 6, 'B.A. LL.B (Hons)': 10,
  'BBA': 6, 'B.Com': 6, 'BCA': 6, 'BTTM': 6,
  'M.Tech': 4, 'M.Sc': 4, 'M.A': 4, 'M.Com': 4, 'MBA': 4, 'MCA': 4, 'LL.M': 4, 'M.Ed': 4,
  'Int. M.Sc': 10, 'Int. M.A': 10, 'Int. M.Tech': 10,
}

const CATEGORIES = ['Notes', 'Assignments', 'PYQs', 'Lab Materials', 'Reference Books', 'Syllabus']

const TITLE_MAX = 80
const SUBJECT_MAX = 60

const MAX_FILE_SIZE = 50 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']
const ACCEPT_ATTR = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function validateFile(f: File): string | null {
  const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return 'Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG.'
  }
  if (f.size > MAX_FILE_SIZE) {
    return `File is too large (${formatBytes(f.size)}). Maximum allowed is ${formatBytes(MAX_FILE_SIZE)}.`
  }
  return null
}

export default function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [title, setTitle] = useState('')
  const [degree, setDegree] = useState('')
  const [department, setDepartment] = useState('')
  const [semester, setSemester] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Notes')
  const [file, setFile] = useState<File | null>(null)

  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([])

  const disabled = loading

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('resources').select('subject')
      const unique = Array.from(
        new Set((data || []).map((r) => r.subject).filter(Boolean))
      ).sort() as string[]
      setSubjectSuggestions(unique)
    }
    fetchSubjects()
  }, [])

  const handleFile = (f: File | null) => {
    if (!f) return
    const err = validateFile(f)
    if (err) {
      toast.error(err)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setFile(f)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setTitle('')
    setDegree('')
    setDepartment('')
    setSemester('')
    setSubject('')
    setCategory('Notes')
    setFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!file) {
      toast.error('Please select a file to upload.')
      return
    }

    setLoading(true)
    setError(null)

    let filePath: string | null = null

    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${crypto.randomUUID()}.${ext}`
      filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('study-vault-files')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('study-vault-files')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: title.trim().slice(0, TITLE_MAX),
          degree,
          department,
          semester,
          subject: subject.trim().slice(0, SUBJECT_MAX),
          category,
          file: publicUrl,
          status: 'Approved',
          user_id: user.id,
        })
      if (dbError) throw dbError

      toast.success('Uploaded! Your resource is now live.')
      navigate('/my-uploads')
    } catch (err) {
      // If the file was uploaded but the DB insert failed, clean up the orphan
      if (filePath) {
        await supabase.storage.from('study-vault-files').remove([filePath])
      }
      const message = err instanceof Error ? err.message : 'Something went wrong during upload.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Upload a Resource
          </h1>
          <p className="text-sm text-muted-foreground">
            Share notes, assignments, PYQs, or lab materials with your peers.
          </p>
        </header>

        <form onSubmit={handleUpload} className="space-y-6">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="font-display text-base">Resource Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-foreground">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="e.g., DBMS Unit 3 — Normalization Notes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={TITLE_MAX}
                  disabled={disabled}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Keep it short and descriptive.</p>
                  <p
                    className={`text-xs ${
                      title.length >= TITLE_MAX ? 'text-amber-500' : 'text-muted-foreground'
                    }`}
                  >
                    {title.length}/{TITLE_MAX}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="degree" className="mb-1.5 block text-sm font-medium text-foreground">
                    Degree
                  </label>
                  <select
                    id="degree"
                    className={selectClass}
                    value={degree}
                    onChange={(e) => {
                      setDegree(e.target.value)
                      setDepartment('')
                      setSemester('')
                    }}
                    required
                    disabled={disabled}
                  >
                    <option value="" disabled>Select Degree</option>
                    <optgroup label="Undergraduate">
                      <option value="B.Tech">B.Tech</option>
                      <option value="B.Arch">B.Arch</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="B.A">B.A</option>
                      <option value="B.A. LL.B (Hons)">B.A. LL.B (Hons)</option>
                      <option value="BBA">BBA</option>
                      <option value="B.Com">B.Com</option>
                      <option value="BCA">BCA</option>
                      <option value="BTTM">BTTM</option>
                    </optgroup>
                    <optgroup label="Postgraduate">
                      <option value="M.Tech">M.Tech</option>
                      <option value="M.Sc">M.Sc</option>
                      <option value="M.A">M.A</option>
                      <option value="M.Com">M.Com</option>
                      <option value="MBA">MBA</option>
                      <option value="MCA">MCA</option>
                      <option value="LL.M">LL.M</option>
                      <option value="M.Ed">M.Ed</option>
                    </optgroup>
                    <optgroup label="Integrated">
                      <option value="Int. M.Sc">Int. M.Sc</option>
                      <option value="Int. M.A">Int. M.A</option>
                      <option value="Int. M.Tech">Int. M.Tech</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-foreground">
                    Department
                  </label>
                  <select
                    id="department"
                    className={selectClass}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    disabled={disabled || !degree}
                  >
                    <option value="" disabled>
                      {degree ? 'Select Department' : 'Select a Degree first'}
                    </option>
                    {degree && degreeDepartments[degree]?.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="semester" className="mb-1.5 block text-sm font-medium text-foreground">
                    Semester
                  </label>
                  <select
                    id="semester"
                    className={selectClass}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                    disabled={disabled || !degree}
                  >
                    <option value="" disabled>
                      {degree ? 'Select Semester' : 'Select a Degree first'}
                    </option>
                    {degree && Array.from(
                      { length: degreeSemesterCount[degree] || 8 },
                      (_, i) => i + 1
                    ).map((s) => (
                      <option key={s} value={s.toString()}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    id="category"
                    className={selectClass}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    disabled={disabled}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-foreground">
                  Subject
                </label>
                <Input
                  id="subject"
                  list="subject-suggestions"
                  placeholder="e.g., DBMS, Organic Chemistry, Microeconomics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={SUBJECT_MAX}
                  disabled={disabled}
                />
                <datalist id="subject-suggestions">
                  {subjectSuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="font-display text-base">File</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload file"
                onDragOver={(e) => {
                  e.preventDefault()
                  if (!disabled) setIsDragging(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                }}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className={[
                  'relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
                  disabled ? 'pointer-events-none opacity-60' : '',
                ].join(' ')}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTR}
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  disabled={disabled}
                />

                {file ? (
                  <div className="flex w-full items-center gap-3 text-left">
                    <div className="rounded-md border border-border bg-background p-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      aria-label="Remove file"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Drag &amp; drop a file here, or click to browse
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        PDF, DOC, DOCX, PPT, PPTX, JPG, PNG — max 50 MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={disabled}
            >
              Reset
            </Button>
            <Button type="submit" disabled={disabled || !file}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}