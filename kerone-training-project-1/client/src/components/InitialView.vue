<template>
  <!-- {{ router }} -->
  <!-- <LoginWidget/> -->
 <div class="container-fluid main"> 
  <div class="justify-content-center"> 
    <h2 class="text-center welcome">Welcome to M.A.R.S 3.0</h2>
    <h5 class="text-center welcome">Please select a room: </h5>
    <div class="text-cente buttons-list" style="overflow-y:scroll; max-height: 60vh;">
      <li v-for="item in people" :key="item">
      <button class="btn btn-secondary btn-lg mt-2 w-100 button" v-on:click=message(item)  >{{ item }}</button>    
    </li>
  </div>
    <AddNewRoom v-show="showModal" @close-modal="showModal = false"/>
    <div>
        <button @click="showModal = true" class="btn btn-default w-100 mt-3 mb-3 new-room">Add New Room</button>
    </div>
    
  </div>
  </div>
</template>

<script>
import axios from "axios"
import gql from "graphql-tag";
import { print } from "graphql";
import AddNewRoom from "./AddNewRoom.vue";
// import LoginWidget from "./LoginWidget.vue";
export default {
  name: 'InitialView',
  components:{
    AddNewRoom
},
  data() {
    return {
      people: "", 
      showModal: false,
    }
  },
  methods: {
    async login() {
      await axios({
        method: "POST", 
        url: `https://mars3.link/graphql`, 
        headers:{
          sessionId: sessionStorage.getItem("sessionId")
        },
        data:{
          query: `{
            getRooms
          }`
        }
      }).then((res)=> {
  
      this.people = res.data.data.getRooms

      }).catch ((error) => {
      console.error("Cannot get rooms: ",error)
    });
    },
    async message(selected){
  
      document.cookie = `Room Name = ${selected}; SameSite=Lax`
    
    const client = axios.create({
      headers:{
        'sessionId': sessionStorage.getItem("sessionId")
      }
    });

    client.post(`https://mars3.link/graphql`, {
      query: print(gql`
      mutation {
        cookies(input: "${document.cookie}", )
      }
      `)
    })
      this.$router.push('/calendar')
    },

    async userId(){
    const client = axios.create({ 
      headers:{
        'sessionId': sessionStorage.getItem("sessionId")
      }
    });
      client.post(`https://mars3.link/graphql`, {query: `
      query{
        userId
      }`})
        }

  }, 
  async mounted(){
       this.login(); 
       this.userId();    
  },
  
 
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.new-room{
  font-family:'Courier New';
}
.button{
  background-color: #2f302f;
  font-family:'Courier New';
}
.main{
  background-color: #636663;
  }
.buttons-list{
  list-style: none;
  /* border: 10px #2f302f; */
}
.welcome{
  color: white;
  font-family: 'Courier New'; 
}
</style>
