export interface SitePerformance {
    id: string;
    name: string;
    type: string;
    address: string;
    revenue: number;
    staffCount: number;
    lowStock: number;
    transactionCount: number;
}

export interface GlassKPICardProps {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    sub?: string;
    route?: string;
    trend?: string;
}
