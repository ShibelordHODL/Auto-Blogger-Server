export enum STATUS {
  EXTRACTING = 'EXTRACTING',
  READY = 'READY',
  TRANSLATING = 'TRANSLATING',
  PUBLISHING = 'PUBLISHING',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
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
  categories: [ICategoryMapping]
  posts: [IPost]

  user: IUser
  createdAt: Date
  updatedAt: Date
}

export interface ICategoryMapping {
  id: string
  title: string
  categoryCode: string
  site: ISite
  category: ICategory
  limitPost: number

  createdAt: Date
  updatedAt: Date
}

export interface IPost {
  id: string
  url: string
  article: IArticle
  site: ISite

  postDate: Date
  createdAt: Date
}
export interface IJob {
  id: string
  url: string
  status: STATUS
  rawHTML: string
  rawTitle: string
  rawArticle: string
  rawTranslate: string
  article: IArticle
}

export interface IArticle {
  id: string
  url: string
  title: string
  article: string
  categories: [ICategory]
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
  id: string
  name: string
  parent: ICategory
  articles: [IArticle]
  categoryMapping: [ICategoryMapping]
}

export interface IImage {
  id: string
  ref: string
  source: string
  article: IArticle
}
