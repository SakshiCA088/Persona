import mongoose, {Aggregate, Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
    {
        name : {
            type : String,
            required : true
        },
        description : {
            type : String
        },
        video : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video",
                required : true
            }
        ],
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
    { 
        timestamps : true 
    }
)

playlistSchema.plugin(mongooseAggregatePaginate)

export const Playlist = mongoose.model("Playlist", playlistSchema);