export type HelpRequestStatus =
  | 'PENDING_REVIEW'
  | 'OPEN'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ARCHIVED'

export type AdminHelpRequestAuthor = {
  userId: string
  name: string
  profilePhoto: string | null
  village: string
  taluka: string
  district: string
  state: string
  verified: boolean
}

export type AdminHelpRequest = {
  id: string
  author: AdminHelpRequestAuthor
  title: string
  description: string
  images: Array<{ url: string; publicId: string }>
  status: HelpRequestStatus
  supportCount: number
  reportCount: number
  moderationNote: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type PaginatedAdminHelpRequests = {
  requests: AdminHelpRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type AdminAssistanceListQuery = {
  page?: number
  limit?: number
  search?: string
  district?: string
  status?: HelpRequestStatus | ''
}
