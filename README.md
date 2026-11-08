# \# 💜 TASKARA

# \### Your Academic Life, Under Control.

# 

# TASKARA is a web-based academic productivity platform designed to help university students organize their academic activities in one place.

# 

# With TASKARA, students can manage assignments, track deadlines, organize class schedules, manage courses, and monitor their academic progress through a simple and intuitive dashboard.

# 

# \*\*Live Demo:\*\* https://taskara-two.vercel.app/

# 

# \---

# 

# \## ✨ Features

# 

# \### 1. Dashboard

# \- Overview of academic activities.

# \- Summary of tasks and upcoming deadlines.

# \- Quick access to create new tasks.

# \- Academic statistics at a glance.

# 

# \### 2. My Tasks

# \- Create, edit, and delete tasks.

# \- Manage assignment deadlines.

# \- Organize tasks by priority and course.

# \- Track task completion.

# 

# \### 3. Calendar

# \- View academic schedules and deadlines.

# \- Organize activities through a calendar interface.

# 

# \### 4. My Courses

# \- Manage university courses.

# \- Organize academic information in one place.

# 

# \### 5. Progress Tracking

# \- Monitor completed and pending tasks.

# \- View academic productivity progress.

# 

# \### 6. Authentication

# \- User registration and login.

# \- Personal accounts.

# \- User-specific data management.

# 

# \---

# 

# \## 🛠️ Tech Stack

# 

# | Technology | Purpose |

# |---|---|

# | Next.js 15 | React framework |

# | TypeScript | Programming language |

# | Tailwind CSS | Styling |

# | Supabase | Database and authentication |

# | Vercel | Deployment |

# | Git \& GitHub | Version control |

# 

# \---

# 

# \## 🚀 Getting Started

# 

# Follow these steps to run TASKARA locally.

# 

# \### Prerequisites

# 

# Make sure you have installed:

# \- Node.js

# \- npm

# \- Git

# 

# \### 1. Clone the repository

# 

# ```bash

# git clone https://github.com/Meyla1/taskara.git

# ```

# 

# \### 2. Navigate to the project folder

# 

# ```bash

# cd taskara

# ```

# 

# \### 3. Install dependencies

# 

# ```bash

# npm install

# ```

# 

# \### 4. Configure environment variables

# 

# Create a `.env.local` file in the root directory and add your Supabase credentials:

# 

# ```env

# NEXT\_PUBLIC\_SUPABASE\_URL=your\_supabase\_project\_url

# NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=your\_supabase\_anon\_key

# ```

# 

# Replace the placeholder values with your own Supabase project credentials.

# 

# \*\*Important:\*\* Never upload `.env.local` or expose your private credentials publicly.

# 

# \### 5. Run the development server

# 

# ```bash

# npm run dev

# ```

# 

# Open \[http://localhost:3000](http://localhost:3000) in your browser.

# 

# \---

# 

# \## 📁 Project Structure

# 

# ```text

# taskara/

# ├── app/

# │   ├── auth/

# │   ├── confirm-signup/

# │   ├── globals.css

# │   ├── icon.svg

# │   ├── layout.tsx

# │   ├── not-found.tsx

# │   └── page.tsx

# │

# ├── components/

# │   └── CourseManager.tsx

# │

# ├── lib/

# │   └── supabase.ts

# │

# ├── public/

# │

# ├── .gitignore

# ├── package.json

# └── README.md

# ```

# 

# \---

# 

# \## 🎨 Design Philosophy

# 

# TASKARA focuses on creating a comfortable and intuitive academic productivity experience.

# 

# The interface uses a soft lavender color palette, clean layouts, and a simple navigation system to help students stay organized without feeling overwhelmed.

# 

# \---

# 

# \## 🔐 Data \& Security

# 

# \- Supabase Row Level Security (RLS) is enabled for tasks and courses.

# \- User-specific access policies help prevent users from accessing other users' records.

# \- Environment variables are used to configure Supabase credentials.

# 

# \---

# 

# \## 🌐 Deployment

# 

# TASKARA is deployed using Vercel.

# 

# \*\*Live Website:\*\* https://taskara-two.vercel.app/

# 

# \---

# 

# \## 👩‍💻 Developer

# 

# \*\*Meyla Rizqina\*\*

# 

# Created as a personal web development project to explore modern web technologies and build a practical academic productivity solution for university students.

# 

# \---

# 

# \## 📌 Project Status

# 

# \*\*Version:\*\* 1.0.0

# 

# \*\*Status:\*\* Deployed and functional.

# 

# \---

# 

# \*Made with 💜 to make academic life more organized.\*

