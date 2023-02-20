<template>
    <div class="hello">
    </div>
 </template>
  
<script>
  import * as msal from "msal"
import axios from "axios";

const msalConfig = {
    auth:{
        clientId: "42eb9515-07df-4168-a15b-476791bf329b", 
        authority: "https://login.microsoftonline.com/common",
        tenantId: "18c47243-3e29-4895-8f0e-279df96b6315",
        redirectUri: "http://localhost:8080", 
        }, 
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false, 
    }, 
};
                
    const msalApp = new msal.UserAgentApplication(msalConfig); 
    


  export default {
    name: 'LoginWidget',
    data(){
        return{
            code: ""
        }
    },
    methods: {
        login() {
            //"https://graph.microsoft.com/Calendars.ReadWrite",
            try {
                msalApp.acquireTokenSilent({scopes: [ "https://graph.microsoft.com/.default" ]}).then(async (tokenResponse)=>{
                    const accessToken = tokenResponse.accessToken; 
                    localStorage.setItem("Token", accessToken)
                    this.code = accessToken;
                    const client = axios.create({
                        headers:{
                            'Authorization': `Bearer ${localStorage.getItem("Token")}`
                        }
                    }); 

                    const query = `mutation{
                        getDataFromGraphAPI {
                            id
                            start
                            end
                            text
                        }
                    }`; 
                    const variables = {input: accessToken}
                    client.post(`https://mars3.link/graphql`, { query, variables}).catch(err=> console.error("Here is something: ", err))
                                  
                }).catch((error)=>{
                        console.error("THe error comes from the acquire Token Silent: ", error)
                        msalApp.loginPopup({scopes: ["https://graph.microsoft.com/.default" ]}).then((loginResponse)=> {
                            msalApp.acquireTokenPopup({scopes: ["https://graph.microsoft.com/.default" ]}).then((response)=>{
                               
                                const accessToken = response.accessToken; 
                                localStorage.setItem("Token", accessToken)
                                this.code = accessToken;
                                const client = axios.create({
                                    headers:{
                                        'Authorization': `Bearer ${localStorage.getItem("Token")}`
                                    }
                                }); 

                                const query = `mutation{
                                    getDataFromGraphAPI {
                                        id
                                        start
                                        end
                                        text
                                    }
                                }`; 
                                const variables = {input: accessToken}
                                client.post(`https://mars3.link/graphql`, { query, variables}).catch(err=> console.error("Here is something: ", err))
                            })
                            const accessToken = loginResponse.accessToken; 
                            this.code = accessToken 
                        }).catch(err=> console.error("The error is coming from the login popup: ", err))
                });
                
            } catch (error) {
               console.error("Is the login working: ", error) 
            }
        },
        async userId(){
            await axios({
        method: "POST", 
        url: `https://mars3.link/graphql`, 
        data:{
          query: `{
            userId
          }`
        }
      }).catch(err=>console.error("Here is the error: ", err.response))
        }

    },
    mounted(){
      this.login()
      this.userId()
    }
  }
  </script>
  <style scoped>
  
  </style>
  