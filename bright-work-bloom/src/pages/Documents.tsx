import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Upload, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const documents = [
  { name: "Employee Handbook 2026", type: "PDF", size: "2.4 MB", date: "2026-01-15", category: "Policies" },
  { name: "Leave Policy", type: "PDF", size: "1.1 MB", date: "2025-11-20", category: "Policies" },
  { name: "Onboarding Checklist", type: "DOCX", size: "340 KB", date: "2025-12-10", category: "Templates" },
  { name: "Performance Review Template", type: "XLSX", size: "520 KB", date: "2026-01-05", category: "Templates" },
  { name: "Benefits Summary", type: "PDF", size: "1.8 MB", date: "2026-02-01", category: "Benefits" },
  { name: "Code of Conduct", type: "PDF", size: "890 KB", date: "2025-09-15", category: "Policies" },
];

export default function Documents() {
  return (
    <AppLayout title="Documents">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{documents.length} documents</p>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
        <div className="grid gap-3">
          {documents.map((doc, i) => (
            <Card key={i} className="shadow-sm animate-fade-in hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} · {doc.size} · {doc.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground hidden sm:inline">{doc.category}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
