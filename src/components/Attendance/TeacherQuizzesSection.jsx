import React, { useState, useMemo } from 'react';
import { Search, Eye, Edit3, Trash2, Copy, BookOpen, Clock, Award, HelpCircle } from 'lucide-react';
import { getFirebaseDb } from '../../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { notifyClassStudents } from './notificationUtils';
import QuizCreatorModal from './QuizCreatorModal.jsx';

export function TeacherQuizzesSection({ 
  quizzes, 
  quizResults, 
  classes, 
  notify, 
  user 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal editing States
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [questionsOpen, setQuestionsOpen] = useState(null); // view list of questions for a quiz
  const [deleteTarget, setDeleteTarget] = useState(null);

  const db = getFirebaseDb();
  const miniBtnStyle = (bg, color = '#fff') => ({
    border: 'none',
    background: bg,
    color,
    fontSize: 11,
    fontWeight: 800,
    padding: '8px 10px',
    borderRadius: 10,
    cursor: 'pointer'
  });

  // Combine & compute stats
  const computedQuizzes = useMemo(() => {
    return quizzes.map(q => {
      // Find results/attempts for this quiz
      const attempts = quizResults.filter(r => r.quizId === q.id);
      const attemptsCount = attempts.length;
      
      // Calculate average score percentage
      let avgScore = 0;
      if (attemptsCount > 0) {
        const sum = attempts.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
        avgScore = Math.round((sum / attemptsCount) * 10) / 10;
      }

      return {
        ...q,
        className: classes.find(c => c.id === q.classId)?.className || q.className || 'Unknown Class',
        attemptsCount,
        avgScore
      };
    });
  }, [quizzes, quizResults, classes]);

  // Filter & sort
  const filteredQuizzes = computedQuizzes.filter(q => {
    const titleMatch = (q.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (q.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSearch = titleMatch || descMatch;

    const matchClass = classFilter === 'all' || q.classId === classFilter;

    return matchSearch && matchClass;
  }).sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
    return sortBy === 'newest' ? tB - tA : tA - tB;
  });

  const handleDuplicateQuiz = async (quiz) => {
    try {
      const dupData = {
        title: `${quiz.title} - Copy`,
        description: quiz.description || '',
        classId: quiz.classId || '',
        classCode: quiz.classCode || '',
        teacherId: user.uid,
        teacherName: user.displayName || 'STEA Mwalimu',
        questions: quiz.questions || [],
        durationMinutes: Number(quiz.durationMinutes) || 15,
        status: quiz.status || 'published',
        allowQuizRetake: quiz.allowQuizRetake || false,
        showQuizScoreImmediately: quiz.showQuizScoreImmediately !== undefined ? quiz.showQuizScoreImmediately : true,
        dueDate: quiz.dueDate || null,
        allowLateQuiz: quiz.allowLateQuiz || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'quizzes'), dupData);
      notify('Quiz imeshughulikiwa na kunakiliwa kikamilifu!');
    } catch(err) {
      console.error(err);
      notify('Imeshindikana kunakili Quiz.', 'error');
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    try {
      await deleteDoc(doc(db, 'quizzes', quiz.id));
      notify('Quiz imefutwa.');
    } catch(err) {
      notify('Kuna makosa yamejitokeza.', 'error');
    }
  };

  const openEditModal = (quiz) => setEditingQuiz(quiz);

  const updateQuizStatus = async (quiz, status) => {
    try {
      const prevStatus = quiz.status || 'published';
      await updateDoc(doc(db, 'quizzes', quiz.id), { status, updatedAt: serverTimestamp() });
      if (prevStatus !== 'published' && status === 'published') {
        await notifyClassStudents(quiz.classId, {
          type: 'quiz',
          title: 'New quiz published',
          message: `${quiz.title} is now available.`,
          link: 'quizzes',
          createdBy: user?.uid || quiz.teacherId || ''
        });
      }
      notify(status === 'closed' ? 'Quiz imefungwa.' : 'Quiz imefunguliwa.');
    } catch (err) {
      notify('Imeshindikana kubadilisha hali ya quiz.', 'error');
    }
  };

  const extendQuizDeadline = async (quiz, ms) => {
    try {
      const base = quiz.dueDate?.toDate ? quiz.dueDate.toDate() : (quiz.dueDate ? new Date(quiz.dueDate) : new Date());
      const nextDue = new Date(base.getTime() + ms);
      await updateDoc(doc(db, 'quizzes', quiz.id), { dueDate: Timestamp.fromDate(nextDue), updatedAt: serverTimestamp() });
      await notifyClassStudents(quiz.classId, {
        type: 'quiz',
        title: 'Quiz deadline updated',
        message: `${quiz.title} deadline has been extended.`,
        link: 'quizzes',
        createdBy: user?.uid || quiz.teacherId || ''
      });
      notify('Quiz deadline updated.');
    } catch (err) {
      notify('Imeshindikana kuongeza muda wa quiz.', 'error');
    }
  };

  const toggleQuizRetry = async (quiz, allow) => {
    try {
      await updateDoc(doc(db, 'quizzes', quiz.id), { allowQuizRetake: allow, updatedAt: serverTimestamp() });
      notify(allow ? 'Retry imewashwa.' : 'Retry imezimwa.');
    } catch (err) {
      notify('Imeshindikana kusasisha retry.', 'error');
    }
  };

  const resetStudentAttempt = async (quiz, sub) => {
    try {
      await deleteDoc(doc(db, 'quizResults', `${quiz.id}_${sub.studentUid || sub.studentUserId || sub.userId}`));
      notify('Attempt ime-reset.');
    } catch (err) {
      notify('Imeshindikana ku-reset attempt.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>Quizzes Command Center</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 14 }}>Create, edit, duplicate, and analyze performance statistics for student quizzes</p>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div style={{ position: 'relative', flex: '2 1 250px' }}>
          <input
            type="text"
            placeholder="Search quiz title, topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 16px 0 40px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14, top: 14 }} />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          >
            <option value="all">Class Selector (All Classes)</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.className || c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', height: 42, padding: '0 12px', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          >
            <option value="newest">Zamani kidogo (Newest first)</option>
            <option value="oldest">Zamani sana (Oldest first)</option>
          </select>
        </div>
      </div>

      {/* Quizzes list table */}
      {filteredQuizzes.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.05)' }}>
          <BookOpen size={48} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ color: '#fff', fontSize: 16, margin: '0 0 8px 0' }}>No quizzes found</h4>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 13 }}>Try adjusting search parameters or create a new quiz.</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 650 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase' }}>Quiz Name</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase' }}>Class Name</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', textAlign: 'center' }}>Questions</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', textAlign: 'center' }}>Attempts</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', textAlign: 'center' }}>Avg Score</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.map(q => {
                const createdAtTs = q.createdAt?.toMillis ? q.createdAt.toMillis() : (q.createdAt instanceof Date ? q.createdAt.getTime() : 0);
                // eslint-disable-next-line react-hooks/purity
                const isNew = createdAtTs > 0 && (Date.now() - createdAtTs) < 24 * 60 * 60 * 1000;
                
                return (
                <tr key={q.id} style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  transition: 'all 0.3s', 
                  cursor: 'default',
                  background: isNew ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  boxShadow: isNew ? 'inset 2px 0 0 #3B82F6' : 'none'
                }} className="hover:bg-white/5">
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>{q.title}</div>
                      {isNew && <span style={{ fontSize: 9, background: '#3B82F6', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}>New</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', gap: 10, marginTop: 4 }}>
                      <span>⏱️ {q.durationMinutes} min</span>
                      <span>📖 Code: {q.classCode || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{q.className}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, fontSize: 13 }}>{q.questions?.length || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                      {q.attemptsCount}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {q.attemptsCount > 0 ? (
                      <span style={{ color: q.avgScore >= 70 ? '#10B981' : (q.avgScore >= 50 ? '#F5A623' : '#EF4444'), fontWeight: 900, fontSize: 12 }}>
                        {q.avgScore}%
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 800,
                      background: q.status !== 'draft' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
                      color: q.status !== 'draft' ? '#10B981' : 'rgba(255,255,255,0.4)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      textTransform: 'uppercase'
                    }}>
                      {q.status || 'published'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setQuestionsOpen(q)}
                        style={{ background: 'rgba(255,255,255,0.04)', border: 'none', padding: 8, borderRadius: 8, color: '#fff', cursor: 'pointer' }}
                        title="View Questions"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        onClick={() => openEditModal(q)}
                        style={{ background: 'rgba(255,255,255,0.04)', border: 'none', padding: 8, borderRadius: 8, color: '#F5A623', cursor: 'pointer' }}
                        title="Edit metadata"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDuplicateQuiz(q)}
                        style={{ background: 'rgba(255,255,255,0.04)', border: 'none', padding: 8, borderRadius: 8, color: '#3B82F6', cursor: 'pointer' }}
                        title="Duplicate Quiz"
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(q)}
                        style={{ background: 'rgba(239,68,68,0.08)', border: 'none', padding: 8, borderRadius: 8, color: '#EF4444', cursor: 'pointer' }}
                        title="Delete Quiz"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Questions list drawer modal */}
      {questionsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 4500, padding: 20 }}>
          <div style={{ background: '#0c0e14', width: '100%', maxWidth: 550, maxHeight: '85vh', overflowY: 'auto', padding: 28, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#F5A623' }}>Maswali yote: {questionsOpen.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>Class code: {questionsOpen.classCode || 'N/A'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button onClick={() => window.open(`/attendance/quiz/${questionsOpen.id}?preview=1`, '_blank', 'noopener,noreferrer')} style={miniBtnStyle('#3B82F6')}>Preview as Student</button>
                <button onClick={() => openEditModal(questionsOpen)} style={miniBtnStyle('#F5A623', '#000')}>Edit Quiz</button>
                <button onClick={() => updateQuizStatus(questionsOpen, questionsOpen.status === 'closed' ? 'published' : 'closed')} style={miniBtnStyle(questionsOpen.status === 'closed' ? '#10B981' : '#ef4444')}>{questionsOpen.status === 'closed' ? 'Open Quiz' : 'Close Quiz'}</button>
                <button onClick={() => extendQuizDeadline(questionsOpen, 10 * 60 * 1000)} style={miniBtnStyle('rgba(255,255,255,0.08)')}>+10 min</button>
                <button onClick={() => extendQuizDeadline(questionsOpen, 30 * 60 * 1000)} style={miniBtnStyle('rgba(255,255,255,0.08)')}>+30 min</button>
                <button onClick={() => extendQuizDeadline(questionsOpen, 60 * 60 * 1000)} style={miniBtnStyle('rgba(255,255,255,0.08)')}>+1 hour</button>
                <button onClick={() => extendQuizDeadline(questionsOpen, 24 * 60 * 60 * 1000)} style={miniBtnStyle('rgba(255,255,255,0.08)')}>+1 day</button>
                <button onClick={() => toggleQuizRetry(questionsOpen, !questionsOpen.allowQuizRetake)} style={miniBtnStyle(questionsOpen.allowQuizRetake ? '#ef4444' : '#10B981')}>{questionsOpen.allowQuizRetake ? 'Disable Retry' : 'Allow Retry'}</button>
                <button onClick={() => setQuestionsOpen(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            {(() => {
              const attempts = quizResults.filter(r => r.quizId === questionsOpen.id);
              const attemptedStudentIds = new Set(attempts.map(a => a.studentUid || a.studentUserId || a.userId).filter(Boolean));
              const classObj = classes.find(c => c.id === questionsOpen.classId);
              const totalStudents = classObj?.students?.length || classObj?.classStudents?.length || 0;
              const scores = attempts.map(a => Number(a.percentage) || 0);
              const avg = scores.length ? Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length) : 0;
              const highest = scores.length ? Math.max(...scores) : 0;
              const lowest = scores.length ? Math.min(...scores) : 0;
              const passRate = scores.length ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : 0;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
                  {[
                    ['Students attempted', attempts.length],
                    ['Students pending', Math.max(0, totalStudents - attemptedStudentIds.size)],
                    ['Average score', `${avg}%`],
                    ['Highest score', `${highest}%`],
                    ['Lowest score', `${lowest}%`],
                    ['Pass rate', `${passRate}%`]
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,0.35)', fontWeight: 900 }}>{label}</div>
                      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: '#fff' }}>{value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {questionsOpen.questions?.map((q, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ background: '#F5A623', color: '#000', borderRadius: '50%', width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{idx + 1}</span>
                    <span>{q.questionText}</span>
                  </div>

                  <div style={{ display: 'grid', gap: 6, marginLeft: 26, marginBottom: 10 }}>
                    {q.options?.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.correctAnswerIndex;
                      return (
                        <div key={optIdx} style={{
                          background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                          border: isCorrect ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12,
                          color: isCorrect ? '#10B981' : '#fff',
                          fontWeight: isCorrect ? 800 : 500
                        }}>
                          {opt} {isCorrect && '✓ (Sahihi)'}
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 26px', fontStyle: 'italic' }}>
                      💡 <b>Ufafanuzi:</b> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {(() => {
              const attempts = quizResults.filter(r => r.quizId === questionsOpen.id);
              return (
                <div style={{ marginTop: 24, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h4 style={{ margin: 0, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Student Attempts</h4>
                  {attempts.length === 0 ? (
                    <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>No attempts yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                      {attempts.map((sub) => {
                        const attemptCount = Array.isArray(sub.attempts) ? sub.attempts.length : (sub.attemptNumber || 1);
                        return (
                          <div key={sub.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontWeight: 900, fontSize: 14 }}>{sub.studentName}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{sub.studentRegNo || sub.studentId || 'No ID'} · Attempts: {attemptCount}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, fontWeight: 900, color: '#F5A623' }}>{Math.round(Number(sub.percentage) || 0)}%</span>
                                <button onClick={() => resetStudentAttempt(questionsOpen, sub)} style={miniBtnStyle('rgba(255,255,255,0.08)')}>Reset attempt</button>
                                <button onClick={() => toggleQuizRetry(questionsOpen, true)} style={miniBtnStyle('#10B981')}>Allow one extra retry</button>
                              </div>
                            </div>
                            {Array.isArray(sub.attempts) && sub.attempts.length > 0 && (
                              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                                {sub.attempts.map((att, idx) => (
                                  <div key={idx} style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                                    Attempt {att.attemptNumber || idx + 1}: {Math.round(Number(att.percentage) || 0)}%
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            
            <button
               onClick={() => setQuestionsOpen(null)}
               style={{ width: '100%', background: '#F5A623', border: 'none', color: '#000', fontWeight: 900, borderRadius: 12, padding: 14, marginTop: 24, cursor: 'pointer' }}
            >
              Funga (Close Overview)
            </button>
          </div>
        </div>
      )}

      {editingQuiz && (
        <QuizCreatorModal
          classId={editingQuiz.classId}
          teacherId={user?.uid}
          classData={classes.find(c => c.id === editingQuiz.classId)}
          teacherName={user?.displayName}
          quiz={editingQuiz}
          onClose={() => setEditingQuiz(null)}
          onUpdated={() => setEditingQuiz(null)}
        />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4500, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ background: '#0c0e14', padding: 24, borderRadius: 20, maxWidth: 420, width: '100%', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Delete quiz?</h3>
            <p style={{ margin: '12px 0 0', color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>{deleteTarget.title}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={async () => { await handleDeleteQuiz(deleteTarget); setDeleteTarget(null); }} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '12px 14px', background: '#dc2626', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
