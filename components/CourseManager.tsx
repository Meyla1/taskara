
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type Course = {
  id: string;
  name: string;
  created_at?: string;
};

export const COURSE_UPDATE_EVENT = 'taskara-courses-updated';

export function notifyCoursesUpdated() {
  window.dispatchEvent(new Event(COURSE_UPDATE_EVENT));
}

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');

  async function loadCourses(currentUserId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, created_at')
      .eq('user_id', currentUserId)
      .order('name', { ascending: true });

    if (error) throw error;

    setCourses((data || []) as Course[]);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
        }

        if (!active) return;

        setUserId(user.id);

        const { data, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (coursesError) throw coursesError;

        if (active) {
          setCourses((data || []) as Course[]);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Gagal memuat mata kuliah.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  function openAddForm() {
    setEditingId(null);
    setCourseName('');
    setShowForm(true);
    setErrorMessage('');
  }

  function openEditForm(course: Course) {
    setEditingId(course.id);
    setCourseName(course.name);
    setShowForm(true);
    setErrorMessage('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setCourseName('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !courseName.trim()) return;

    const cleanName = courseName.trim();

    const duplicate = courses.some(
      (course) =>
        course.name.toLowerCase() === cleanName.toLowerCase() &&
        course.id !== editingId
    );

    if (duplicate) {
      setErrorMessage('Mata kuliah dengan nama tersebut sudah ada.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from('courses')
          .update({ name: cleanName })
          .eq('id', editingId)
          .eq('user_id', userId)
          .select('id, name, created_at')
          .single();

        if (error) throw error;

        // Perbarui nama Course pada Task yang terhubung.
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ course_name: cleanName })
          .eq('course_id', editingId)
          .eq('user_id', userId);

        if (taskError) throw taskError;

        setCourses((current) =>
          current
            .map((course) =>
              course.id === editingId ? (data as Course) : course
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert({
            user_id: userId,
            name: cleanName,
          })
          .select('id, name, created_at')
          .single();

        if (error) throw error;

        setCourses((current) =>
          [...current, data as Course].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
      }

      notifyCoursesUpdated();
      closeForm();
    } catch (error) {
      console.error('Gagal menyimpan mata kuliah:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan mata kuliah.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    if (!userId) return;

    const confirmed = window.confirm(
      `Yakin ingin menghapus mata kuliah "${course.name}"? Tugas yang terkait tidak akan ikut terhapus.`
    );

    if (!confirmed) return;

    setErrorMessage('');

    try {
      // Lepaskan hubungan Course dari Task, tetapi pertahankan nama lamanya.
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ course_id: null })
        .eq('course_id', course.id)
        .eq('user_id', userId);

      if (taskError) throw taskError;

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id)
        .eq('user_id', userId);

      if (error) throw error;

      setCourses((current) =>
        current.filter((item) => item.id !== course.id)
      );

      notifyCoursesUpdated();
    } catch (error) {
      console.error('Gagal menghapus mata kuliah:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Gagal menghapus mata kuliah.'
      );
    }
  }

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="panel">
      <style>{`
        .course-manager { width: 100%; }
        .course-manager-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin: 20px 0; flex-wrap: wrap;
        }
        .course-manager-search {
          display: flex; align-items: center; gap: 8px; flex: 1;
          max-width: 340px; min-width: 180px; height: 40px;
          padding: 0 12px; border: 1px solid var(--border);
          border-radius: 9px; background: white; color: var(--muted);
        }
        .course-manager-search input {
          width: 100%; border: none; outline: none;
          background: transparent; color: var(--ink); font: inherit;
          font-size: 12px;
        }
        .course-manager-add {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; min-height: 40px; padding: 0 15px; border: none;
          border-radius: 9px; background: var(--brand); color: white;
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .course-manager-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        .course-manager-card {
          padding: 17px; border: 1px solid var(--border);
          border-radius: 12px; background: white; transition: .2s ease;
          min-width: 0;
        }
        .course-manager-card:hover {
          border-color: #c8c0e5; transform: translateY(-2px);
          box-shadow: 0 5px 18px rgba(50, 40, 90, .05);
        }
        .course-manager-card-top {
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .course-manager-icon {
          width: 42px; height: 42px; display: grid; place-items: center;
          border-radius: 11px; background: var(--brand-soft); color: var(--brand);
        }
        .course-manager-actions { display: flex; gap: 4px; }
        .course-manager-actions button {
          width: 30px; height: 30px; display: grid; place-items: center;
          border: none; border-radius: 7px; background: transparent;
          color: var(--muted); cursor: pointer;
        }
        .course-manager-actions button:hover {
          background: var(--brand-soft); color: var(--brand);
        }
        .course-manager-actions button.delete:hover {
          background: #fff0f1; color: var(--danger);
        }
        .course-manager-card h3 {
          margin: 16px 0 6px; font-size: 14px; color: var(--ink);
          overflow-wrap: anywhere;
        }
        .course-manager-card p { margin: 0; font-size: 11px; color: var(--muted); }
        .course-manager-form {
          margin: 18px 0; padding: 18px; border: 1px solid var(--border);
          border-radius: 12px; background: #fbfaff;
        }
        .course-manager-form label {
          display: block; margin: 14px 0 7px; font-size: 11px;
          font-weight: 600; color: var(--ink);
        }
        .course-manager-form input {
          width: 100%; height: 42px; box-sizing: border-box; padding: 0 12px;
          border: 1px solid var(--border); border-radius: 8px;
          background: white; outline: none; font: inherit;
          font-size: 12px; color: var(--ink);
        }
        .course-manager-form input:focus { border-color: var(--brand); }
        .course-manager-form-actions {
          display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;
        }
        .course-manager-form-actions button {
          min-height: 36px; padding: 0 13px; border-radius: 8px;
          font: inherit; font-size: 11px; font-weight: 600; cursor: pointer;
        }
        .course-manager-cancel {
          border: 1px solid var(--border); background: white; color: var(--muted);
        }
        .course-manager-save {
          display: inline-flex; align-items: center; gap: 6px;
          border: none; background: var(--brand); color: white;
        }
        .course-manager-save:disabled { opacity: .6; cursor: not-allowed; }
        .course-manager-error {
          padding: 10px 12px; margin: 12px 0; border-radius: 8px;
          background: #fff0f1; color: #b75c6b; font-size: 11px;
          overflow-wrap: anywhere;
        }
        .course-manager-empty {
          padding: 40px 15px; text-align: center; color: var(--muted);
        }
        .course-manager-empty svg { margin-bottom: 10px; opacity: .55; }
        .course-manager-empty strong {
          display: block; margin-bottom: 6px; color: var(--ink); font-size: 13px;
        }
        .course-manager-empty p { margin: 0; font-size: 11px; }
        @media (max-width: 520px) {
          .course-manager-toolbar { align-items: stretch; }
          .course-manager-search { max-width: none; flex-basis: 100%; }
          .course-manager-add { width: 100%; }
          .course-manager-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="panel-heading">
        <div>
          <h2>My Courses</h2>
          <p>Manage and organize your university courses.</p>
        </div>
        <BookOpen size={20} />
      </div>

      {errorMessage && (
        <div className="course-manager-error">{errorMessage}</div>
      )}

      {showForm && (
        <form className="course-manager-form" onSubmit={handleSubmit}>
          <strong style={{ fontSize: '13px' }}>
            {editingId ? 'Edit course' : 'Add a new course'}
          </strong>

          <label htmlFor="course-name">Course name</label>

          <input
            id="course-name"
            autoFocus
            required
            maxLength={100}
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            placeholder="Contoh: Biostatistik"
          />

          <div className="course-manager-form-actions">
            <button
              type="button"
              className="course-manager-cancel"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="course-manager-save"
              disabled={saving || !courseName.trim()}
            >
              {saving && <Loader2 size={14} />}
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add course'}
            </button>
          </div>
        </form>
      )}

      <div className="course-manager-toolbar">
        <div className="course-manager-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses..."
          />
        </div>

        <button className="course-manager-add" onClick={openAddForm}>
          <Plus size={16} />
          Add course
        </button>
      </div>

      {loading ? (
        <div className="course-manager-empty">
          <Loader2 size={25} />
          <p>Loading your courses...</p>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="course-manager-grid">
          {filteredCourses.map((course) => (
            <article className="course-manager-card" key={course.id}>
              <div className="course-manager-card-top">
                <div className="course-manager-icon">
                  <GraduationCap size={21} />
                </div>

                <div className="course-manager-actions">
                  <button
                    onClick={() => openEditForm(course)}
                    aria-label={`Edit ${course.name}`}
                    title="Edit course"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    className="delete"
                    onClick={() => handleDelete(course)}
                    aria-label={`Delete ${course.name}`}
                    title="Delete course"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3>{course.name}</h3>

              <p>
                Added{' '}
                {course.created_at
                  ? new Date(course.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'to your courses'}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="course-manager-empty">
          <BookOpen size={30} />
          <strong>{search ? 'No matching courses' : 'No courses yet'}</strong>
          <p>
            {search
              ? 'Coba kata kunci pencarian yang lain.'
              : 'Tambahkan mata kuliah pertamamu untuk mulai mengatur jadwal kuliah.'}
          </p>
        </div>
      )}

      <p style={{ marginTop: '18px', fontSize: '10px', color: 'var(--muted)' }}>
        {courses.length} course{courses.length !== 1 ? 's' : ''} in your list
      </p>
    </section>
  );
}
