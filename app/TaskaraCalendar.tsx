
'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Clock3,
  CheckCircle2,
  Circle,
  CalendarCheck,
} from 'lucide-react';

type CalendarTask = {
  id: string;
  title: string;
  course: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  done: boolean;
};

type CalendarView = 'Month' | 'Week' | 'Day';

type Props = {
  tasks: CalendarTask[];
  onAddTask: () => void;
  onEditTask: (task: CalendarTask) => void;
};

const WEEKDAYS = [
  'Senin', 'Selasa', 'Rabu', 'Kamis',
  'Jumat', 'Sabtu', 'Minggu',
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function sameDate(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

function formatMonth(date: Date) {
  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

export default function TaskaraCalendar({
  tasks,
  onAddTask,
  onEditTask,
}: Props) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [view, setView] = useState<CalendarView>('Month');

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, CalendarTask[]> = {};

    tasks.forEach((task) => {
      if (!task.due) return;

      if (!grouped[task.due]) {
        grouped[task.due] = [];
      }

      grouped[task.due].push(task);
    });

    return grouped;
  }, [tasks]);

  const selectedTasks = tasksByDate[dateKey(selectedDate)] || [];

  const monthDays = useMemo(() => {
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const gridStart = startOfWeek(firstDay);
    const totalCells = Math.ceil(
      (lastDay.getDate() + (firstDay.getDay() + 6) % 7) / 7
    ) * 7;

    return Array.from({ length: totalCells }, (_, index) =>
      addDays(gridStart, index)
    );
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);

    return Array.from({ length: 7 }, (_, index) =>
      addDays(start, index)
    );
  }, [selectedDate]);

  function goPrevious() {
    if (view === 'Month') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        )
      );
    } else if (view === 'Week') {
      setSelectedDate((date) => addDays(date, -7));
    } else {
      setSelectedDate((date) => addDays(date, -1));
    }
  }

  function goNext() {
    if (view === 'Month') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1
        )
      );
    } else if (view === 'Week') {
      setSelectedDate((date) => addDays(date, 7));
    } else {
      setSelectedDate((date) => addDays(date, 1));
    }
  }

  function goToday() {
    const now = new Date();

    setCurrentDate(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );

    setSelectedDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate())
    );
  }

  function changeView(nextView: CalendarView) {
    setView(nextView);

    if (nextView === 'Month') {
      setCurrentDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );
    }
  }

  function selectDate(date: Date) {
    setSelectedDate(date);

    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(
        new Date(date.getFullYear(), date.getMonth(), 1)
      );
    }
  }

  const headingDate =
    view === 'Month'
      ? formatMonth(currentDate)
      : view === 'Week'
        ? `${formatShortDate(weekDays[0])} – ${formatShortDate(weekDays[6])}`
        : formatFullDate(selectedDate);

  function renderDayCell(date: Date, compact = false) {
    const key = dateKey(date);
    const dayTasks = tasksByDate[key] || [];
    const isToday = sameDate(date, today);
    const isSelected = sameDate(date, selectedDate);
    const isCurrentMonth =
      date.getMonth() === currentDate.getMonth();

    return (
      <button
        key={key}
        type="button"
        className={[
          'taskara-calendar-day',
          isToday ? 'is-today' : '',
          isSelected ? 'is-selected' : '',
          !isCurrentMonth && view === 'Month' ? 'is-outside' : '',
          compact ? 'is-compact' : '',
        ].join(' ')}
        onClick={() => selectDate(date)}
      >
        <span className="calendar-day-number">
          {date.getDate()}
        </span>

        {compact ? (
          <div className="calendar-day-dots">
            {dayTasks.slice(0, 4).map((task) => (
              <span
                key={task.id}
                className={`calendar-dot ${task.done ? 'done' : ''}`}
              />
            ))}
          </div>
        ) : (
          <div className="calendar-day-events">
            {dayTasks.slice(0, 3).map((task) => (
              <span
                key={task.id}
                className={`calendar-event ${task.done ? 'done' : ''}`}
                title={task.title}
              >
                {task.title}
              </span>
            ))}

            {dayTasks.length > 3 && (
              <span className="calendar-more">
                +{dayTasks.length - 3} lainnya
              </span>
            )}
          </div>
        )}
      </button>
    );
  }

  function renderTaskItem(task: CalendarTask) {
    return (
      <article className="calendar-agenda-item" key={task.id}>
        <div className={`agenda-status ${task.done ? 'completed' : ''}`}>
          {task.done ? (
            <CheckCircle2 size={18} />
          ) : (
            <Circle size={18} />
          )}
        </div>

        <div className="agenda-copy">
          <strong className={task.done ? 'agenda-done' : ''}>
            {task.title}
          </strong>
          <span>
            {task.course} · {task.priority} priority
          </span>
        </div>

        <button
          type="button"
          className="calendar-edit-button"
          onClick={() => onEditTask(task)}
        >
          Edit
        </button>
      </article>
    );
  }

  return (
    <section className="taskara-calendar">
      <div className="calendar-main-panel">
        <div className="calendar-toolbar">
          <div className="calendar-heading">
            <div className="calendar-heading-icon">
              <CalendarDays size={20} />
            </div>

            <div>
              <h2>{headingDate}</h2>
              <p>Manage your academic schedule.</p>
            </div>
          </div>

          <div className="calendar-controls">
            <button
              type="button"
              className="calendar-today-button"
              onClick={goToday}
            >
              Today
            </button>

            <div className="calendar-arrows">
              <button
                type="button"
                onClick={goPrevious}
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-view-switch">
              {(['Month', 'Week', 'Day'] as CalendarView[]).map(
                (item) => (
                  <button
                    type="button"
                    key={item}
                    className={view === item ? 'active' : ''}
                    onClick={() => changeView(item)}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {view === 'Month' && (
          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="calendar-month-grid">
              {monthDays.map((date) => renderDayCell(date))}
            </div>
          </div>
        )}

        {view === 'Week' && (
          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {weekDays.map((date) => (
                <button
                  type="button"
                  key={dateKey(date)}
                  onClick={() => selectDate(date)}
                  className={sameDate(date, selectedDate) ? 'active' : ''}
                >
                  <span>
                    {date.toLocaleDateString('id-ID', {
                      weekday: 'short',
                    })}
                  </span>
                  <strong>{date.getDate()}</strong>
                </button>
              ))}
            </div>

            <div className="calendar-week-grid">
              {weekDays.map((date) => renderDayCell(date))}
            </div>
          </div>
        )}

        {view === 'Day' && (
          <div className="calendar-day-view">
            <div className="day-view-date">
              <span>
                {selectedDate.toLocaleDateString('id-ID', {
                  weekday: 'long',
                })}
              </span>
              <strong>{selectedDate.getDate()}</strong>
              <small>
                {selectedDate.toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </small>
            </div>

            <div className="day-view-agenda">
              {selectedTasks.length > 0 ? (
                selectedTasks.map(renderTaskItem)
              ) : (
                <p className="calendar-empty">
                  Belum ada tugas pada tanggal ini.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="calendar-side-panel">
        <div className="calendar-side-heading">
          <div>
            <span className="calendar-side-eyebrow">
              SELECTED DATE
            </span>
            <h3>{formatFullDate(selectedDate)}</h3>
          </div>

          <span className="calendar-side-icon">
            <CalendarCheck size={19} />
          </span>
        </div>

        <div className="calendar-agenda-summary">
          <strong>{selectedTasks.length}</strong>
          <span>
            {selectedTasks.length === 1 ? 'task' : 'tasks'} scheduled
          </span>
        </div>

        <div className="calendar-agenda-list">
          {selectedTasks.length > 0 ? (
            selectedTasks.map(renderTaskItem)
          ) : (
            <div className="calendar-empty">
              <CalendarDays size={25} />
              <strong>No tasks scheduled</strong>
              <span>Enjoy your free time or plan something new.</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="calendar-add-button"
          onClick={onAddTask}
        >
          <Plus size={17} />
          Add new task
        </button>

        <div className="calendar-legend">
          <span>
            <i className="legend-dot upcoming" />
            Upcoming task
          </span>
          <span>
            <i className="legend-dot completed" />
            Completed task
          </span>
        </div>
      </aside>
    </section>
  );
}
