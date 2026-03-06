import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import Account from './models/Account'
import Class from './models/Class'
import Stack from './models/Stack'
import Card from './models/Card'
import mongo from './utils/mongo'

const bootstrap = async () => {
  try {
    await mongo.connect()
    console.log('🚀 Starting Seed...')

    // 1. Clean Slate
    await Promise.all([
      Account.deleteMany({}),
      Class.deleteMany({}),
      Stack.deleteMany({}),
      Card.deleteMany({})
    ])

    // 2. Create Students
    const [alice, bob, carol] = await Account.insertMany([
      { username: 'alice_owner', password: 'password123' },
      { username: 'bob_editor', password: 'password123' },
      { username: 'carol_viewer', password: 'password123' },
    ])

    // 3. Create Cards (Categorized)
    const mathCards = await Card.insertMany([
      { front: 'Derivative of sin(x)', back: 'cos(x)' },
      { front: 'Square root of 144', back: '12' },
    ])

    const scienceCards = await Card.insertMany([
      { front: 'Atomic number of Gold', back: '79' },
      { front: 'Powerhouse of the cell', back: 'Mitochondria' },
    ])

    // 4. Create Stacks (Linked to Cards)
    const calculusStack = await Stack.create({
      name: 'Calculus Basics',
      visibility: 'public',
      cards: mathCards.map(c => c._id),
      users: [{ account: alice._id, role: 'owner' }]
    })

    const biologyStack = await Stack.create({
      name: 'Cell Biology',
      visibility: 'private',
      cards: scienceCards.map(c => c._id),
      users: [{ account: bob._id, role: 'owner' }]
    })

    // 5. Create Classes (Testing the 3 Role Types)
    await Class.create([
      {
        name: 'Mathematics 101',
        visibility: 'public',
        stacks: [calculusStack._id],
        users: [
          { account: alice._id, role: 'owner' },  // The Teacher
          { account: bob._id, role: 'editor' },   // The TA
          { account: carol._id, role: 'viewer' }  // The Student
        ]
      },
      {
        name: 'Advanced Science',
        visibility: 'private',
        stacks: [biologyStack._id],
        users: [
          { account: bob._id, role: 'owner' },    // Bob owns this one
          { account: alice._id, role: 'editor' }, 
          { account: carol._id, role: 'viewer' }
        ]
      }
    ])

    console.log('✅ Seed successful: 3 Users, 2 Classes, 2 Stacks, 4 Cards')
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

bootstrap()