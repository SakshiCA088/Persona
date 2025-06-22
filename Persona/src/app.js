import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"//to access set cookies of user's browser through our server/to perform cred op on their cookies

const app = express()

//to allow cross-origin requests
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true 
}))

//to parse json under 16kb
app.use(express.json({ limit : "16kb" }))

//to parse url-encoded form data, supports nested objects
app.use(express.urlencoded({extended : true, limit : "16kb"}))

//to keep public assets (server's static files)
app.use(express.static("Public"))

//to parse cookies from incoming requests
app.use(cookieParser())
export { app }