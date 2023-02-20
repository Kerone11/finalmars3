<template>
  <div class="background-main"> 
    <!-- <LoginWidget/> -->
   <router-view />
  </div>
</template>
  
<script>
// import LoginWidget from "./components/LoginWidget.vue";
// import LoginWidget from "./LoginWidget.vue";

export default {
  name: 'app', 
  components: {
    // LoginWidget,
    // LoginWidget
}, 
// created:{
//   logout(){
//    if(!localStorage.getItem("Token")){
//     this.$router.push('/logout')
//    }
//   }
  
// }
}
</script>

<style scoped>
.background-main{
  background: #636663;
  /* height: auto; */
}
</style>
