import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PagePlaceholderProps = {
  title: string;
  description: string;
  milestone: string;
};

export function PagePlaceholder({
  title,
  description,
  milestone,
}: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Coming soon</CardTitle>
            <Badge variant="outline">{milestone}</Badge>
          </div>
          <CardDescription>
            This section will be implemented in a future milestone. The
            navigation and layout are ready for monitoring features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Monitoring data will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
