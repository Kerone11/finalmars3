<template>
    <div class="hello">
    </div>
 </template>
  
<script>
  
  import * as msal from "msal"

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

const msalInstance = new msal.UserAgentApplication(msalConfig)
  export default {
    name: 'LogoutWidget',
    data(){
        return{
            
        }
    },
    methods: {
      logout(){
        msalInstance.logout();
      }

    },
    mounted(){
      this.logout()
    }
  }
  </script>
  <style scoped>
  
  </style>
  