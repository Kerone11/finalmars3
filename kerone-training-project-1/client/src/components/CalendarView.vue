<template>
  <div class="container-fluid container-main">
    <div class="topnav"> 
      <a class="float-left col-12 col-md-4 a-main"> 
        <img src="./../assets/mwrLogo.jpeg" class="logo"/> 
      </a>
      <a class="active float-right col-12 col-md-8 display-flex"> 
        M.A.R.S 3.0
      </a>
  </div>
    <div class="mainView" style="overflow-y: scroll; max-height: 40vh;"> 
      <div v-for="(event, ind) in this.finalEvents" :key="event.id" style="border: 1px solid black" 
        :class="{current: currentMeeting === ind }"><br>
        <span>
        {{ event.text }} 
        </span>
      </div>
      
    </div>
    <div class="status" :style="backgroundColor" >
      {{ status }}
      {{ new Date().toLocaleString() }}
    </div>
    <div v-show="!this.show15Mins">
      <AddEvent v-show="showModal" @close-modal="showModal = false"/>
    </div>
    <div v-show="this.show15Mins">
      <AddEventLess15MinsModal v-show="showModal" @close-modal="showModal = false" :time-of-next-meeting="this.currentMeetingOrNext"/>
    </div>
      <div>
        <button v-show="!cancel" @click="showModal = true" class="btn btn-default w-100 mt-3 mb-3 button-view">Quick Book</button>
        <button v-show="cancel" @click="deleteEvent++" class="btn btn-default w-100 mt-3 mb-3 button-view">Cancel</button>
      </div>
  </div>
</template>

<script>
import axios from "axios"
import { toRaw } from 'vue'
import gql from "graphql-tag";
import {print} from "graphql"
import AddEvent from "./AddEventModal.vue"
import AddEventLess15MinsModal from "./AddEventLess15MinsModal.vue";

  export default {
    components: {
      AddEvent, 
      AddEventLess15MinsModal
    },
    data() {
      return{
        colour: "orange",
        showModal: false,
        show15Mins: "",
        currentMeetingOrNext: "",
      color: "Green",
      events: [], 
      data: [], 
      start: "", 
      end: "", 
      id: "", 
      text: "",
      deleteEvent: "",
      deleteId: "", 
      status: "", 
      finalEvents: "",
      currentMeeting: "", 
      cancel:""
      }
      
  },
  props: {
  
  },
  computed: {
    backgroundColor(){
      return{
        backgroundColor: toRaw(this.status)
      }
    },
  },
  methods: {
    async getData() {
      await axios({
        method: "POST", 
        url: `https://mars3.link/graphql`, 
        headers:{
          sessionId: sessionStorage.getItem("sessionId")
        },
        data:{
          query: `{
            getDataFromGraphAPI{
              id, 
              start, 
              end,
              text
            }
          }`
        }
      })
      await axios({
        method: "POST", 
        url: `https://mars3.link/graphql`, 
        headers:{
          sessionId: sessionStorage.getItem("sessionId")
        },
        data:{
          query: `{
            calendarData{
              id, 
              start, 
              end,
              text
            }
          }`
        }
      }).then(async (res)=> {
      
      let eventsLoop = res.data.data.calendarData; 
      

      let eventsForToday= [] 
      
      eventsLoop.map((event)=>{
        if(new Date(event.start).getDate() == new Date().getDate()){
          eventsForToday.push(event)
        }
      })
      
      eventsForToday.sort((a,b)=>{
        return new Date(b.start).getTime() - new Date(a.start).getTime();
      })
      this.events = eventsForToday
      let timeNow = new Date().getTime()

      let currentMeeting2 = eventsForToday.findIndex((event)=> {
        if(timeNow >= new Date(event.start).getTime() && timeNow < new Date(event.end).getTime()){
          return event
        }
      })
     
      const currentDate = new Date();
      let currentOrNextMeeting = () =>{
        let nextMeeting = null;
        for(const event of eventsForToday){
        if(currentDate >= new Date(event.start) && currentDate <= new Date(event.end)){
          return event
        }else if(currentDate < new Date(event.start)){
          if(!nextMeeting|| new Date(nextMeeting.start) > new Date(event.start)){
            nextMeeting = event
          }
        }
      }
      return nextMeeting
      } 
      this.deleteId = currentMeeting2 != -1 ? eventsForToday[currentMeeting2].id : ""
      let currentMeeting = currentOrNextMeeting()
      this.currentMeeting = currentMeeting2 
      this.currentMeetingOrNext = currentOrNextMeeting(); 
      this.cancel = currentMeeting2 != -1 ? true : false; 
      let startTime = new Date(currentMeeting?.start).getTime(); 
      let endTime = new Date(currentMeeting?.end).getTime()
      if(timeNow >= startTime - 900000 && timeNow < startTime){
        this.status = "Orange"
        this.show15Mins = true;
      }
      else if( timeNow >= startTime && timeNow < endTime ){
        this.status = "Red"
      }
      else{
        this.status = "Green"
        this.show15Mins = false;
      }

      }).catch ((error) => {
      console.error(error)
    }) 
    let events = toRaw(this.events)
    this.finalEvents = events;
  
    }, 
  
    // async lessThanFifteenMins(){
    //   if(toRaw(this.status) === "Orange") {
    //     let nextMeeting = toRaw(this.currentMeeting); 

    //   }
    // }, 
    async setDataToGraphAPI() {
    const client = axios.create({
      headers:{
        'sessionId': sessionStorage.getItem("sessionId")
      }
    });

    client.post(`https://mars3.link/graphql`, {
      query: print(gql`
      mutation {
        setDataToGraphAPI(input: "${[String(toRaw(this.id)), toRaw(this.start), toRaw(this.end), toRaw(this.text)]}"){
              id,
              start,
              end,
              text
              }
      }
      `)
    })

  }, 

  async deleteEvents() {
    this.status = "Green"
    const client = axios.create({
      headers:{
        'sessionId': sessionStorage.getItem("sessionId")
      }
    });

    client.post(`https://mars3.link/graphql`, {
      query: print(gql`
      mutation {
        deleteEvent(input: "${toRaw(this.deleteId)}")
      }
      `)
    })
  }, 

   },
   watch: {
      start:{
        handler(){
          this.setDataToGraphAPI()
          // this.getData()
        }
      },

      deleteEvent:{
        handler(){
          this.deleteEvents()
          // this.getData()
        }
      }
   }, 
  mounted() {
    this.getData()
    setInterval(()=>{
      this.getData()
    }, 15000)
  }
  }
</script>

<style scoped>
.current{
background-color: #f00606 ;
}
.topnav{
  background-color: #333;
  overflow: hidden;
  margin-bottom: 20px;
}
.topnav a {
  float: left;
  color: #f2f2f2;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
  font-size: 17px;
}

.topnav a.active {
  background-color: #636663;
  color: white;
  font-size: x-large;
  float: right;
  width: auto;
  font-family: 'Courier New';
  margin-top: 3.5%;
  margin-right: 20px;
}
.logo{
  height: 100px;
  display: flex;
}

.a-main{
  width: auto;
}
.container-main{
  background-color: #636663;
  height: 100%;
  width: 100%;
  }
 .status{
  width: 39%;
  height: 20vh;
  border: 10px solid black;
  color: #f2f2f2;
  float: right;
  font-family: 'Courier New';
  font-size: large;
} 
.mainView{
  border: 10px solid black;
  width: 60%;
  color: #f2f2f2;
  float: left;
  background-color: #636663;
  font-family: 'Courier New';
}; 

.button-view{
  font-family: 'Courier New';
}



</style>