import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hệ Thống Giám Sát Cân Công Nghiệp Đa Tầng',
  description: 'Industrial Multi-Tenant Scale IoT System - Real-time WIP Flow Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
