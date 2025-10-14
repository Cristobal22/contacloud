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
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { Upload } from "lucide-react"
  
  export default function TaxDocumentsPage() {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tax Document Centralization</CardTitle>
            <CardDescription>Upload purchase or sales documents for centralization.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="document-type">Document Type</Label>
                <Select>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase Document</SelectItem>
                    <SelectItem value="sales">Sales Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tax-document-file">Document File</Label>
                <div className="flex items-center gap-3">
                    <Input id="tax-document-file" type="file" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('tax-document-file')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">No file selected</span>
                </div>
                <p className="text-xs text-muted-foreground">Upload a PDF, XML, or image file.</p>
              </div>
              <div className="flex justify-end">
                <Button>Process Document</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>View the status of past document uploads.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">No upload history yet.</p>
            </CardContent>
        </Card>
      </div>
    )
  }
  