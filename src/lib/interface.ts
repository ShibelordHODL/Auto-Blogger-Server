export enum STATUS {
  EXTRACTING = 'EXTRACTING',
  ASSIGNING = 'ASSIGNING',
  TRANSLATING = 'TRANSLATING',
  IMAGING = 'IMAGING',
  PUBLISHING = 'PUBLISHING',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
}

enum POST_STATUS {
  ASSIGNED = 'ASSIGNED',
  POSTED = 'POSTED',
}

export enum SITE_TYPE {
  WORDPRESS = 'WORDPRESS',
}
export interface IUser {
  id: string
  createdAt: Date
  updatedAt: Date

  email: string
  password: string
  sites: [ISite]
}
export interface ISite {
  id: string
  title: string
  type: SITE_TYPE
  apiPath: string
  token: string
  categories: [ISiteCategory]
  jobs: [IJob]
  posts: [IPost]

  user: IUser
  createdAt: Date
  updatedAt: Date
}

export interface ISiteCategory {
  id: string
  title: string
  ref: number
  site: ISite
  category: ICategory
  jobs: [IJob]
  posts: [IPost]
  limitPost: number

  createdAt: Date
  updatedAt: Date
}

export interface IPost {
  id?: string
  url?: string
  status: POST_STATUS
  article?: IArticle
  articleId?: string
  site?: ISite
  siteId?: string

  siteCategory?: ISiteCategory
  siteCategoryId?: string
  createdAt?: Date
}
export interface IJob {
  id: string
  url: string
  status: STATUS
  site: ISite
  siteCategory: ISiteCategory
  rawHTML: string
  rawTitle: string
  rawArticle: string
  rawTranslate: string
  article: IArticle
  postDate: Date
}

export interface IArticle {
  id: string
  url: string
  title: string
  content: string
  category: ICategory
  images: [IImage]
  wordCount: number
  excerpt: string
  status: STATUS
  job: IJob
  post: IPost
  publishedDate: Date
  createdAt: Date
}

export interface ICategory {
  id?: string
  title?: string
  parent?: ICategory
  articles?: [IArticle]
  siteCategories?: [ISiteCategory]
}

export interface IImage {
  id?: string
  ref?: string
  postRef?: number
  source?: string
  target?: string
  article?: IArticle
}
