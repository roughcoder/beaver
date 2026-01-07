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

export const Route = createFileRoute("/_app/project/$projectId/keywords")({
  component: KeywordsPage,
});

const mockKeywords: Array<{
  keyword: string;
  impact: "High" | "Medium" | "Low";
  position: number;
  change: number;
}> = [
  { keyword: "best crm for startups", impact: "High", position: 6, change: +2 },
  { keyword: "crm onboarding checklist", impact: "Medium", position: 14, change: -1 },
  { keyword: "sales pipeline template", impact: "High", position: 9, change: +0 },
  { keyword: "lead scoring model", impact: "Low", position: 27, change: +4 },
];

function KeywordsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Keywords</h2>
        <p className="text-muted-foreground">
          Keyword impact and SERP positions (mocked for now).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracked keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockKeywords.map((row) => (
                <TableRow key={row.keyword}>
                  <TableCell className="font-medium">{row.keyword}</TableCell>
                  <TableCell>{row.impact}</TableCell>
                  <TableCell>{row.position}</TableCell>
                  <TableCell>
                    {row.change > 0 ? `+${row.change}` : `${row.change}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

