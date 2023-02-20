import axios from "axios";
import { logger } from "./logger";

let roomName = "";
let userId = "";
let specifiedCalendarId = "";
export const resolvers = {
    Query: {
       /**
        * Function to get the rooms that have been added to the data base. 
        * @param _ 
        * @param __ 
        * @param redisClient from the index, used to access all the redis functions.  
        * @returns the array of rooms
        */
        getRooms: async (_: any, __: any, {redisClient,___, req }: any) => {           
            let rooms = await redisClient.lRange("rooms", 0, -1).catch((err: any)=> {
                logger.error("Error in retrieving the rooms from Redis")
                console.error(err)
            })
            return rooms
        }, 
        /**
         * Function that gets all the events that are written in the database, by getting the list of keys from the keys sorted list 
         * in the database. Then it maps all the keys to retrieve the hasmaps (objects) of events. It then pushes these events to an 
         * array.
         * @param _ 
         * @param __ 
         * @param redisClient from the index, used to access all the redis functions.
         * @returns the array of events for a specified room
         */
        calendarData: async (_: any,__: any, {redisClient, req}: any)=>{

            const sessionId = req.req.headers.sessionid;
            const roomNameFromRedis = await redisClient.hGet(sessionId, "roomName")
            let listOfKeys = await redisClient.sMembers("keeey:"+roomNameFromRedis).catch((err: any)=>{
                logger.error("Error in getting the list of keys from Redis");
                console.error(err);
            })
          
            let data:any =[]; 
            listOfKeys.map(async (key: any)=>{
                let value = redisClient.hGetAll(key).catch((err: any)=> {
                    logger.error("Error when getting the hashmap of each event from Redis");
                    console.error(err);
                })
                try {
                    data.push(value)
                } catch (error) {
                    logger.error("Error in pushing the event hashmap/object to array variable to send to frontend")
                    console.error("The error from the try/catch block: ", error)
                }

            })
            return (data)
        }, 
        /**
         * Gets the user ID from the graph API end point for the user id to use in the delegated permissions of the graph API's 
         * @param _ 
         * @param token is the access token retrieved from the frontend.  
         * @param redisClient from the index, used to access all the redis functions. 
         * @returns 
         */
        userId: async(_: any,__: any, context: any)=>{

            const sessionId = context.req.req.headers.sessionid;
            let tokenFromRedis = await context.redisClient.get("Token").catch((err: any)=>{
                logger.error("Error in retrieving the token from Redis");
                console.error(err)
            })
            console.log({tokenFromRedis})
            let options ={
                headers:{
                    Authorization: `Bearer ${tokenFromRedis}`
                }
            }
            await axios.get(`${process.env.GRAPH_API_ENDPOINT}/me`, options).then(async (res)=>{
            await context.redisClient.hSet(sessionId, "userId", res.data.id )

                userId = res.data.id
            }).catch((err) => {
                logger.error("Error in retrieving the id of the logged in user");
                console.error(err.response);
            })
        },

        async getDataFromGraphAPI(_: any,__: any, {redisClient, req}: any){ 
            try {

                const sessionId = req.req.headers.sessionid;
                const dataForURLVars = await redisClient.hGetAll(sessionId)
                let tokenFromRedis = await redisClient.get("Token").catch((err: any)=>{
                    logger.error("Error in retrieving the token from Redis");
                    console.error(err)
                }) 
                const options = {
                    headers:{
                        Authorization: `Bearer ${tokenFromRedis}`, 
                        Prefer: "outlook.timezone=\"Africa/Johannesburg\""
                    }
                }; 
                
                //so the user ID needs to be the room ID, so I will impersonate the room ID. 
                let events: any = [];
            
                await axios.get(`${process.env.GRAPH_API_ENDPOINT}/users/${dataForURLVars.userId}/calendars/${dataForURLVars.calendarId}/events`, options).then(async (res)=> {
                    
                let values = res.data.value;
                                
                values.map(async (event: any, index: any) =>{
                   
                    let startTime = new Date(event.start.dateTime);
                    let startTimeStamp = startTime.getTime(); 
                    let roundedStartTimeStamp = Math.floor(startTimeStamp/2)*2 
                    let roundedStartTime = new Date(roundedStartTimeStamp)
                    let internationalUTCStartTime = roundedStartTime;
                   
                    let southAfricanTimeZoneOffsetStartTime = internationalUTCStartTime.getTimezoneOffset();
                    
                    internationalUTCStartTime = new Date(internationalUTCStartTime.getTime() - southAfricanTimeZoneOffsetStartTime*60*1000)
                  
                    let strStart = JSON.stringify(internationalUTCStartTime)
                    let newStrStart = strStart.substring(0, strStart.length-6);
                    let startTimeFinal = newStrStart.substring(1)

                    let endTime = new Date(event.end.dateTime)
                    let endTimeStamp = endTime.getTime(); 
                    let roundedEndTimeStamp = Math.floor(endTimeStamp/2)*2 
                    let roundedEndTime = new Date(roundedEndTimeStamp)
                    let internationalUTCEndTime = roundedEndTime;
                    let southAfricanTimeZoneOffsetEndTime = internationalUTCEndTime.getTimezoneOffset();
                   
                    internationalUTCEndTime = new Date(internationalUTCEndTime.getTime() - southAfricanTimeZoneOffsetEndTime*60*1000)
                    let str = JSON.stringify(internationalUTCEndTime)
                    let newStr = str.substring(0, str.length-6);
                    let endTimeFinal = newStr.substring(1)
                   
                    await redisClient.hSet("event:"+dataForURLVars.roomName+":"+event.transactionId, "id", event.transactionId)
                        .catch((err: any) => {
                            logger.error("Error in setting the event's ID retrieved from Graph API tp Redis")
                            console.error(err)   
                        });
                    await redisClient.hSet("event:"+dataForURLVars.roomName+":"+event.transactionId, "start", String(event.start.dateTime) )
                        .catch((err: any) => {
                            logger.error("Error in setting the event's start time retrieved from Graph API tp Redis")
                            console.error(err)
                        })
                    await redisClient.hSet("event:"+dataForURLVars.roomName+":"+event.transactionId, "end", String(event.end.dateTime) )
                        .catch((err: any) => {
                            logger.error("Error in setting the event's end time retrieved from Graph API tp Redis")
                            console.error(err)
                        })
                    await redisClient.hSet("event:"+dataForURLVars.roomName+":"+event.transactionId, "text", event.organizer.emailAddress.name+" "+new Date(event.start.dateTime).toLocaleString()+" "+new Date(event.end.dateTime).toLocaleString())
                        .catch((err: any) => {
                            logger.error("Error in setting the event's event organizers name retrieved from Graph API tp Redis")
                            console.error(err)
                        })
                  
                    await redisClient.sAdd("keeey:"+dataForURLVars.roomName, "event:"+dataForURLVars.roomName+":"+event.transactionId
                        ).catch((err: any)=> {
                            logger.error("Error in adding the event's ID to the Redis list of keys")
                            console.error(err)
                        })
                   
                   
                    let inputEvent ={
                        id: event.transactionId, 
                        start: event.start.dateTime, 
                        end: event.end.dateTime, 
                        text: event.organizer.emailAddress.name
                    }; 
                    events.push(inputEvent)
                     
                })
                
            
            }).catch((err)=> {
                logger.error("Error in getting event data from the Graph API and setting it to Redis")
                console.error(err)
            })

            return events
            } catch (error) {
                logger.error("Error in getting event data from the Graph API.")    
                console.error("There is something wrong with the graphQL input: ", error)
            }
        },
    }, 
    Mutation:{
        /**
         * This mutation, takes in an input, that has a string value of a new event. This is then handeled and maniplated to
         * suit the Graph API format to wite events to a calendar. Additionally, writes the new event data to Redis 
         * @param _ 
         * @param req variable that has all the Apollo server functions added when the server instance is initialised. 
         *        the session Id is passed through the request. 
         * @param redisClient from the index, used to access all the redis functions. 
         * @param input variable that has the new added event data in a long string. 
         * @returns a void function 
         */
        
        setDataToGraphAPI: async (_: any, input: any, {redisClient, req}: any)=>{

            try {
                const sessionId = req.req.headers.sessionid; 
                const dataForURLVars = await redisClient.hGetAll(sessionId);
                console.log("Room name: ", dataForURLVars.roomName, " userId: ", dataForURLVars.userId, " calendarId: ", dataForURLVars.calendarId)
            let tokenFromRedis = await redisClient.get("Token").catch((err: any)=>{
                logger.error("Error in retrieving the token from Redis");
                console.error(err)
            })
            let inputArray = input.input[0].split(",");
            await redisClient.hSet("event:"+dataForURLVars.roomName+":"+String(inputArray[0]), "id", String(inputArray[0]))
                .catch((err: any) => {
                    logger.error("Error in setting the id in the added events hashmap/object ");
                    console.error(err)
                });
            await redisClient.hSet("event:"+dataForURLVars.roomName+":"+String(inputArray[0]), "start", String(inputArray[1]))
                .catch((err: any) => {
                    logger.error("Error in setting the start time in the added events hashmap/object ");
                    console.error(err)
                });
            await redisClient.hSet("event:"+dataForURLVars.roomName+":"+String(inputArray[0]), "end", String(inputArray[2]))
                .catch((err: any) => {
                    logger.error("Error in setting the end time in the added events hashmap/object ");
                    console.error(err)
                });
            await redisClient.hSet("event:"+dataForURLVars.roomName+":"+String(inputArray[0]), "text", String(inputArray[3]))
                .catch((err: any) => {
                    logger.error("Error in setting the name of the person adding the event in the added events hashmap/object ");
                    console.error(err)
                });

            await redisClient.sAdd("keeey:"+dataForURLVars.roomName, "event:"+dataForURLVars.roomName+":"+String(inputArray[0])
                ).catch((err: any)=> {
                    logger.error("Error in adding the event's ID in the keys list.");
                    console.error(err)
                })
            axios({
                method: 'post', 
                url: `${process.env.GRAPH_API_ENDPOINT}/users/${dataForURLVars.userId}/calendars/${dataForURLVars.calendarId}/events`, 
                headers:{
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${tokenFromRedis}`
                }, 
                data: {
                    subject: inputArray[3], 
                    start:{
                        dateTime: inputArray[1],
                        timeZone: "Africa/Johannesburg"
                    },
                    end: {
                        dateTime: inputArray[2],
                        timeZone: "Africa/Johannesburg"
                    }, 
                    transactionId: inputArray[0]
                }
            }).catch((err)=>{
                logger.error("Error in posting the added events details to the Graph API.");
                console.error(err)
            })
            } catch (error) {
                logger.error("Error in trying to set added data to the Graph API")
                console.error(error)
            }
            
        },  
        /**
         * This function gets the room name, it then retrieves all the events that have occured or will occur in the selcted 
         * room and writes it to Redis.
         * @param input variable holds the cookie name of the room, that comes from the frontend. 
         * @param req variable that has all the Apollo server functions added when the server instance is initialised. 
         *        the session Id is passed through the request. 
         * @param redisClient from the index, used to access all the redis functions. 
         */
        async cookies(_: any,input: any, {redisClient, req}: any){
            const sessionId = req.req.headers.sessionid;
            console.log("sessionId from Cookies mutation: ", sessionId) 
            let tokenFromRedis = await redisClient.get("Token").catch((err: any)=>{
                logger.error("Error in retrieving the token from Redis");
                console.error(err)
            })
            console.log("input: ", input)
            let cookie = input.input.split(";"); 
            let c = []; 
           
            let roomNameForRedis: string;
            for(let i = 0; i < cookie.length; i++){
                c = cookie[i].split("=")
                if(c[0]=== "Room Name")
                {
                    roomNameForRedis = c[1];
                    await redisClient.hSet(sessionId, "roomName", roomNameForRedis)
                    roomName = c[1]
                }
            }
           
            const options = {
                headers:{
                    Authorization: `Bearer ${tokenFromRedis}`, 
                },
            }

           
            let allCalendars = []
            await axios.get(`${process.env.GRAPH_API_ENDPOINT}/me/calendars`,options).then(async (res)=>{ 

            allCalendars = res.data.value
        
            let specifiedCalendar: any = allCalendars.find((room: any) => room.name === roomName)
            
            specifiedCalendarId = specifiedCalendar.id;
            await redisClient.hSet(sessionId, "calendarId",specifiedCalendar.id)
            await axios.get(`${process.env.GRAPH_API_ENDPOINT}/users/${userId}/calendars/${specifiedCalendar.id}/events`,options).then((res)=>{
          
                let values = res.data.value; 

                values.map(async (event: any, index: any) =>{
                    let startTime = new Date(event.start.dateTime)
                    let startTimeStamp = startTime.getTime(); 
                    let roundedStartTimeStamp = Math.floor(startTimeStamp/2)*2 
                    let roundedStartTime = new Date(roundedStartTimeStamp)

                    let endTime = new Date(event.end.dateTime)
                    let endTimeStamp = endTime.getTime(); 
                    let roundedEndTimeStamp = Math.floor(endTimeStamp/2)*2 
                    let roundedEndTime = new Date(roundedEndTimeStamp)
                    await redisClient.hSet("event:"+roomName+":"+event.transactionId, "id", event.transactionId)
                            .catch((err: any) => {
                                logger.error("Error in setting the retrieved ID from Graph API to Redis, upon initial load.")
                                console.error(err)
                            });
                    await redisClient.hSet("event:"+roomName+":"+event.transactionId, "start", roundedStartTime.toISOString() )
                            .catch((err: any) => {
                                logger.error("Error in setting the retrieved start time from Graph API to Redis, upon initial load.")
                                console.error(err)
                            })
                    await redisClient.hSet("event:"+roomName+":"+event.transactionId, "end", roundedEndTime.toISOString() )
                            .catch((err: any) => {
                                logger.error("Error in setting the retrieved end time from Graph API to Redis, upon initial load.")
                                console.error(err)
                            })
                    await redisClient.hSet("event:"+roomName+":"+event.transactionId, "text", event.organizer.emailAddress.name+" "+new Date(roundedStartTime.getTime())+" "+new Date(roundedEndTime.getTime() ))
                            .catch((err: any) => {
                                logger.error("Error in setting the retrieved the event organisers name from Graph API to Redis, upon initial load.")
                                console.error(err)
                            })

                    await redisClient.sAdd("keeey:"+roomName, "event:"+roomName+":"+event.transactionId
                            ).catch((err: any)=> {
                                logger.error("Error in adding the event's ID to the list of keys, upon initial load.")
                                console.error(err)
                            })
                })
            })


        }).catch((err)=>{
            logger.error("Error in retrieving the specific calendar ID")
            console.error(err)
            })
        },
        /**
         * 
         * @param _ 
         * @param input 
         * @param param2 
         */
        async deleteEvent(_: any,input: any, {redisClient, req}: any){

            const sessionId = req.req.headers.sessionid;
            const dataForURLVars = await redisClient.hGetAll(sessionId)

            console.log("data Vars from delete: ", dataForURLVars)
            console.log("this is the delete input: ", input)
            
            await redisClient.del("event:"+dataForURLVars.roomName+":"+input.input).catch((err: any)=>{
                logger.error("Error in deleting the event's hashmap from Redis")
                console.error(err)
            }); 
            await redisClient.sRem("keeey:"+dataForURLVars.roomName, "event:"+dataForURLVars.roomName+":"+input.input).catch((err: any)=>{
                logger.error("Error in deleting the event's key from the list of keys in Redis")
                console.error(err)
            })
            let tokenFromRedis = await redisClient.get("Token").catch((err: any)=>{
                logger.error("Error in retrieving the token from Redis");
                console.error(err)
            })
            const options = {
                headers:{
                    Authorization: `Bearer ${tokenFromRedis}`
                }
            }; 
            
            await axios.get(`${process.env.GRAPH_API_ENDPOINT}/users/${dataForURLVars.userId}/calendars/${dataForURLVars.calendarId}/events`, options).then(async (res)=>{

               let events = res.data.value; 

              let eventDelete= events.find((event: { transactionId: any; }) => event.transactionId === input.input)

                await axios.delete(`${process.env.GRAPH_API_ENDPOINT}/users/${dataForURLVars.userId}/calendars/${dataForURLVars.calendarId}/events/${eventDelete.id}`, options).catch(err=>{
                    logger.error("Error in deleting the specified event from Graph API")
                    console.error("There is an error in deleting the event: ", err)
                })
            }).catch((err)=>{
                logger.error("Error in retrieving all the events from Graph API to locate the correct transaction ID in order to delete the specified event")
                console.error(err)
            })
        },

        async addNewRoom(_:any, input: any, {redisClient, req}: any){
            let newRoom = input.input;
            const sessionId = req.req.headers.sessionid;
            await redisClient.lPush("rooms", String(newRoom)).catch((err: any)=>{console.error("Here is an error: ", err)})

            const userIdFromRedis = await redisClient.hGet(sessionId, "userId")
            let tokenFromRedis = await redisClient.get("Token").catch((err: any)=>{
                logger.error("Error in retrieving the token from Redis");
                console.error(err)
            })
            const options = {
                headers:{
                    Authorization: `Bearer ${tokenFromRedis}`
                }
            }; 

            axios({
                method: 'post', 
                url: `${process.env.GRAPH_API_ENDPOINT}/users/${userIdFromRedis}/calendars`, 
                headers:{
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${tokenFromRedis}`
                }, 
                data: {
                    name: newRoom
                }
            }).catch((err)=>{
                // logger.error("Error in posting the added events details to the Graph API.");
                console.error("The error in creating a new Calendar", err.response)
            })
            return input.input
        },

        // async createSession(_:any, sessionId: string, {redisClient}: any){

        // }
    }
}
