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
  stacks: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Stack {
  name: string
  visibility: 'public' | 'private'
  users: {
    account: Types.ObjectId
    role: 'viewer' | 'editor' | 'owner'
  }[]
  cards: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Card {
  front: string
  back: string
}