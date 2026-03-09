import { Types } from 'mongoose'

export interface Account {
  username: string
  password: string
}

export interface Class {
  name: string
  visibility: 'public' | 'private'
  users: {
    account: Types.ObjectId
    role: 'viewer' | 'editor' | 'owner'
  }[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Stack {
  name: string
  class: Types.ObjectId
  visibility: 'public' | 'private'
  users: {
    account: Types.ObjectId
    role: 'viewer' | 'editor' | 'owner'
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