'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { AppStore } from '@/lib/store';
import { Course, CourseDocument, DocumentType } from '@/types';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Eye, 
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // Document upload state
  const [uploadDocType, setUploadDocType] = useState<DocumentType>('learner_guide');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CourseDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const list = await AppStore.fetchCourses();
    setCourses(list);
    if (list.length > 0 && !selectedCourse) {
      setSelectedCourse(list[0]);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newTitle) return;

    const course: Course = {
      id: 'course-' + Math.random().toString(36).substring(2, 9),
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      created_at: new Date().toISOString(),
      documents: []
    };

    await AppStore.saveCourse(course);
    setNewCode('');
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
    await loadCourses();
    setSelectedCourse(course);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course and its associated documents?')) {
      await AppStore.deleteCourse(courseId);
      const updated = courses.filter(c => c.id !== courseId);
      setCourses(updated);
      setSelectedCourse(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCourse) return;

    setIsUploading(true);
    setUploadMessage('Extracting document text...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract text');

      const newDoc: CourseDocument = {
        id: 'doc-' + Math.random().toString(36).substring(2, 9),
        course_id: selectedCourse.id,
        doc_type: uploadDocType,
        file_name: file.name,
        extracted_text: data.extractedText,
        uploaded_at: new Date().toISOString(),
      };

      const updatedDocs = [...(selectedCourse.documents || []), newDoc];
      const updatedCourse: Course = {
        ...selectedCourse,
        documents: updatedDocs,
      };

      await AppStore.saveCourse(updatedCourse);
      setSelectedCourse(updatedCourse);
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      setUploadMessage(`Extracted ${data.charCount.toLocaleString()} characters successfully!`);
      setTimeout(() => setUploadMessage(null), 3500);
    } catch (err: any) {
      console.error(err);
      setUploadMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedCourse) return;
    const updatedDocs = (selectedCourse.documents || []).filter(d => d.id !== docId);
    const updatedCourse: Course = {
      ...selectedCourse,
      documents: updatedDocs,
    };
    await AppStore.saveCourse(updatedCourse);
    setSelectedCourse(updatedCourse);
    setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'learner_guide':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Learner Guide</span>;
      case 'curriculum':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Curriculum</span>;
      case 'workbook':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Workbook Activities</span>;
      case 'model_answers':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Model Answers</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Persistent Course Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Course Library & Document Ingestion
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Upload course curriculums, learner guides, and workbooks once. The Gemini AI Question Generator directly interrogates this text with search-oriented stems.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course Container</span>
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column: Course List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Courses ({courses.length})
            </h2>

            {courses.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
                <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No courses created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-xs text-indigo-400 hover:underline"
                >
                  Create your first course container
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => {
                  const isSelected = selectedCourse?.id === course.id;
                  const docCount = course.documents?.length || 0;
                  return (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                          {course.code}
                        </span>
                        <span className="text-xs text-slate-500">
                          {docCount} {docCount === 1 ? 'doc' : 'docs'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1">{course.title}</h3>
                      {course.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Course Documents & Ingestion */}
          <div className="lg:col-span-8">
            {selectedCourse ? (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {selectedCourse.code}
                      </span>
                      <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
                    </div>
                    {selectedCourse.description && (
                      <p className="text-xs text-slate-400 mt-1.5">{selectedCourse.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/?courseId=${selectedCourse.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Poll with this Course</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(selectedCourse.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Upload Document Box */}
                <div className="mt-6 p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Upload & Ingest Document (PDF, Word DOCX, or TXT)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    The text will be parsed and stored. The Gemini Question Generator references this material to construct authentic learner guide search questions.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value as DocumentType)}
                      className="w-full sm:w-auto px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="learner_guide">Learner Guide</option>
                      <option value="curriculum">Curriculum Framework</option>
                      <option value="workbook">Workbook Activities</option>
                      <option value="model_answers">Model Answers</option>
                    </select>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.docx,.doc,.txt,.md"
                      className="hidden"
                      id="doc-upload-input"
                    />

                    <label
                      htmlFor="doc-upload-input"
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border flex items-center justify-center gap-2 transition-colors ${
                        isUploading
                          ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                          : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Extracting text...' : 'Select File to Upload'}</span>
                    </label>
                  </div>

                  {uploadMessage && (
                    <div className="mt-3 text-xs flex items-center gap-2 text-indigo-300 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{uploadMessage}</span>
                    </div>
                  )}
                </div>

                {/* Uploaded Documents List */}
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Ingested Documents ({selectedCourse.documents?.length || 0})
                  </h3>

                  {(!selectedCourse.documents || selectedCourse.documents.length === 0) ? (
                    <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                      No documents ingested yet. Upload a Learner Guide or Curriculum document above.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCourse.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                              <FileText className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-xs truncate">{doc.file_name}</span>
                                {getDocTypeBadge(doc.doc_type)}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {doc.extracted_text?.length.toLocaleString() || 0} characters extracted • {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                              title="Preview Extracted Text"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Inspect Text</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <div>
                  <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-base font-semibold text-slate-300">Select or Create a Course</p>
                  <p className="text-xs text-slate-500 mt-1">Choose a course from the left panel to manage its curriculum documents.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">Create Course Container</h3>
            <p className="text-xs text-slate-400 mb-5">
              Set up a curriculum container (e.g. OQ99446 Store Person, Supply Chain Operations).
            </p>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Course Code / Unit Standard Code *
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. OQ99446 or US119472"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Warehouse Housekeeping & Safety"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Module Overview
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Occupational skills programme covering safety and GHS hazard identification..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                >
                  Create Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extracted Text Inspector Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>{previewDoc.file_name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted text available to Gemini AI Question Generator ({previewDoc.extracted_text?.length.toLocaleString()} characters)
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs px-2.5 py-1.5"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed border border-slate-800 whitespace-pre-wrap select-text">
              {previewDoc.extracted_text || 'No text extracted.'}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
