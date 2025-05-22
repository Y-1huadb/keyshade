import { useAtom } from 'jotai'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    exportProjectOpenAtom,
    selectedProjectAtom,
    localProjectPrivateKeyAtom,
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

interface ExportProjectRequest {
    projectSlug: string
    format: string
    privateKey?: string
}

interface ExportFileData {
    buffer: ArrayBuffer
    filename: string
    contentType: string
}


export default function ExportProjectSheet(): JSX.Element {
    const [isExportProjectSheetOpen, setIsExportProjectSheetOpen] = useAtom(exportProjectOpenAtom)
    const [selectedProject, setSelectedProject] = useAtom(selectedProjectAtom)
    const [localPrivateKeys] = useAtom(localProjectPrivateKeyAtom)

    const [isLoading, setIsLoading] = useState(false)
    const [format, setFormat] = useState('JSON')
    const [privateKey, setPrivateKey] = useState('')

    const hasLocalPrivateKey = selectedProject
        ? localPrivateKeys.some((item) => item.slug === selectedProject.slug && item.key)
        : false

    const exportProject = useHttp<ExportProjectRequest, {
        success: boolean;
        error: { message: string; error: string; statusCode: number } | null;
        data: ExportFileData | null;
    }>(() =>
        ControllerInstance.getInstance().projectController.exportProject({
            projectSlug: selectedProject!.slug,
            format,
            privateKey: hasLocalPrivateKey
                ? localPrivateKeys.find((item) => item.slug === selectedProject!.slug)?.key
                : privateKey
        })
    )

    const handleExportProject = useCallback(async () => {
        if (!selectedProject) return
        setIsLoading(true)
        toast.loading('Exporting project...')

        try {
            const { data, success } = await exportProject()
            if (success && data) {
                // Create a blob from the buffer
                const blob = new Blob([data.buffer], { type: data.contentType })
                // Create a download link
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = data.filename
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast.success('Project exported successfully')
            }
        } finally {
            setIsExportProjectSheetOpen(false)
            setSelectedProject(null)
            setIsLoading(false)
            toast.dismiss()
        }
    }, [
        selectedProject,
        exportProject,
        setIsExportProjectSheetOpen,
        setSelectedProject
    ])

    const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormat(e.target.value)
    }

    const handlePrivateKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrivateKey(e.target.value)
    }

    useEffect(() => {
        if (selectedProject) {
            setFormat('JSON')
            setPrivateKey('')
        }
    }, [selectedProject])

    const renderExample = () => {
        switch (format) {
            case 'JSON':
            default:
                return `{
  "API_KEY": "abcd1234",
  "GITHUB_TOKEN": "ghp_5678",
  "PORT": 3000
}`
        }
    }

    return (
        <Sheet onOpenChange={setIsExportProjectSheetOpen} open={isExportProjectSheetOpen}>
            <SheetContent className="border-white/15 bg-[#222425]">
                <SheetHeader>
                    <SheetTitle className="text-white">Export Project</SheetTitle>
                    <SheetDescription>Export your project data in the desired format</SheetDescription>
                </SheetHeader>

                <div className="grid gap-4 py-4">
                    <Label className="text-white font-semibold">Project Name:</Label>
                    <p className="mt-1 text-white/80">{selectedProject?.name}</p>
                </div>

                {/* Format 下拉 */}
                <div className="mb-6">
                    <Label className="text-white font-semibold" htmlFor="format">Format</Label>
                    <select
                        className="mt-1 w-full rounded border border-white/10 bg-[#222425] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        id="format"
                        onChange={handleFormatChange}
                        value={format}
                    >
                        <option value="JSON">JSON</option>
                    </select>
                </div>

                {/* Example 区域 */}
                <div className="mb-6">
                    <Label className="text-white font-semibold mb-2">Example</Label>
                    <pre
                        className="max-h-40 overflow-auto rounded bg-[#2a2c2d] p-4 text-sm text-green-400 whitespace-pre-wrap"
                    >
                        {renderExample()}
                    </pre>
                </div>

                {/* Private Key 输入框显示条件：
            storePrivateKey === false 且 本地没有私钥时显示 */}
                {!selectedProject?.storePrivateKey && !hasLocalPrivateKey && (
                    <div className="mb-6">
                        <Label className="text-white font-semibold" htmlFor="privateKey">Private Key</Label>
                        <input
                            className="mt-1 w-full rounded border border-white/10 bg-[#222425] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            id="privateKey"
                            onChange={handlePrivateKeyChange}
                            placeholder="Please input your private key"
                            type="text"
                            value={privateKey}
                        />
                    </div>
                )}

                <SheetFooter>
                    <Button
                        disabled={isLoading}
                        onClick={handleExportProject}
                        variant="secondary"
                    >
                        {isLoading ? 'Downloading...' : 'Download'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
