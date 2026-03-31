import mongoose from 'mongoose';
const { Schema } = mongoose;

const ClassSchema = new Schema({
    users: [{
        account: { type: Schema.Types.ObjectId },
        role: { type: String }
    }]
});
const Class = mongoose.model('Class', ClassSchema);

async function run() {
    await mongoose.connect('mongodb://localhost:27017/stackd_test_db');
    
    // Create class
    const account1 = new mongoose.Types.ObjectId();
    const account2 = new mongoose.Types.ObjectId();
    
    const cls = await Class.create({
        users: [
            { account: account1, role: 'owner' },
            { account: account2, role: 'viewer' }
        ]
    });
    
    console.log("Before transfer:", cls.users);
    
    // Transfer ownership
    await Class.findByIdAndUpdate(
        cls._id,
        {
            $set: {
                'users.$[elem].role': 'owner'
            }
        },
        {
            arrayFilters: [{ 'elem.account': account2 }]
        }
    );
    
    // Remove old owner
    await Class.findByIdAndUpdate(
        cls._id,
        {
            $pull: {
                users: { account: account1 }
            }
        }
    );
    
    const finalCls = await Class.findById(cls._id);
    console.log("After transfer and remove:", finalCls.users);
    
    await mongoose.disconnect();
}
run();
