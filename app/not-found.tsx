
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F7FB] px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EDE9F7] text-3xl font-extrabold text-[#8B7FC7]">
          T
        </div>

        <p className="mb-3 text-sm font-bold tracking-[0.2em] text-[#8B7FC7]">
          TASKARA
        </p>

        <h1 className="mb-3 text-7xl font-extrabold text-[#292638]">
          404
        </h1>

        <h2 className="mb-3 text-xl font-bold text-[#292638]">
          Halaman tidak ditemukan
        </h2>

        <p className="mb-8 text-sm leading-6 text-[#858195]">
          Sepertinya halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
          Jangan khawatir, mari kembali ke tempat yang aman.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-[#8B7FC7] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#786BB5]"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </main>
  );
}
