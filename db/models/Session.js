
import mongoose, {Schema} from "mongoose";

const sessionSchema = new Schema({
    userId: {type:mongoose.Schema.Types.ObjectId, ref:'Users'},
    token:String,
},{timestamps:true});

const Session = mongoose.model('Session', sessionSchema);
export {Session};