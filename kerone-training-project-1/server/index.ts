import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import * as redis from "redis";
import * as msal from "@azure/msal-node";
import {typeDefs} from "./schema";
import {resolvers} from "./resolvers"; 
import { logger } from './logger';
import * as dotenv from "dotenv"
import path from "path"

dotenv.config();

const redisClient = redis.createClient();
const server = new ApolloServer({ 
    typeDefs, 
    context: (req: any, res: any)=> ({
        redis,
        redisClient,
        req: req, 
        res: res,
        }),
    resolvers,
    cache: "bounded"});
const app = express();

server.start().then((req)=> {
    server.applyMiddleware({ app });
    })

const redisclient = redis.createClient();

(async () => {
  await redisclient.connect()
   
})();

logger.info("Connecting to the Redis");

redisclient.on("ready", async () => {
await redisClient.connect()
  logger.info("Connected!");
});

redisclient.on("error", (err) => {
  logger.error("Error in the Connection");
});

const config = {
  auth: {
      clientId: process.env.CLIENT_ID as string,
      authority: process.env.AAD_ENDPOINT as string,
      clientSecret: process.env.CLIENT_SECRET as string
  },
  system: {
      loggerOptions: {
          loggerCallback(loglevel: any, message: any, containsPii: any) {
              console.log(message);
          },
          piiLoggingEnabled: false,
          logLevel: msal.LogLevel.Verbose,
      }
  }
};

const REDIRECT_URI: string = process.env.REDIRECT_URI!; 
const cca = new msal.ConfidentialClientApplication(config);

app.get('/login', (req, res) => {

  // Construct a request object for auth code
  const authCodeUrlParameters = {
      scopes: [process.env.SCOPES!],
      redirectUri: REDIRECT_URI,
  };

  // Request auth code, then redirect
  cca.getAuthCodeUrl(authCodeUrlParameters)
      .then((response) => {
        console.log({response})
          res.redirect(response);
      }).catch((error) => {
        logger.error("Error in getting Auth Code URL")
        res.send(error)});
        
  // const sessionID = req.session.id;
  // res.send({sessionID})
});



app.get('/redirect', (req, res) => {

  // Use the auth code in redirect request to construct
  // a token request object
  const tokenRequest = {
      code: req.query.code as string,
      scopes: [process.env.SCOPES!],
      redirectUri: REDIRECT_URI,
  };
  cca.acquireTokenByCode(tokenRequest)
      .then(async (response) => {
          await redisClient.set("Token", response.accessToken)
          // await redisClient.set("LoggedIn", true)
          res.redirect("/")
          // res.send(response);
      }).catch((error) => {
        logger.error("Error in acquiring the Token", error.response)
        res.status(500).send(error)
      });      
})


const _direname = path.dirname("");
const buildPath = path.join(_direname, "../client/dist")
app.use(express.static(buildPath))

app.get("/", (req, res)=> {
  res.sendFile(
    path.join(__dirname, "../client/dist/index.html"),
    (err)=>{
      if(err){
        res.status(500).send(err)
      }
    }

  )
})
app.listen({ port: process.env.PORT}, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
