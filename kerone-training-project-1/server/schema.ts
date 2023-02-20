import { gql } from "apollo-server";

export const typeDefs = gql`
    type Query{
        checkApiStatus: [Calendar],
        getRooms: [String],
        calendarData: [Calendar],
        userId: String
        getDataFromGraphAPI: [Calendar], 

    }

    type Mutation {
        testMutations(input: [Value!]): Test, 
        setDataToGraphAPI(input: [String!]): [Calendar], 
        deleteEvent(input: String): String, 
        cookies(input: String): String
        addNewRoom(input: String): String
    }
    
    type InputTest{
        event: [String!],
        token: String
    }

    type AuthPayLoad{
        id: String, 
        start: String
        end: String 
        text: String 
    }

    type ApiStatus{
        status: String
    }

    type Test{
        status: String
    }

    type Calendar{
       id: String, 
       start: String
       end: String 
       text: String 
    }

    type Rooms{
        room: String
    }

    input Value{
        id: Int
        start: String
        end: String
    }
`