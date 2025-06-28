import type { File as FileType } from "@/lib/db/schema"
import type { ThemeProviderProps } from "next-themes"

export interface ProviderProps {
    children: React.ReactNode,
    themeProps?: ThemeProviderProps
}
export interface SerealizedUser {
    id: string | null
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
    username?: string | null
    emailAddress?: string | null
}

export interface NavbarProps {
    user?: SerealizedUser | null
}

export interface FolderNavigationProps {
  folderPath: Array<{ id: string; name: string }>
  navigateUp: () => void
  navigateToPathFolder: (index: number) => void
}

export interface FileUploadFormProps {
  userId: string
  onUploadSuccess?: () => void
  currentFolder?: string | null
}

export interface FileTabsProps {
  activeTab: string
  onTabChange: (key: string) => void
  files: FileType[]
  starredCount: number
  trashCount: number
}

export interface FileListProps {
  userId: string
  refreshTrigger?: number
  onFolderChange?: (folderId: string | null) => void
}

export interface FileIconProps {
  file: FileType
}

export interface FileEmptyStateProps {
  activeTab: string
}

export interface FileActionsProps {
  file: FileType
  onStar: (id: string) => void
  onTrash: (id: string) => void
  onDelete: (file: FileType) => void
  onDownload: (file: FileType) => void
}

export interface FileActionButtonsProps {
  activeTab: string
  trashCount: number
  folderPath: Array<{ id: string; name: string }>
  onRefresh: () => void
  onEmptyTrash: () => void
}


export interface DashboardContentProps {
  userId: string
  userName: string
}