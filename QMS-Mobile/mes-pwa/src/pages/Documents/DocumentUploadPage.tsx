

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Send, FileText, CheckCircle2 } from 'lucide-react'
import { Card, Button, Textarea, FileUpload, Loader } from '../../components/ui'
import { api, apiUpload, getErrorMessage } from '../../api/client'
import type { QmsDocument, DocumentVersion } from '../../types'

const DocumentUploadPage = () => {
  const { id: documentId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [document, setDocument] = useState<QmsDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [changeDescription, setChangeDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedVersion, setUploadedVersion] = useState<DocumentVersion | null>(null)
  const [submittingForReview, setSubmittingForReview] = useState(false)

  useEffect(() => {
    if (documentId) loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<QmsDocument>(`/documents/${documentId}`)
      setDocument(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentId) return

    try {
      setUploading(true)
      setError(null)

      // Step 1: Create version
      const { data: version } = await api.post<DocumentVersion>(`/documents/${documentId}/versions`, {
        changeDescription: changeDescription.trim() || undefined,
      })

      // Step 2: Upload file to version
      const formData = new FormData()
      formData.append('file', selectedFile)

      await apiUpload(`/documents/versions/${version.id}/upload`, formData)

      setUploadedVersion(version)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!uploadedVersion) return

    try {
      setSubmittingForReview(true)
      await api.post(`/documents/versions/${uploadedVersion.id}/submit`)
      navigate(`/documents/${documentId}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmittingForReview(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  if (error && !document) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate('/documents')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={20} />}
          onClick={() => navigate(`/documents/${documentId}`)}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Загрузка файла</h1>
          {document && (
            <p className="text-slate-400 text-sm truncate">{document.code} — {document.title}</p>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      {uploadedVersion ? (
        <Card className="p-5">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Файл загружен</h2>
            <p className="text-slate-400 text-sm mb-6">
              Версия v{uploadedVersion.versionNumber} успешно создана
            </p>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/documents/${documentId}`)}
              >
                К документу
              </Button>
              <Button
                className="flex-1"
                icon={<Send size={18} />}
                onClick={handleSubmitForReview}
                loading={submittingForReview}
              >
                Отправить на согласование
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-5 space-y-4">
            <FileUpload
              label="Файл документа"
              onFileSelect={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />

            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-surface-light rounded-xl">
                <FileText size={20} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                  </p>
                </div>
              </div>
            )}

            <Textarea
              label="Описание изменений"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Опишите что изменилось в этой версии"
            />
          </Card>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => navigate(`/documents/${documentId}`)}
            >
              Отмена
            </Button>
            <Button
              className="flex-1"
              icon={<Upload size={18} />}
              onClick={handleUpload}
              loading={uploading}
              disabled={!selectedFile}
            >
              Загрузить
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default DocumentUploadPage
