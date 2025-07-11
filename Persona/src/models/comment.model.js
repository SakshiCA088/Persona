import mongoose, {Aggregate, Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content : {
            type : String,
            required : true
        },
        video : {
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {
        timestamps : true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)// gives us control over kha se kha tk cooment show krne h in one page

export const Comment = mongoose.model("Comment", commentSchema)