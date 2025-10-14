import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Textarea } from "@/components/ui/textarea"
  import { Upload } from "lucide-react"
  
  export default function PayrollPage() {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payroll Centralization</CardTitle>
            <CardDescription>Upload and process payroll data for centralization.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="payroll-file">Payroll File</Label>
                <div className="flex items-center gap-3">
                    <Input id="payroll-file" type="file" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('payroll-file')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">No file selected</span>
                </div>
                <p className="text-xs text-muted-foreground">Upload a CSV, XLSX, or XML file containing payroll data.</p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="e.g., October 2023 Payroll" />
              </div>
              <div className="flex justify-end">
                <Button>Process Payroll</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Processing History</CardTitle>
                <CardDescription>View the status of past payroll uploads.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">No processing history yet.</p>
            </CardContent>
        </Card>
      </div>
    )
  }
  