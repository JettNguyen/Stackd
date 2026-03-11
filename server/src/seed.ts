import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import Account from './models/Account'
import Class from './models/Class'
import Stack from './models/Stack'
import Card from './models/Card'
import UserCardProgress from './models/UserCardProgress'
import mongo from './utils/mongo'
import crypt from './utils/crypt'

const bootstrap = async () => {
  try {
    await mongo.connect()
    console.log('🚀 Starting Seed...')

    // 1. Clean Slate
    await Promise.all([
      Account.deleteMany({}),
      Class.deleteMany({}),
      Stack.deleteMany({}),
      Card.deleteMany({}),
      UserCardProgress.deleteMany({})
    ])

    // 2. Create Accounts
    const [alicePass, bobPass, carolPass] = await Promise.all([
      crypt.hash('password123'),
      crypt.hash('password123'),
      crypt.hash('password123')
    ])

    const [alice, bob, carol] = await Account.insertMany([
      { email: 'alice_owner@ufl.edu', username: 'alice_owner', password: alicePass },
      { email: 'bob_editor@ufl.edu', username: 'bob_editor', password: bobPass },
      { email: 'carol_viewer@ufl.edu', username: 'carol_viewer', password: carolPass },
    ])

    // 3. Create Classes
    const [mathClass, scienceClass] = await Class.insertMany([
      {
        name: 'Mathematics 101',
        visibility: 'public',
        users: [
          { account: alice._id, role: 'owner' },  
          { account: bob._id, role: 'editor' },   
          { account: carol._id, role: 'viewer' }  
        ]
      },
      {
        name: 'Advanced Science',
        visibility: 'private',
        users: [
          { account: bob._id, role: 'owner' },
          { account: alice._id, role: 'editor' }, 
          { account: carol._id, role: 'viewer' }
        ]
      }
    ])

    // 4. Create Stacks (linked to Class)
    const calculusStack = await Stack.create({
      name: 'Calculus Basics',
      class: mathClass._id,
      visibility: 'public',
      users: [{ account: alice._id, role: 'owner' }]
    })

    const biologyStack = await Stack.create({
      name: 'Cell Biology',
      class: scienceClass._id,
      visibility: 'private',
      users: [{ account: bob._id, role: 'owner' }]
    })

    // 5. Create Cards (linked to Stack)
    const mathCards = await Card.insertMany([
      { stack: calculusStack._id, front: 'Derivative of sin(x)', back: 'cos(x)' },
      { stack: calculusStack._id, front: 'Square root of 144', back: '12' },
    ])

    const scienceCards = await Card.insertMany([
      { stack: biologyStack._id, front: 'Atomic number of Gold', back: '79' },
      { stack: biologyStack._id, front: 'Powerhouse of the cell', back: 'Mitochondria' },
    ])

    // 6. Optional: Seed initial progress
    await UserCardProgress.insertMany([
      { account: alice._id, stack: calculusStack._id, card: mathCards[0]._id, status: 'learning' },
      { account: alice._id, stack: calculusStack._id, card: mathCards[1]._id, status: 'review' },
      { account: bob._id, stack: biologyStack._id, card: scienceCards[0]._id, status: 'learning' },
      { account: bob._id, stack: biologyStack._id, card: scienceCards[1]._id, status: 'mastered' },
    ])

    console.log('✅ Seed successful: 3 Users, 2 Classes, 2 Stacks, 4 Cards, 4 Progress Records')
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

bootstrap()