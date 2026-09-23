import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

// Define all departments for each degree
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
  'Int. M.Tech': ['Information Technology', 'Electronics & Communication Engineering']
}

// Define the total number of semesters for each degree
const degreeSemesterCount: Record<string, number> = {
  'B.Tech': 8,
  'B.Arch': 10,
  'B.Sc': 6,
  'B.A': 6,
  'B.A. LL.B (Hons)': 10,
  'BBA': 6,
  'B.Com': 6,
  'BCA': 6,
  'BTTM': 6,
  'M.Tech': 4,
  'M.Sc': 4,
  'M.A': 4,
  'M.Com': 4,
  'MBA': 4,
  'MCA': 4,
  'LL.M': 4,
  'M.Ed': 4,
  'Int. M.Sc': 10,
  'Int. M.A': 10,
  'Int. M.Tech': 10
}

export default function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [degree, setDegree] = useState('')
  const [department, setDepartment] = useState('')
  const [semester, setSemester] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Notes')
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !user) return
    setLoading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

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
          title,
          degree,
          department,
          semester,
          subject,
          category,
          file: publicUrl,
          status: 'Approved',
          user_id: user.id
        })

      if (dbError) throw dbError

      navigate('/browse')
    } catch (err: any) {
      setError(err.message || 'Something went wrong during upload.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upload a Resource</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input 
                placeholder="e.g., Study Vault ER Diagram" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Degree</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={degree}
                  onChange={(e) => {
                    setDegree(e.target.value);
                    setDepartment(''); // Reset department
                    setSemester('');   // Reset semester
                  }}
                  required
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
                <label className="text-sm font-medium mb-1 block">Department</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  {!degree ? (
                    <option value="" disabled>Please select a Degree first</option>
                  ) : (
                    <>
                      <option value="" disabled>Select Department</option>
                      {degreeDepartments[degree]?.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Semester</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                >
                  {!degree ? (
                    <option value="" disabled>Please select a Degree first</option>
                  ) : (
                    <>
                      <option value="" disabled>Select Semester</option>
                      {Array.from({ length: degreeSemesterCount[degree] || 8 }, (_, i) => i + 1).map((s) => (
                        <option key={s} value={s.toString()}>{s}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Subject</label>
                <Input
                  placeholder="e.g., DBMS, Organic Chemistry, Microeconomics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="Notes">Notes</option>
                <option value="Assignments">Assignments</option>
                <option value="PYQs">PYQs</option>
                <option value="Lab Materials">Lab Materials</option>
                <option value="Reference Books">Reference Books</option>
                <option value="Syllabus">Syllabus</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">File</label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}