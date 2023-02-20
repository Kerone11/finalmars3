<template>
    <div class="modal-overlay">
      <div class="modal-display">
        <!-- <img class="check" src="~/assets/check-icon.png" alt="" /> -->
    <form @submit.prevent="submitForm" v-if="!formSubmitted">
      <span>Room Name</span><br>
      <input 
        v-model="text"
        type="text"
        placeholder="Enter room name" 
        required
      /><br>
      <span>Email</span><br>
      <input 
        v-model="email"
        type="email"
        placeholder="Enter your email" 
        required
      /><br>
      <input 
        class="submit" 
        type="submit" 
        value="Submit"
      >
    </form>      
      </div>
      <div class="close" @click="$emit('close-modal')">
        <img class="close-img" src="../assets/close.png" alt="" />
      </div>
    </div>
  </template>
  
  
  <script>
    import axios from "axios"
    import { toRaw } from 'vue'
    import gql from "graphql-tag";
    import {print} from "graphql"

    export default {
      data(){
        return{
          text:"",
          email: "",
          formSubmitted: false
        }
      },
      
      methods:{
        submitForm: async function () {
        this.formSubmitted = true
        // await axios.post(`https://mars3.link/graphql`, {
        //     query: print(gql`
        //     mutation {
        //         addNewRoom(input: "${toRaw(this.text)}")
        //     }
        //     `)
        //   })
        const client = axios.create({
            headers:{
                sessionId: sessionStorage.getItem("sessionId")
            }
        });

        client.post(`https://mars3.link/graphql`, {
            query: print(gql`
            mutation {
                addNewRoom(input: "${toRaw(this.text)}")
            }
            `)
        })
      }
        
  }, 
      
      
  }
  

  </script>


<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  background-color: #000000da;
}

.modal-display {
  text-align: center;
  background-color: white;
  height: 300px;
  width: 300px;
  margin-top: 10%;
  /* padding: 60px 0; */
  border-radius: 20px;
}
.close {
  margin: 10% 0 0 16px;
  cursor: pointer;
}

.close-img {
  width: 25px;
}

.check {
  width: 150px;
}

h6 {
  font-weight: 500;
  font-size: 28px;
  margin: 20px 0;
}

p {
  font-size: 16px;
  margin: 20px 0;
}

button {
  background-color: #ac003e;
  width: 150px;
  height: 40px;
  color: white;
  font-size: 14px;
  border-radius: 16px;
  margin-top: 50px;
}

form {
    padding: 10px;
    border: 2px solid black;
    border-radius: 5px;
  }

  input {
    padding: 4px 8px;
    margin: 4px;
  }

  span {
    font-size: 18px;
    margin: 4px;
    font-weight: 500;
  }

  .submit {
    font-size: 15px;
    color: #fff;
    background: #222;
    padding: 6px 12px;
    border: none;
    margin-top: 8px;
    cursor: pointer;
    border-radius: 5px;
  }
</style>
  