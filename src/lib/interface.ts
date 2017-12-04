export enum STATUS {
    DRAFTING = "DRAFTING",
    READY = "READY",
    EXTRACTING = "EXTRACTING",
    TRANSLATING = "TRANSLATING",
    PUBLISHING = "PUBLISHING",
    COMPLETE = "COMPLETE",
    CANCELLED = "CANCELLED",
}

export enum SITE_TYPE {
    WORDPRESS = "WORDPRESS"
}
export interface User {
    id: string
    createdAt: Date
    updatedAt: Date

    email: string
    password: string
    sites: [Site]
}
export interface Site {
    id: string
    title: string
    type: SITE_TYPE
    apiPath: string
    token: string
    categories: [CategoryMapping]
    posts: [Post]

    user: User
    createdAt: Date
    updatedAt: Date
}

export interface CategoryMapping {
    id: string
    title: string
    categoryCode: string
    site: Site
    category: Category
    limitPost: number

    createdAt: Date
    updatedAt: Date
}

export interface Post {
    id: string
    url: string
    article: Article
    site: Site

    postDate: Date
    createdAt: Date
}
export interface Job {
    id: string
    url: string
    status: STATUS
    rawHTML: string
    rawTitle: string
    rawArticle: string
    rawTranslate: string
    article: Article
}

export interface Article {
    id: string
    url: string
    title: string
    article: string
    categories: [Category]
    images: [Image]
    wordCount: number
    excerpt: String
    status: STATUS
    job: Job
    post: Post
    publishedDate: Date
    createdAt: Date
}

export interface Category {
    id: string
    name: string
    parent: Category
    articles: [Article]
    categoryMapping: [CategoryMapping]
}

export interface Image {
    id: string
    source: string
    article: Article
}

