import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/content")({
  component: ContentPage,
});

const mockContent: Array<{
  title: string;
  targetKeyword: string;
  status: "Draft" | "Published" | "In review";
}> = [
  {
    title: "CRM Onboarding Checklist (2026)",
    targetKeyword: "crm onboarding checklist",
    status: "Published",
  },
  {
    title: "How to Build a Lead Scoring Model",
    targetKeyword: "lead scoring model",
    status: "In review",
  },
  {
    title: "Sales Pipeline Template: A Practical Guide",
    targetKeyword: "sales pipeline template",
    status: "Draft",
  },
];

function ContentPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Content</h2>
        <p className="text-muted-foreground">
          Articles that target your keywords (mocked for now).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content library</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Target keyword</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContent.map((row) => (
                <TableRow key={row.title}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.targetKeyword}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

