import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardPanelProps = {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function DashboardPanel({
  title,
  description,
  className,
  children,
}: DashboardPanelProps) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <div className="flex h-40 items-end gap-1.5 rounded-lg border border-dashed border-border bg-muted/20 px-4 pb-4 pt-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={index}
            className="flex-1 rounded-sm"
            style={{ height: `${20 + ((index * 17) % 60)}%` }}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
