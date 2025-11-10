import { ReactNode } from "react";
type LayoutProps = {
    title: string;
    description?: string;
    lastUpdated?: string | Date;
    refreshing?: boolean;
    onRefresh?: () => void;
    formSlot: ReactNode;
    listSlot: ReactNode;
    pendingCount?: number;
};
export declare function Layout({ title, description, lastUpdated, refreshing, onRefresh, formSlot, listSlot, pendingCount }: LayoutProps): import("react/jsx-runtime").JSX.Element;
export {};
