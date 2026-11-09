import { Briefcase, CheckCircle2, Inbox, Package } from "lucide-react";

const notifications = [
  {
    icon: Inbox,
    title: "Pesan baru masuk",
    desc: "3 pertanyaan dari formulir kontak",
    tone: "bg-[var(--warning50)] text-[var(--warning600)]",
    position: "-top-7 -left-10",
  },
  {
    icon: Briefcase,
    title: "Lowongan dibuka",
    desc: "Software Engineer · 12 pelamar",
    tone: "bg-[var(--info50)] text-[var(--info600)]",
    position: "-top-14 -right-4",
  },
  {
    icon: Package,
    title: "Produk diperbarui",
    desc: "Spesifikasi & galeri tersimpan",
    tone: "bg-[var(--primary50)] text-[var(--primary600)]",
    position: "top-[46%] -right-12",
  },
  {
    icon: CheckCircle2,
    title: "Berita diterbitkan",
    desc: "Tampil di website dalam hitungan detik",
    tone: "bg-[var(--success50)] text-[var(--success600)]",
    position: "-bottom-6 -left-8",
  },
];

/**
 * Ilustrasi laptop berisi miniatur dashboard CMS (dekoratif). Dirender dengan HTML/CSS agar
 * tetap tajam di semua resolusi dan memakai token warna Atlas.
 */
export function LaptopMockup({ className }: { className?: string }) {
  const rows = [
    { w: "w-[62%]", status: "Terbit" },
    { w: "w-[48%]", status: "Terbit" },
    { w: "w-[56%]", status: "Draf" },
    { w: "w-[40%]", status: "Terbit" },
    { w: "w-[52%]", status: "Draf" },
    { w: "w-[44%]", status: "Terbit" },
  ];

  return (
    <div aria-hidden className={className}>
      <div className="relative [transform:perspective(1800px)_rotateY(-14deg)_rotateX(5deg)] drop-shadow-[0_40px_40px_rgb(15_23_42/0.35)]">
        {/* Layar */}
        <div className="rounded-t-[18px] rounded-b-[6px] bg-[#1b1d22] p-[7px] pb-[10px] ring-1 ring-black/40">
          <div className="flex aspect-[16/10] overflow-hidden rounded-[8px] bg-[var(--neutral25)] text-[7px] leading-none">
            {/* Sidebar */}
            <div className="flex w-[23%] flex-col gap-1.5 border-r border-[var(--neutral100)] bg-[var(--neutral0)] p-2">
              <div className="mb-1.5 flex items-center gap-1">
                <span className="size-2.5 rounded-[3px] bg-[var(--primary500)]" />
                <span className="font-bold text-[var(--neutral900)]">Asyst CMS</span>
              </div>
              {["Dashboard", "Produk", "Studi kasus", "Berita", "Media", "Halaman"].map((label, i) => (
                <span
                  key={label}
                  className={
                    i === 3
                      ? "rounded-[4px] bg-[var(--primary50)] px-1.5 py-1 font-semibold text-[var(--primary600)]"
                      : "px-1.5 py-1 text-[var(--neutral500)]"
                  }
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Konten */}
            <div className="flex flex-1 flex-col gap-2 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[var(--neutral900)]">Berita</span>
                <span className="rounded-full bg-[var(--primary500)] px-2 py-1 font-semibold text-white">+ Tambah</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  ["153", "Konten"],
                  ["122", "Media"],
                  ["17", "Halaman"],
                ].map(([n, label]) => (
                  <div key={label} className="rounded-[6px] border border-[var(--neutral100)] bg-[var(--neutral0)] p-1.5">
                    <div className="text-[10px] font-bold text-[var(--neutral900)]">{n}</div>
                    <div className="mt-0.5 text-[var(--neutral500)]">{label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-1 flex-col gap-1 rounded-[6px] border border-[var(--neutral100)] bg-[var(--neutral0)] p-1.5">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-[4px] p-1 odd:bg-[var(--neutral25)]">
                    <span className="size-4 shrink-0 rounded-[3px] bg-gradient-to-br from-[var(--primary200)] to-[var(--primary400)]" />
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className={`h-1 rounded-full bg-[var(--neutral300)] ${row.w}`} />
                      <span className="h-1 w-[30%] rounded-full bg-[var(--neutral100)]" />
                    </div>
                    <span
                      className={
                        row.status === "Terbit"
                          ? "rounded-full bg-[var(--success50)] px-1.5 py-0.5 font-semibold text-[var(--success600)]"
                          : "rounded-full bg-[var(--neutral50)] px-1.5 py-0.5 font-semibold text-[var(--neutral500)]"
                      }
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Badan / keyboard deck */}
        <div className="relative -mx-[7%] h-[14px] rounded-b-[14px] rounded-t-[3px] bg-gradient-to-b from-[#e9ebef] via-[#c9ccd3] to-[#9a9ea8]">
          <span className="absolute top-0 left-1/2 h-[5px] w-[16%] -translate-x-1/2 rounded-b-[6px] bg-[#b4b8c0]" />
        </div>

        {/* Kartu notifikasi yang ikut "timbul" di sekitar laptop */}
        {notifications.map(({ icon: Icon, title, desc, tone, position }) => (
          <div
            key={title}
            className={`absolute flex items-center gap-2.5 rounded-[14px] bg-[var(--neutral0)] px-3.5 py-2.5 shadow-[0_18px_40px_-12px_rgb(15_23_42/0.35)] ring-1 ring-[var(--neutral100)] ${position}`}
          >
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon className="size-4" />
            </span>
            <div className="leading-tight whitespace-nowrap">
              <div className="text-xs font-semibold text-[var(--neutral900)]">{title}</div>
              <div className="text-[11px] text-[var(--neutral500)]">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
