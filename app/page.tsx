
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  LayoutDashboard, ListTodo, CalendarDays, BookOpen,
  ChartNoAxesCombined, Search, Bell, Plus, ChevronRight,
  ChevronLeft, Clock3, CheckCircle2, Circle, MoreHorizontal,
  Sparkles, Menu, X, Trash2, Pencil, LogOut, UserRound
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CourseManager, {
  COURSE_UPDATE_EVENT,
} from '@/components/CourseManager';

type Priority = 'High' | 'Medium' | 'Low';

type Course = {
  id: string;
  name: string;
  created_at?: string;
};

type Task = {
  id: string;
  title: string;
  course: string;
  courseId: string | null;
  due: string;
  priority: Priority;
  done: boolean;
};

type TaskFilter = 'All' | 'Active' | 'Completed';

type DatabaseTask = {
  id: string;
  title: string;
  course_id: string | null;
  course_name: string | null;
  due_date: string | null;
  priority: string | null;
  is_completed: boolean | null;
};

const STORAGE_KEY = 'taskara-tasks-v1';
const CREATE_COURSE = '__create__';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'My Tasks', icon: ListTodo },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'My Courses', icon: BookOpen },
  { label: 'Progress', icon: ChartNoAxesCombined },
];

const initialTasks: Omit<Task, 'id' | 'courseId'>[] = [
  {
    title: 'Finish literature review',
    course: 'Epidemiology',
    due: '2026-11-09',
    priority: 'High',
    done: false,
  },
  {
    title: 'Prepare presentation slides',
    course: 'Health Policy',
    due: '2026-11-10',
    priority: 'Medium',
    done: false,
  },
  {
    title: 'Read chapter 4',
    course: 'Biostatistics',
    due: '2026-11-12',
    priority: 'Low',
    done: false,
  },
];

const calendarWeekdays = [
  'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday', 'Sunday'
];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  if (!date) return 'Belum diatur';

  return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDateLabel(date: string) {
  if (!date) return 'Belum diatur';

  const today = localDateString();
  const tomorrow = localDateString(new Date(Date.now() + 86400000));

  if (date === today) return 'Hari ini';
  if (date === tomorrow) return 'Besok';

  return formatDate(date);
}

function mapDatabaseTask(task: DatabaseTask): Task {
  const priority = task.priority?.toLowerCase();

  return {
    id: task.id,
    title: task.title,
    course: task.course_name || 'Personal',
    courseId: task.course_id || null,
    due: task.due_date || '',
    priority:
      priority === 'high'
        ? 'High'
        : priority === 'low'
          ? 'Low'
          : 'Medium',
    done: Boolean(task.is_completed),
  };
}

async function getOrCreateCourse(
  userId: string,
  courseName: string
): Promise<Course | null> {
  const cleanName = courseName.trim();

  if (!cleanName || cleanName.toLowerCase() === 'personal') {
    return null;
  }

  const { data: existing, error: searchError } = await supabase
    .from('courses')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .ilike('name', cleanName)
    .limit(1)
    .maybeSingle();

  if (searchError) throw searchError;

  if (existing) return existing as Course;

  const { data: created, error: insertError } = await supabase
    .from('courses')
    .insert({
      user_id: userId,
      name: cleanName,
    })
    .select('id, name, created_at')
    .single();

  if (insertError) throw insertError;

  return created as Course;
}

