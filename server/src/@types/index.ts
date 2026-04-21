import { Types } from 'mongoose'

export interface Account {
  email?: string
  username: string
  password: string
  publicProfile?: boolean
}

export interface Class {
  name: string
  visibility: 'public' | 'private'
  users: {
    account: Types.ObjectId
    role: 'viewer' | 'editor' | 'owner'
    lastOpenedAt?: Date
  }[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Stack {
  name: string
  class?: Types.ObjectId
  visibility: 'public' | 'private'
  users: {
    account: Types.ObjectId
    role: 'viewer' | 'editor' | 'owner'
    lastOpenedAt?: Date
  }[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Card {
  stack: Types.ObjectId
  front: string
  back: string
}

export interface UserCardProgress {
  account: Types.ObjectId
  card: Types.ObjectId
  stack: Types.ObjectId
  status: 'learning' | 'review' | 'mastered'
}