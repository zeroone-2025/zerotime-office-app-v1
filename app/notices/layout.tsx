import { ProtectedLayout } from '@/app/_components/ProtectedLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