export default function Home() {
  const router = useRouter();

  // AUTHENTICATION
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Student');
  const [userEmail, setUserEmail] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // DROPDOWN MENUS
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // TASK AND COURSE DATA
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // DASHBOARD STATE
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>('All');
  const [search, setSearch] = useState('');

  // CALENDAR STATE
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(localDateString());

  // TASK FORM STATE
  const [newTask, setNewTask] = useState({
    title: '',
    course: '',
    newCourseName: '',
    due: '',
    priority: 'Medium' as Priority,
  });

  const [showNewCourseInput, setShowNewCourseInput] = useState(false);

  // LOAD COURSES
  async function loadCourses(currentUserId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, created_at')
      .eq('user_id', currentUserId)
      .order('name', { ascending: true });

    if (error) throw error;

    setCourseList((data || []) as Course[]);
  }

  // LISTEN FOR COURSE CHANGES
  useEffect(() => {
    if (!userId) return;

    const handleCourseUpdate = () => {
      loadCourses(userId).catch((error) => {
        console.error('Gagal memperbarui daftar Course:', error);
      });
    };

    window.addEventListener(COURSE_UPDATE_EVENT, handleCourseUpdate);

    return () => {
      window.removeEventListener(COURSE_UPDATE_EVENT, handleCourseUpdate);
    };
  }, [userId]);

  // CHECK LOGIN SESSION
  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session) {
        router.replace('/auth');
        return;
      }

      setUserId(session.user.id);
      setUserName(
        session.user.user_metadata?.full_name ||
        session.user.email?.split('@')[0] ||
        'Student'
      );
      setUserEmail(session.user.email || '');
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error || !data.session) {
        router.replace('/auth');
        return;
      }

      setUserId(data.session.user.id);
      setUserName(
        data.session.user.user_metadata?.full_name ||
        data.session.user.email?.split('@')[0] ||
        'Student'
      );
      setUserEmail(data.session.user.email || '');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // LOAD TASKS AND COURSES
  useEffect(() => {
    if (!userId) return;

    let active = true;

    async function loadTasks() {
      setLoadedUserId(null);

      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, created_at')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (coursesError) throw coursesError;
        if (!active) return;

        let currentCourses = (coursesData || []) as Course[];
        setCourseList(currentCourses);

        const { data, error } = await supabase
          .from('tasks')
          .select(
            'id, title, course_id, course_name, due_date, priority, is_completed'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (!active) return;

        let databaseTasks = (data || []) as DatabaseTask[];

        // MIGRATE OLD LOCAL STORAGE DATA IF DATABASE IS EMPTY
        if (databaseTasks.length === 0) {
          const userStorageKey = `${STORAGE_KEY}-${userId}`;
          let legacyTasks: Task[] = [];

          try {
            const saved = localStorage.getItem(userStorageKey);

            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) legacyTasks = parsed;
            }
          } catch {
            console.error('Tidak dapat membaca data lama TASKARA.');
          }

          const tasksToMigrate =
            legacyTasks.length > 0 ? legacyTasks : initialTasks;

          const migrationData = [];

          for (const task of tasksToMigrate) {
            const courseName = String(task.course || 'Personal');
            let course: Course | null = null;

            if (courseName.toLowerCase() !== 'personal') {
              const existingCourse = currentCourses.find(
                (item) =>
                  item.name.toLowerCase() === courseName.trim().toLowerCase()
              );

              course = existingCourse || await getOrCreateCourse(
                userId,
                courseName
              );

              if (
                course &&
                !currentCourses.some((item) => item.id === course?.id)
              ) {
                currentCourses = [...currentCourses, course];
              }
            }

            migrationData.push({
              user_id: userId,
              title: String(task.title || 'Untitled task'),
              course_id: course?.id || null,
              course_name: courseName,
              due_date: task.due || null,
              priority: String(task.priority || 'medium').toLowerCase(),
              is_completed: Boolean(task.done),
            });
          }

          const { data: migratedData, error: migrationError } =
            await supabase
              .from('tasks')
              .insert(migrationData)
              .select(
                'id, title, course_id, course_name, due_date, priority, is_completed'
              );

          if (migrationError) throw migrationError;

          databaseTasks = (migratedData || []) as DatabaseTask[];
          setCourseList(currentCourses);
        }

        if (!active) return;

        const mappedTasks = databaseTasks.map(mapDatabaseTask);

        setTasks(mappedTasks);

        localStorage.setItem(
          `${STORAGE_KEY}-${userId}`,
          JSON.stringify(mappedTasks)
        );

        setLoadedUserId(userId);
      } catch (error: unknown) {
        console.error('Gagal memuat tugas dari Supabase:', error);

        const details =
          typeof error === 'object' && error !== null
            ? error as {
                message?: string;
                details?: string;
                hint?: string;
                code?: string;
              }
            : null;

        const errorMessage = [
          details?.message || 'Pesan error tidak tersedia.',
          details?.details ? `Detail: ${details.details}` : '',
          details?.hint ? `Petunjuk: ${details.hint}` : '',
          details?.code ? `Kode: ${details.code}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');

        if (active) {
          alert(`Gagal memuat tugas dari Supabase:\n\n${errorMessage}`);
        }
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [userId]);

  // UPDATE LOCAL BACKUP
  useEffect(() => {
    if (!userId || loadedUserId !== userId) return;

    localStorage.setItem(
      `${STORAGE_KEY}-${userId}`,
      JSON.stringify(tasks)
    );
  }, [tasks, userId, loadedUserId]);

  // LOGOUT
  async function handleLogout() {
    const confirmed = window.confirm(
      'Yakin ingin keluar dari akun TASKARA?'
    );

    if (!confirmed) return;

    setLoggingOut(true);
    setProfileMenuOpen(false);

    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local',
      });

      if (error) throw error;

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        throw new Error('Sesi akun belum berhasil diakhiri.');
      }

      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Gagal logout. Silakan coba lagi.'
      );

      setLoggingOut(false);
    }
  }

  // TASK STATISTICS
  const today = localDateString();

  const completed = tasks.filter((task) => task.done).length;
  const active = tasks.length - completed;

  const overdue = tasks.filter(
    (task) => !task.done && task.due && task.due < today
  ).length;

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  // FILTER TASKS
  const filteredTasks = tasks
    .filter((task) => {
      if (filter === 'Active') return !task.done;
      if (filter === 'Completed') return task.done;
      return true;
    })
    .filter((task) =>
      `${task.title} ${task.course}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.done !== b.done) {
        return Number(a.done) - Number(b.done);
      }

      if (!a.due) return 1;
      if (!b.due) return -1;

      return a.due.localeCompare(b.due);
    });

  const upcomingTasks = [...tasks]
    .filter((task) => !task.done && task.due >= today)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  // NOTIFICATION DATA
  const notificationTasks = [...tasks]
    .filter((task) => !task.done && task.due)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  const notificationCount = notificationTasks.filter(
    (task) => task.due <= today
  ).length;

  // FORM FUNCTIONS
  function resetForm() {
    setNewTask({
      title: '',
      course: '',
      newCourseName: '',
      due: '',
      priority: 'Medium',
    });

    setShowNewCourseInput(false);
    setEditingId(null);
    setShowForm(false);
  }

  function openAddForm() {
    setNewTask({
      title: '',
      course: '',
      newCourseName: '',
      due: activeNav === 'Calendar' ? selectedDate : '',
      priority: 'Medium',
    });

    setShowNewCourseInput(false);
    setEditingId(null);
    setShowForm(true);
  }

  function editTask(task: Task) {
    const matchingCourse = courseList.find(
      (course) =>
        course.id === task.courseId ||
        course.name.toLowerCase() === task.course.toLowerCase()
    );

    setNewTask({
      title: task.title,
      course: matchingCourse?.id || '',
      newCourseName: '',
      due: task.due,
      priority: task.priority,
    });

    setShowNewCourseInput(false);
    setEditingId(task.id);
    setShowForm(true);
    setActiveNav('My Tasks');
  }

  // SAVE TASK
  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTask.title.trim() || !userId) return;

    try {
      let selectedCourseId: string | null = null;
      let selectedCourseName = 'Personal';

      if (newTask.course === CREATE_COURSE) {
        const cleanCourseName = newTask.newCourseName.trim();

        if (!cleanCourseName) {
          alert('Masukkan nama Course terlebih dahulu.');
          return;
        }

        const duplicate = courseList.find(
          (course) =>
            course.name.toLowerCase() === cleanCourseName.toLowerCase()
        );

        let selectedCourse: Course;

        if (duplicate) {
          selectedCourse = duplicate;
        } else {
          const { data, error } = await supabase
            .from('courses')
            .insert({
              user_id: userId,
              name: cleanCourseName,
            })
            .select('id, name, created_at')
            .single();

          if (error) throw error;

          selectedCourse = data as Course;

          setCourseList((current) =>
            [...current, selectedCourse].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );

          window.dispatchEvent(new Event(COURSE_UPDATE_EVENT));
        }

        selectedCourseId = selectedCourse.id;
        selectedCourseName = selectedCourse.name;
      } else if (newTask.course) {
        const selectedCourse = courseList.find(
          (course) => course.id === newTask.course
        );

        if (!selectedCourse) {
          throw new Error(
            'Course yang dipilih tidak ditemukan. Silakan pilih ulang.'
          );
        }

        selectedCourseId = selectedCourse.id;
        selectedCourseName = selectedCourse.name;
      }

      const taskData = {
        title: newTask.title.trim(),
        course_id: selectedCourseId,
        course_name: selectedCourseName,
        due_date: newTask.due || null,
        priority: newTask.priority.toLowerCase(),
      };

      if (editingId !== null) {
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingId)
          .eq('user_id', userId)
          .select(
            'id, title, course_id, course_name, due_date, priority, is_completed'
          )
          .single();

        if (error) throw error;

        const updatedTask = mapDatabaseTask(data as DatabaseTask);

        setTasks((current) =>
          current.map((task) =>
            task.id === editingId ? updatedTask : task
          )
        );
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            ...taskData,
            is_completed: false,
          })
          .select(
            'id, title, course_id, course_name, due_date, priority, is_completed'
          )
          .single();

        if (error) throw error;

        const addedTask = mapDatabaseTask(data as DatabaseTask);

        setTasks((current) => [...current, addedTask]);
      }

      resetForm();
    } catch (error) {
      console.error('Gagal menyimpan tugas:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan tugas. Silakan coba lagi.'
      );
    }
  }

  // TOGGLE TASK STATUS
  async function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id);

    if (!task || !userId) return;

    const newStatus = !task.done;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: newStatus })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setTasks((current) =>
        current.map((item) =>
          item.id === id ? { ...item, done: newStatus } : item
        )
      );
    } catch (error) {
      console.error('Gagal mengubah status tugas:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Gagal mengubah status tugas.'
      );
    }
  }

  // DELETE TASK
  async function deleteTask(id: string) {
    if (!userId) return;

    const confirmed = window.confirm(
      'Yakin ingin menghapus tugas ini?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setTasks((current) =>
        current.filter((task) => task.id !== id)
      );
    } catch (error) {
      console.error('Gagal menghapus tugas:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Gagal menghapus tugas.'
      );
    }
  }

  function navigate(label: string) {
    setActiveNav(label);
    setMobileOpen(false);
    setShowForm(false);
    setShowNewCourseInput(false);
    setSearch('');
    setFilter('All');
    setProfileMenuOpen(false);
    setNotificationOpen(false);
  }

  // TASK COMPONENT
  function renderTask(task: Task) {
    return (
      <article
        className={`task-row ${task.done ? 'is-done' : ''}`}
        key={task.id}
      >
        <button
          className="check-button"
          onClick={() => toggleTask(task.id)}
          aria-label={
            task.done ? 'Tandai belum selesai' : 'Tandai selesai'
          }
        >
          {task.done ? (
            <CheckCircle2 size={20} />
          ) : (
            <Circle size={20} />
          )}
        </button>

        <div className="task-copy">
          <strong>{task.title}</strong>
          <span>
            {task.course} <i>·</i> <Clock3 size={12} />{' '}
            {getDateLabel(task.due)}
          </span>
        </div>

        <span className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>

        <div className="task-actions">
          <button
            className="icon-button"
            onClick={() => editTask(task)}
            aria-label="Edit tugas"
          >
            <Pencil size={15} />
          </button>

          <button
            className="icon-button delete-button"
            onClick={() => deleteTask(task.id)}
            aria-label="Hapus tugas"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </article>
    );
  }

  // TASK FORM
  function renderTaskForm() {
    return (
      <form className="task-form" onSubmit={saveTask}>
        <div className="form-heading">
          <strong>
            {editingId !== null ? 'Edit task' : 'Create a new task'}
          </strong>

          <button
            type="button"
            className="icon-button"
            onClick={resetForm}
            aria-label="Tutup form"
          >
            <X size={17} />
          </button>
        </div>

        <label>
          Task name *
          <input
            required
            autoFocus
            value={newTask.title}
            onChange={(event) =>
              setNewTask((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Contoh: Kerjakan proposal penelitian"
          />
        </label>

        <div className="form-grid">
          <label>
            Course / Category
            <select
              value={newTask.course}
              onChange={(event) => {
                const selectedValue = event.target.value;

                if (selectedValue === CREATE_COURSE) {
                  setShowNewCourseInput(true);

                  setNewTask((current) => ({
                    ...current,
                    course: CREATE_COURSE,
                    newCourseName: '',
                  }));
                } else {
                  setShowNewCourseInput(false);

                  setNewTask((current) => ({
                    ...current,
                    course: selectedValue,
                    newCourseName: '',
                  }));
                }
              }}
            >
              <option value="">Personal</option>

              {courseList.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}

              <option value={CREATE_COURSE}>
                + Create New Course
              </option>
            </select>
          </label>

          {showNewCourseInput && (
            <label>
              New Course Name *
              <input
                type="text"
                required
                autoComplete="off"
                maxLength={100}
                value={newTask.newCourseName}
                onChange={(event) =>
                  setNewTask((current) => ({
                    ...current,
                    newCourseName: event.target.value,
                  }))
                }
                placeholder="Contoh: Epidemiology"
              />
            </label>
          )}

          <label>
            Deadline
            <input
              type="date"
              value={newTask.due}
              onChange={(event) =>
                setNewTask((current) => ({
                  ...current,
                  due: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Priority
            <select
              value={newTask.priority}
              onChange={(event) =>
                setNewTask((current) => ({
                  ...current,
                  priority: event.target.value as Priority,
                }))
              }
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={resetForm}
          >
            Cancel
          </button>

          <button type="submit" className="primary-button">
            {editingId !== null ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    );
  }

  // TASK COLLECTION
  function renderTaskCollection() {
    const visibleTasks =
      activeNav === 'Dashboard'
        ? filteredTasks.filter((task) => !task.done).slice(0, 5)
        : filteredTasks;

    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              {activeNav === 'Dashboard'
                ? "Today's focus"
                : 'All tasks'}
            </h2>

            <p>
              {activeNav === 'Dashboard'
                ? 'A few important things to move forward.'
                : 'Manage your academic workload.'}
            </p>
          </div>

          {activeNav === 'Dashboard' && (
            <button
              className="text-button"
              onClick={() => navigate('My Tasks')}
            >
              View all <ChevronRight size={15} />
            </button>
          )}
        </div>

        {showForm && renderTaskForm()}

        {activeNav === 'My Tasks' && (
          <div className="task-toolbar">
            <div className="filter-tabs">
              {(['All', 'Active', 'Completed'] as TaskFilter[]).map(
                (item) => (
                  <button
                    key={item}
                    className={filter === item ? 'selected' : ''}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <span className="task-count">
              {filteredTasks.length} tasks
            </span>
          </div>
        )}

        <div className="task-list">
          {visibleTasks.map(renderTask)}
        </div>

        {visibleTasks.length === 0 && (
          <p className="empty-state">
            Belum ada tugas di sini. Yuk, tambahkan tugas pertamamu!
          </p>
        )}
      </section>
    );
  }

  // DASHBOARD - REDESIGNED
  function renderDashboard() {
    const firstName = userName.trim().split(' ')[0] || 'Student';

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const dailyQuote = overdue > 0
      ? 'A little progress is better than standing still.'
      : 'You are building something wonderful, one day at a time.';

    const dashboardTasks = tasks
  .filter(
    (task) =>
      !task.done &&
      task.due !== '' &&
      task.due <= today
  )
  .sort((a, b) => {
    const priorityOrder: Record<Priority, number> = {
      High: 1,
      Medium: 2,
      Low: 3,
    };

    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    return a.due.localeCompare(b.due);
  })
  .slice(0, 5);

    return (
      <div className="tk-dashboard">
        <style>{`
          .tk-dashboard {
            display: flex;
            flex-direction: column;
            gap: 22px;
            color: #292638;
          }

          .tk-hero {
            position: relative;
            overflow: hidden;
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) minmax(220px, .65fr);
            align-items: center;
            gap: 20px;
            padding: 32px 34px;
            min-height: 210px;
            border-radius: 22px;
            background: linear-gradient(115deg, #29243d 0%, #51446f 56%, #8274ae 100%);
            color: white;
            isolation: isolate;
          }

          .tk-hero::before {
            content: "";
            position: absolute;
            width: 300px;
            height: 300px;
            border: 1px solid rgba(255,255,255,.13);
            border-radius: 50%;
            right: 8%;
            top: -170px;
            z-index: -1;
          }

          .tk-hero::after {
            content: "";
            position: absolute;
            width: 220px;
            height: 220px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 50%;
            right: 20%;
            bottom: -160px;
            z-index: -1;
          }

          .tk-hero-copy {
            position: relative;
            z-index: 1;
          }

          .tk-hero-kicker {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            margin-bottom: 15px;
            color: #d9d0f0;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .tk-hero h2 {
            max-width: 520px;
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: clamp(27px, 3vw, 39px);
            font-weight: 400;
            line-height: 1.18;
            letter-spacing: -.8px;
          }

          .tk-hero h2 em {
            color: #d9c9ff;
            font-weight: 400;
          }

          .tk-hero-description {
            max-width: 430px;
            margin: 12px 0 20px;
            color: rgba(255,255,255,.72);
            font-size: 12px;
            line-height: 1.8;
          }

          .tk-hero-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            border: 1px solid rgba(255,255,255,.3);
            border-radius: 9px;
            background: rgba(255,255,255,.13);
            color: white;
            font-family: inherit;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: background .2s, transform .2s;
          }

          .tk-hero-button:hover {
            background: rgba(255,255,255,.23);
            transform: translateY(-2px);
          }

          .tk-hero-art {
            position: relative;
            min-height: 145px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .tk-orbit {
            position: absolute;
            width: 155px;
            height: 155px;
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 50%;
          }

          .tk-orbit::before,
          .tk-orbit::after {
            content: "";
            position: absolute;
            border: 1px solid rgba(255,255,255,.16);
            border-radius: 50%;
          }

          .tk-orbit::before { inset: 15px; }
          .tk-orbit::after { inset: 31px; }

          .tk-art-card {
            position: relative;
            width: 115px;
            height: 130px;
            padding: 16px 13px;
            border: 1px solid rgba(255,255,255,.4);
            border-radius: 12px;
            background: rgba(255,255,255,.16);
            box-shadow: 0 15px 35px rgba(20,15,35,.2);
            backdrop-filter: blur(8px);
            transform: rotate(-7deg);
          }

          .tk-art-card::before {
            content: "";
            position: absolute;
            width: 30px;
            height: 30px;
            top: -11px;
            right: -10px;
            border-radius: 50%;
            background: #d9c9ff;
            opacity: .9;
          }

          .tk-art-line {
            height: 5px;
            margin-bottom: 9px;
            border-radius: 5px;
            background: rgba(255,255,255,.7);
          }

          .tk-art-line.short {
            width: 55%;
            background: #d9c9ff;
          }

          .tk-art-line.long { width: 90%; }

          .tk-art-check {
            display: flex;
            align-items: center;
            gap: 7px;
            margin-top: 13px;
            color: white;
            font-size: 8px;
          }

          .tk-art-check span {
            display: grid;
            width: 12px;
            height: 12px;
            place-items: center;
            border: 1px solid rgba(255,255,255,.8);
            border-radius: 4px;
          }

          .tk-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 13px;
          }

          .tk-stat {
            position: relative;
            min-width: 0;
            padding: 17px 18px;
            overflow: hidden;
            border: 1px solid #ebe7f2;
            border-radius: 15px;
            background: #fff;
          }

          .tk-stat-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .tk-stat-label {
            color: #858195;
            font-size: 10px;
            font-weight: 600;
          }

          .tk-stat-icon {
            display: grid;
            width: 31px;
            height: 31px;
            flex-shrink: 0;
            place-items: center;
            border-radius: 9px;
          }

          .tk-stat-value {
            display: block;
            margin-top: 11px;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 29px;
            font-weight: 400;
            line-height: 1;
            color: #302a43;
          }

          .tk-stat-note {
            display: block;
            margin-top: 8px;
            color: #9995a6;
            font-size: 9px;
          }

          .tk-stat-note.danger { color: #c66c7c; }
          .tk-stat-note.success { color: #5d9b83; }

          .tk-dashboard-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.5fr) minmax(245px, .8fr);
            gap: 17px;
            align-items: start;
          }

          .tk-card {
            min-width: 0;
            padding: 21px;
            border: 1px solid #ebe7f2;
            border-radius: 16px;
            background: #fff;
          }

          .tk-card-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 17px;
          }

          .tk-card-eyebrow {
            display: block;
            margin-bottom: 6px;
            color: #9b91bd;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.4px;
            text-transform: uppercase;
          }

          .tk-card-heading h3 {
            margin: 0;
            color: #302a43;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 21px;
            font-weight: 400;
          }

          .tk-card-heading p {
            margin: 5px 0 0;
            color: #9692a3;
            font-size: 10px;
            line-height: 1.6;
          }

          .tk-view-all {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 7px 0;
            border: 0;
            background: transparent;
            color: #8173b2;
            font-family: inherit;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
          }

          .tk-task-list {
            display: flex;
            flex-direction: column;
          }

          .tk-task {
            display: flex;
            align-items: center;
            gap: 11px;
            min-width: 0;
            padding: 13px 0;
            border-top: 1px solid #f0edf4;
          }

          .tk-task-check {
            display: grid;
            width: 20px;
            height: 20px;
            flex-shrink: 0;
            place-items: center;
            padding: 0;
            border: 0;
            background: transparent;
            color: #aaa2c7;
            cursor: pointer;
          }

          .tk-task-check:hover { color: #8173b2; }

          .tk-task-info {
            flex: 1;
            min-width: 0;
          }

          .tk-task-info strong {
            display: block;
            overflow: hidden;
            color: #403a50;
            font-size: 11px;
            font-weight: 600;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .tk-task-info span {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 5px;
            color: #9995a6;
            font-size: 9px;
          }

          .tk-task-priority {
            padding: 5px 8px;
            border-radius: 20px;
            font-size: 8px;
            font-weight: 700;
            white-space: nowrap;
          }

          .tk-task-priority.high {
            background: #faeaed;
            color: #bd6877;
          }

          .tk-task-priority.medium {
            background: #fbf2e2;
            color: #a77a2c;
          }

          .tk-task-priority.low {
            background: #efecf8;
            color: #8173b2;
          }

          .tk-empty {
            padding: 25px 12px;
            color: #9995a6;
            font-size: 11px;
            line-height: 1.7;
            text-align: center;
          }

          .tk-side-column {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .tk-progress-card {
            background: #f5f2fa;
            border-color: #ebe5f5;
          }

          .tk-progress-main {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 10px;
            margin: 18px 0 12px;
          }

          .tk-progress-number {
            color: #554775;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 42px;
            line-height: 1;
          }

          .tk-progress-caption {
            color: #8e879e;
            font-size: 9px;
            text-align: right;
          }

          .tk-progress-track {
            height: 8px;
            overflow: hidden;
            border-radius: 10px;
            background: #e5deef;
          }

          .tk-progress-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #8b7fc7, #b5a6d9);
            transition: width .4s ease;
          }

          .tk-progress-foot {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-top: 10px;
            color: #9189a1;
            font-size: 9px;
          }

          .tk-deadline {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 11px 0;
            border-top: 1px solid #f0edf4;
          }

          .tk-deadline-date {
            display: flex;
            width: 39px;
            height: 42px;
            flex-shrink: 0;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            background: #f0edf8;
            color: #7668a7;
          }

          .tk-deadline-date strong {
            font-size: 14px;
            line-height: 1.1;
          }

          .tk-deadline-date span {
            margin-top: 3px;
            font-size: 8px;
            text-transform: uppercase;
          }

          .tk-deadline-info {
            min-width: 0;
            padding-top: 3px;
          }

          .tk-deadline-info strong {
            display: block;
            overflow: hidden;
            color: #494258;
            font-size: 10px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .tk-deadline-info span {
            display: block;
            margin-top: 5px;
            color: #9995a6;
            font-size: 9px;
          }

          .tk-note {
            position: relative;
            overflow: hidden;
            padding: 19px;
            border-radius: 15px;
            background: #302a43;
            color: white;
          }

          .tk-note::after {
            content: "✳";
            position: absolute;
            right: 13px;
            bottom: -25px;
            color: rgba(255,255,255,.08);
            font-size: 100px;
            line-height: 1;
          }

          .tk-note-label {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #c9bce8;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.3px;
          }

          .tk-note h4 {
            position: relative;
            z-index: 1;
            margin: 13px 0 7px;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 19px;
            font-weight: 400;
          }

          .tk-note p {
            position: relative;
            z-index: 1;
            max-width: 240px;
            margin: 0;
            color: rgba(255,255,255,.68);
            font-size: 10px;
            line-height: 1.8;
          }

          @media (max-width: 1050px) {
            .tk-hero { padding: 27px; }
            .tk-dashboard-grid {
              grid-template-columns: minmax(0, 1.2fr) minmax(220px, .8fr);
            }
          }

          @media (max-width: 760px) {
            .tk-hero {
              grid-template-columns: minmax(0, 1fr) 125px;
              gap: 8px;
              padding: 25px 22px;
            }
            .tk-hero-art { transform: scale(.8); }
            .tk-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .tk-dashboard-grid { grid-template-columns: minmax(0, 1fr); }
            .tk-side-column {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .tk-note { grid-column: 1 / -1; }
          }

          @media (max-width: 480px) {
            .tk-dashboard { gap: 15px; }
            .tk-hero {
              grid-template-columns: minmax(0, 1fr);
              padding: 24px 20px;
              min-height: auto;
            }
            .tk-hero h2 { font-size: 29px; }
            .tk-hero-description { max-width: 100%; }
            .tk-hero-art { display: none; }
            .tk-stat { padding: 14px; }
            .tk-stat-value { font-size: 26px; }
            .tk-card { padding: 16px; }
            .tk-card-heading h3 { font-size: 19px; }
            .tk-side-column { grid-template-columns: minmax(0, 1fr); }
            .tk-note { grid-column: auto; }
            .tk-task { gap: 8px; }
            .tk-task-priority { padding: 4px 6px; }
          }
        `}</style>

        <section className="tk-hero">
          <div className="tk-hero-copy">
            <div className="tk-hero-kicker">
              <Sparkles size={13} />
              {todayDate}
            </div>

            <h2>
              A new day to make
              <br />
              <em>things happen,</em> {firstName}.
            </h2>

            <p className="tk-hero-description">
              Your academic journey, one thoughtful step at a time.
              Keep your focus on what matters today.
            </p>

            <button
              className="tk-hero-button"
              onClick={openAddForm}
            >
              <Plus size={15} />
              Create a new task
            </button>
          </div>

          <div className="tk-hero-art" aria-hidden="true">
            <div className="tk-orbit" />
            <div className="tk-art-card">
              <div className="tk-art-line short" />
              <div className="tk-art-line long" />
              <div className="tk-art-line" style={{ width: '75%' }} />
              <div className="tk-art-check">
                <span><CheckCircle2 size={10} /></span>
                Stay focused
              </div>
              <div className="tk-art-check">
                <span />
                Keep learning
              </div>
              <div className="tk-art-check">
                <span />
                Take a break
              </div>
            </div>
          </div>
        </section>

        <section className="tk-stats">
          <article className="tk-stat">
            <div className="tk-stat-top">
              <span className="tk-stat-label">Active tasks</span>
              <span className="tk-stat-icon" style={{ background: '#efecf8', color: '#8173b2' }}>
                <ListTodo size={16} />
              </span>
            </div>
            <strong className="tk-stat-value">{active}</strong>
            <span className="tk-stat-note">Waiting for your attention</span>
          </article>

          <article className="tk-stat">
            <div className="tk-stat-top">
              <span className="tk-stat-label">Completed</span>
              <span className="tk-stat-icon" style={{ background: '#eaf4ef', color: '#65977f' }}>
                <CheckCircle2 size={16} />
              </span>
            </div>
            <strong className="tk-stat-value">{completed}</strong>
            <span className="tk-stat-note success">Every step counts!</span>
          </article>

          <article className="tk-stat">
            <div className="tk-stat-top">
              <span className="tk-stat-label">Overdue</span>
              <span className="tk-stat-icon" style={{ background: '#faeaed', color: '#c66c7c' }}>
                <Clock3 size={16} />
              </span>
            </div>
            <strong className="tk-stat-value">{overdue}</strong>
            <span className="tk-stat-note danger">Needs your attention</span>
          </article>

          <article className="tk-stat">
            <div className="tk-stat-top">
              <span className="tk-stat-label">My courses</span>
              <span className="tk-stat-icon" style={{ background: '#fbf2e2', color: '#b18a45' }}>
                <BookOpen size={16} />
              </span>
            </div>
            <strong className="tk-stat-value">{courseList.length}</strong>
            <span className="tk-stat-note">Your learning spaces</span>
          </article>
        </section>

        <div className="tk-dashboard-grid">
          <section className="tk-card">
            <div className="tk-card-heading">
              <div>
                <span className="tk-card-eyebrow">Your priorities</span>
                <h3>Today's focus</h3>
               <p>Tasks that need your attention today.</p>
              </div>

              <button
                className="tk-view-all"
                onClick={() => navigate('My Tasks')}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div className="tk-task-list">
              {dashboardTasks.map((task) => (
                <article className="tk-task" key={task.id}>
                  <button
                    className="tk-task-check"
                    onClick={() => toggleTask(task.id)}
                    aria-label="Tandai tugas selesai"
                  >
                    <Circle size={19} />
                  </button>

                  <div className="tk-task-info">
                    <strong>{task.title}</strong>
                    <span>
                      {task.course}
                      <i>·</i>
                      <Clock3 size={11} />
                      {getDateLabel(task.due)}
                    </span>
                  </div>

                  <span className={`tk-task-priority ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </article>
              ))}

             {dashboardTasks.length === 0 && (
  <div className="tk-empty">
    <CheckCircle2
      size={25}
      style={{
        display: 'block',
        margin: '0 auto 9px',
        color: '#8b7fc7',
      }}
    />
    Tidak ada tugas yang perlu dikerjakan hari ini. Nikmati waktumu!
  </div>
)}
            </div>
          </section>

          <div className="tk-side-column">
            <section className="tk-card tk-progress-card">
              <div className="tk-card-heading" style={{ marginBottom: 0 }}>
                <div>
                  <span className="tk-card-eyebrow">Your journey</span>
                  <h3>Overall progress</h3>
                </div>
                <ChartNoAxesCombined size={19} color="#8173b2" />
              </div>

              <div className="tk-progress-main">
                <strong className="tk-progress-number">{progress}%</strong>
                <span className="tk-progress-caption">
                  {completed} of {tasks.length}
                  <br />
                  tasks completed
                </span>
              </div>

              <div
                className="tk-progress-track"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall task completion"
              >
                <div
                  className="tk-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="tk-progress-foot">
                <span>Keep going</span>
                <span>{active} remaining</span>
              </div>
            </section>

            <section className="tk-card">
              <div className="tk-card-heading">
                <div>
                  <span className="tk-card-eyebrow">Coming up</span>
                  <h3>Upcoming deadlines</h3>
                </div>
                <CalendarDays size={18} color="#8173b2" />
              </div>

              {upcomingTasks.length > 0 ? (
                upcomingTasks.slice(0, 3).map((task) => {
                  const deadlineDate = new Date(`${task.due}T00:00:00`);

                  return (
                    <div className="tk-deadline" key={task.id}>
                      <div className="tk-deadline-date">
                        <strong>{deadlineDate.getDate()}</strong>
                        <span>
                          {deadlineDate.toLocaleDateString('en-US', {
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <div className="tk-deadline-info">
                        <strong>{task.title}</strong>
                        <span>{task.course}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="tk-empty">
                  Tidak ada deadline mendatang. Nikmati waktu luangmu!
                </div>
              )}
            </section>

            <section className="tk-note">
              <div className="tk-note-label">
                <Sparkles size={14} />
                A LITTLE REMINDER
              </div>
              <h4>Small steps count.</h4>
              <p>{dailyQuote} You don't have to do everything at once.</p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // CALENDAR HELPERS
  function changeCalendarMonth(amount: number) {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + amount,
          1
        )
    );
  }

  function goToToday() {
    const now = new Date();

    setCalendarMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );

    setSelectedDate(localDateString(now));
  }

  // CALENDAR
  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

    const calendarCells = Array.from(
      { length: totalCells },
      (_, index) => {
        const dayNumber = index - startOffset + 1;
        const date = new Date(year, month, dayNumber);

        return {
          date: localDateString(date),
          day: date.getDate(),
          currentMonth: dayNumber >= 1 && dayNumber <= totalDays,
        };
      }
    );

    const monthTitle = calendarMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const selectedTasks = tasks
      .filter((task) => task.due === selectedDate)
      .sort((a, b) => {
        if (a.done !== b.done) {
          return Number(a.done) - Number(b.done);
        }

        return a.title.localeCompare(b.title);
      });

    const monthTasks = tasks.filter((task) => {
      if (!task.due) return false;

      const date = new Date(`${task.due}T00:00:00`);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    });

    return (
      <div className="calendar-page">
        <style>{`
          .calendar-page {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 280px;
            gap: 18px;
            align-items: start;
          }
          .calendar-main { min-width: 0; overflow: hidden; }
          .calendar-toolbar {
            display: flex; justify-content: space-between;
            align-items: center; gap: 12px; margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .calendar-toolbar h2 {
            margin: 0; font-size: 20px; letter-spacing: -.5px;
          }
          .calendar-navigation {
            display: flex; align-items: center; gap: 8px;
          }
          .calendar-navigation button {
            height: 34px; min-width: 34px; display: inline-flex;
            align-items: center; justify-content: center; gap: 6px;
            border: 1px solid var(--border); border-radius: 8px;
            background: white; color: var(--ink); font-size: 11px;
            padding: 0 9px;
          }
          .calendar-navigation button:hover {
            background: var(--brand-soft); color: var(--brand);
          }
          .calendar-grid {
            display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
            border-top: 1px solid var(--border);
            border-left: 1px solid var(--border);
            border-radius: 10px; overflow: hidden;
          }
          .calendar-weekday {
            min-width: 0; padding: 12px 3px; text-align: center;
            background: #FAF9FC; border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border); color: var(--muted);
            font-size: 10px; font-weight: 700;
          }
          .calendar-cell {
            min-width: 0; min-height: 105px; padding: 8px;
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            background: white; text-align: left; display: flex;
            flex-direction: column; gap: 5px; transition: background .15s;
            cursor: pointer;
          }
          .calendar-cell:hover { background: #FAF9FE; }
          .calendar-cell.other-month { background: #FBFAFC; }
          .calendar-cell.other-month .calendar-day-number { color: #C8C5D0; }
          .calendar-cell.selected {
            background: #F3F0FB; box-shadow: inset 0 0 0 2px var(--brand);
          }
          .calendar-day-number {
            width: 27px; height: 27px; display: grid; place-items: center;
            border-radius: 50%; font-size: 11px; font-weight: 600;
            color: var(--ink);
          }
          .calendar-cell.today .calendar-day-number {
            background: var(--brand); color: white;
          }
          .calendar-event {
            display: block; width: 100%; overflow: hidden;
            text-overflow: ellipsis; white-space: nowrap; padding: 4px 5px;
            border-radius: 5px; font-size: 9px; font-weight: 600;
            text-align: left;
          }
          .calendar-event.high { color: #BD6877; background: #F8E8EB; }
          .calendar-event.medium { color: #A77A2C; background: #FBF1DE; }
          .calendar-event.low { color: #7669B4; background: #EDE9F7; }
          .calendar-event.done { opacity: .55; text-decoration: line-through; }
          .calendar-more { font-size: 9px; color: var(--muted); padding-left: 4px; }
          .calendar-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 17px; }
          .calendar-legend span {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 10px; color: var(--muted);
          }
          .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
          .calendar-side { min-width: 0; display: grid; gap: 14px; }
          .calendar-side .panel { padding: 17px; }
          .calendar-side-heading {
            display: flex; justify-content: space-between;
            align-items: center; gap: 8px; margin-bottom: 14px;
          }
          .calendar-side-heading h3 { font-size: 13px; margin: 0; }
          .calendar-side-heading span { font-size: 10px; color: var(--muted); }
          .selected-date {
            font-size: 12px; font-weight: 700; color: var(--brand);
            margin-bottom: 13px;
          }
          .calendar-task { padding: 11px 0; border-top: 1px solid var(--border); }
          .calendar-task strong {
            display: block; font-size: 11px; line-height: 1.5;
            overflow-wrap: anywhere;
          }
          .calendar-task small {
            display: block; font-size: 10px; color: var(--muted); margin-top: 5px;
          }
          .calendar-task-actions {
            display: flex; align-items: center; gap: 7px; margin-top: 8px;
          }
          .calendar-task-actions button {
            display: inline-flex; align-items: center; gap: 4px;
            border: 1px solid var(--border); border-radius: 6px;
            background: white; color: var(--muted); padding: 5px 7px;
            font-size: 9px;
          }
          .calendar-task-actions button:hover {
            color: var(--brand); background: var(--brand-soft);
          }
          .calendar-add-button {
            width: 100%; margin-top: 12px; justify-content: center;
          }
          .calendar-month-summary {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 0; border-top: 1px solid var(--border); gap: 10px;
          }
          .calendar-month-summary span { font-size: 10px; color: var(--muted); }
          .calendar-month-summary strong { font-size: 13px; }
          @media (max-width: 1000px) {
            .calendar-page { grid-template-columns: minmax(0, 1fr); }
            .calendar-side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 600px) {
            .calendar-cell { min-height: 76px; padding: 4px; gap: 3px; }
            .calendar-weekday { padding: 9px 1px; font-size: 8px; }
            .calendar-day-number { width: 23px; height: 23px; font-size: 10px; }
            .calendar-event { padding: 3px; font-size: 8px; }
            .calendar-side { grid-template-columns: minmax(0, 1fr); }
            .calendar-toolbar h2 { font-size: 17px; }
          }
          @media (max-width: 380px) {
            .calendar-cell { min-height: 65px; padding: 3px; }
            .calendar-event { font-size: 7px; padding: 2px; }
            .calendar-navigation button { min-width: 29px; height: 30px; padding: 0 6px; }
          }
        `}</style>

        <section className="panel calendar-main">
          <div className="calendar-toolbar">
            <div>
              <h2>{monthTitle}</h2>
              <p style={{
                color: 'var(--muted)',
                fontSize: '11px',
                margin: '5px 0 0'
              }}>
                Your academic schedule at a glance.
              </p>
            </div>

            <div className="calendar-navigation">
              <button onClick={goToToday}>Today</button>

              <button
                onClick={() => changeCalendarMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() => changeCalendarMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {calendarWeekdays.map((day) => (
              <div className="calendar-weekday" key={day}>
                {day.slice(0, 3)}
              </div>
            ))}

            {calendarCells.map((cell) => {
              const dayTasks = tasks.filter(
                (task) => task.due === cell.date
              );

              const isToday = cell.date === today;
              const isSelected = cell.date === selectedDate;

              return (
                <button
                  type="button"
                  key={cell.date}
                  className={[
                    'calendar-cell',
                    !cell.currentMonth ? 'other-month' : '',
                    isToday ? 'today' : '',
                    isSelected ? 'selected' : '',
                  ].join(' ')}
                  onClick={() => {
                    setSelectedDate(cell.date);

                    if (!cell.currentMonth) {
                      const clickedDate = new Date(
                        `${cell.date}T00:00:00`
                      );

                      setCalendarMonth(
                        new Date(
                          clickedDate.getFullYear(),
                          clickedDate.getMonth(),
                          1
                        )
                      );
                    }
                  }}
                >
                  <span className="calendar-day-number">{cell.day}</span>

                  {dayTasks.slice(0, 2).map((task) => (
                    <span
                      key={task.id}
                      className={`calendar-event ${task.priority.toLowerCase()} ${
                        task.done ? 'done' : ''
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </span>
                  ))}

                  {dayTasks.length > 2 && (
                    <span className="calendar-more">
                      +{dayTasks.length - 2} more
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span>
              <i className="legend-dot" style={{ background: '#D87582' }} />
              High priority
            </span>
            <span>
              <i className="legend-dot" style={{ background: '#E8B65C' }} />
              Medium priority
            </span>
            <span>
              <i className="legend-dot" style={{ background: '#8B7FC7' }} />
              Low priority
            </span>
          </div>
        </section>

        <aside className="calendar-side">
          <section className="panel">
            <div className="calendar-side-heading">
              <h3>Selected date</h3>
              <CalendarDays size={17} color="var(--brand)" />
            </div>

            <div className="selected-date">
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                'id-ID',
                {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </div>

            {selectedTasks.length > 0 ? (
              selectedTasks.map((task) => (
                <div className="calendar-task" key={task.id}>
                  <strong>{task.title}</strong>

                  <small>
                    {task.course} · {task.priority} ·{' '}
                    {task.done ? 'Completed' : 'Not completed'}
                  </small>

                  <div className="calendar-task-actions">
                    <button onClick={() => toggleTask(task.id)}>
                      {task.done ? (
                        <Circle size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      {task.done ? 'Undo' : 'Complete'}
                    </button>

                    <button onClick={() => editTask(task)}>
                      <Pencil size={12} /> Edit
                    </button>

                    <button onClick={() => deleteTask(task.id)}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state" style={{ padding: '12px 0' }}>
                Tidak ada tugas pada tanggal ini.
              </p>
            )}

            <button
              className="primary-button calendar-add-button"
              onClick={() => {
                setNewTask({
                  title: '',
                  course: '',
                  newCourseName: '',
                  due: selectedDate,
                  priority: 'Medium',
                });

                setShowNewCourseInput(false);
                setEditingId(null);
                setShowForm(true);
              }}
            >
              <Plus size={15} />
              Add task on this date
            </button>
          </section>

          <section className="panel">
            <div className="calendar-side-heading">
              <h3>Monthly overview</h3>
              <span>{monthTitle}</span>
            </div>

            <div className="calendar-month-summary">
              <span>Total deadlines</span>
              <strong>{monthTasks.length}</strong>
            </div>

            <div className="calendar-month-summary">
              <span>Completed</span>
              <strong>
                {monthTasks.filter((task) => task.done).length}
              </strong>
            </div>

            <div className="calendar-month-summary">
              <span>Remaining</span>
              <strong>
                {monthTasks.filter((task) => !task.done).length}
              </strong>
            </div>
          </section>
        </aside>

        {showForm && (
          <div style={{ gridColumn: '1 / -1' }}>
            <section className="panel">
              {renderTaskForm()}
            </section>
          </div>
        )}
      </div>
    );
  }

  // COURSES
  function renderCourses() {
    return <CourseManager />;
  }

  // PROGRESS
  function renderProgress() {
    const high = tasks.filter(
      (task) => task.priority === 'High'
    ).length;

    const medium = tasks.filter(
      (task) => task.priority === 'Medium'
    ).length;

    const low = tasks.filter(
      (task) => task.priority === 'Low'
    ).length;

    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Your progress</h2>
            <p>A simple overview of your academic workload.</p>
          </div>

          <ChartNoAxesCombined size={20} />
        </div>

        <div className="progress-summary">
          <div>
            <span>Completion rate</span>
            <strong>{progress}%</strong>
          </div>

          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="progress-stats">
          <article>
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </article>

          <article>
            <span>Completed</span>
            <strong>{completed}</strong>
          </article>

          <article>
            <span>In progress</span>
            <strong>{active}</strong>
          </article>
        </div>

        <h3 className="section-subtitle">Tasks by priority</h3>

        <div className="priority-breakdown">
          <div>
            <span className="priority high">High</span>
            <strong>{high}</strong>
          </div>

          <div>
            <span className="priority medium">Medium</span>
            <strong>{medium}</strong>
          </div>

          <div>
            <span className="priority low">Low</span>
            <strong>{low}</strong>
          </div>
        </div>
      </section>
    );
  }

  const pageDescriptions: Record<string, string> = {
    Dashboard: "Here's what your academic week looks like.",
    'My Tasks': 'Keep every assignment in one organized place.',
    Calendar: 'Stay aware of your upcoming deadlines.',
    'My Courses': 'Organize tasks by course or category.',
    Progress: 'See how far you have come.',
  };

  const avatarLetter = userName.charAt(0).toUpperCase();

  // LOADING
  if (!userId) {
    return (
      <main className="loading-screen">
        Memeriksa sesi TASKARA...
      </main>
    );
  }

  if (loadedUserId !== userId) {
    return (
      <main className="loading-screen">
        Memuat data TASKARA...
      </main>
    );
  }

  // MAIN UI
  return (
    <main className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate('Dashboard');
          }}
        >
          <span className="brand-mark">T</span>

          <span>
            TASKARA
            <small>ACADEMIC PLANNER</small>
          </span>
        </a>

        <p className="nav-caption">WORKSPACE</p>

        <nav>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => navigate(label)}
              className={`nav-item ${
                activeNav === label ? 'active' : ''
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={17} />
            <strong>One step at a time.</strong>
            <p>Make your semester feel more manageable.</p>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <span className="breadcrumb">
            Workspace <ChevronRight size={14} /> {activeNav}
          </span>

          <div className="top-actions">
            <div className="search">
              <Search size={16} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
              />
            </div>

            {/* NOTIFICATIONS */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                zIndex: notificationOpen ? 1002 : 10,
              }}
            >
              <button
                type="button"
                className="icon-button"
                aria-label="Notifications"
                title="Notifications"
                aria-expanded={notificationOpen}
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setProfileMenuOpen(false);
                }}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <Bell size={18} />

                {notificationCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      minWidth: '17px',
                      height: '17px',
                      borderRadius: '50%',
                      background: '#d87582',
                      color: '#ffffff',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                    }}
                  >
                    {notificationCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: 'min(320px, calc(100vw - 40px))',
                    zIndex: 2000,
                    background: '#ffffff',
                    border: '1px solid #e8e5ef',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 12px 35px rgba(40, 30, 70, 0.16)',
                    color: '#292638',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <strong style={{ fontSize: '14px' }}>
                      Notifications
                    </strong>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      aria-label="Tutup notifikasi"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#858195',
                        display: 'flex',
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {notificationTasks.length > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        maxHeight: '280px',
                        overflowY: 'auto',
                      }}
                    >
                      {notificationTasks.map((task) => {
                        const isOverdue = task.due < today;
                        const isToday = task.due === today;

                        return (
                          <div
                            key={task.id}
                            style={{
                              padding: '11px',
                              borderRadius: '10px',
                              background: '#f8f7fb',
                              borderLeft: `3px solid ${
                                isOverdue
                                  ? '#d87582'
                                  : isToday
                                    ? '#e8b65c'
                                    : '#8b7fc7'
                              }`,
                            }}
                          >
                            <strong
                              style={{
                                display: 'block',
                                fontSize: '12px',
                                marginBottom: '4px',
                              }}
                            >
                              {task.title}
                            </strong>

                            <span
                              style={{
                                display: 'block',
                                fontSize: '11px',
                                color: '#858195',
                              }}
                            >
                              {task.course} · {formatDate(task.due)}
                            </span>

                            <span
                              style={{
                                display: 'inline-block',
                                marginTop: '6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                color: isOverdue
                                  ? '#d87582'
                                  : isToday
                                    ? '#b98529'
                                    : '#8b7fc7',
                              }}
                            >
                              {isOverdue
                                ? 'Terlambat'
                                : isToday
                                  ? 'Deadline hari ini'
                                  : 'Deadline mendatang'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '22px 10px',
                        color: '#858195',
                      }}
                    >
                      <Bell
                        size={25}
                        style={{ marginBottom: '8px', opacity: 0.5 }}
                      />
                      <p style={{ fontSize: '12px', margin: 0 }}>
                        Belum ada notifikasi.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                zIndex: profileMenuOpen ? 1002 : 10,
              }}
            >
              <button
                type="button"
                className="avatar small"
                aria-label="Buka menu profil"
                aria-expanded={profileMenuOpen}
                title="My profile"
                onClick={() => {
                  setProfileMenuOpen((open) => !open);
                  setNotificationOpen(false);
                }}
                style={{
                  cursor: 'pointer',
                  border: profileMenuOpen
                    ? '2px solid #8b7fc7'
                    : '2px solid transparent',
                  fontFamily: 'inherit',
                }}
              >
                {avatarLetter}
              </button>

              {profileMenuOpen && (
                <div
                  className="profile-menu"
                  style={{
                    position: 'fixed',
                    top: '84px',
                    right: 'clamp(18px, 3vw, 42px)',
                    left: 'auto',
                    bottom: 'auto',
                    width: '250px',
                    maxWidth: 'calc(100vw - 32px)',
                    maxHeight: 'calc(100vh - 100px)',
                    overflowY: 'auto',
                    boxSizing: 'border-box',
                    zIndex: 9999,
                    display: 'block',
                    background: '#ffffff',
                    border: '1px solid #e8e5ef',
                    borderRadius: '14px',
                    padding: '14px',
                    boxShadow: '0 12px 35px rgba(40, 30, 70, 0.16)',
                    color: '#292638',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '11px',
                      padding: '5px 3px 13px',
                    }}
                  >
                    <div
                      className="avatar"
                      style={{
                        width: '42px',
                        height: '42px',
                        flexShrink: 0,
                      }}
                    >
                      {avatarLetter}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {userName}
                      </strong>

                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#858195',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {userEmail}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      height: '1px',
                      background: '#eeeaf4',
                      margin: '2px 0 9px',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '8px 9px',
                      color: '#858195',
                      fontSize: '12px',
                    }}
                  >
                    <UserRound size={16} />
                    <span>Student account</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '10px',
                      marginTop: '5px',
                      border: 'none',
                      borderRadius: '9px',
                      background: '#fff5f6',
                      color: '#d87582',
                      cursor: loggingOut ? 'wait' : 'pointer',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    <LogOut size={16} />
                    {loggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeNav !== 'Dashboard' && (
  <div className="welcome-row">
    <div>
      <p className="eyebrow">
        {new Date()
          .toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          .toUpperCase()}
      </p>

      <h1>
        {activeNav} <span>✦</span>
      </h1>

      <p className="subtitle">
        {pageDescriptions[activeNav]}
      </p>
    </div>

    <button
      className="primary-button"
      onClick={openAddForm}
    >
      <Plus size={17} /> Add new task
    </button>
  </div>
)}

          {activeNav === 'Dashboard' && renderDashboard()}
          {activeNav === 'My Tasks' && renderTaskCollection()}
          {activeNav === 'Calendar' && renderCalendar()}
          {activeNav === 'My Courses' && renderCourses()}
          {activeNav === 'Progress' && renderProgress()}

          <footer>
            <span>
              Made for students, with a little more breathing room.
            </span>
            <span>TASKARA © 2026</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
