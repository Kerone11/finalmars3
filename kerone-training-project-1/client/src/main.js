import  { createApp, h, provide} from 'vue'
import App from './App.vue'
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'
import { DefaultApolloClient, provideApolloClient } from '@vue/apollo-composable'
import { createWebHistory } from "vue-router";
import CalendarView from "./components/CalendarView.vue";
import InitialView from "./components/InitialView.vue";
import LogoutWidget from "./components/LogoutWidget"
import VueCookies from "vue-cookies";
import { createRouter } from 'vue-router';
import {v4 as uuidv4} from 'uuid'

 const routes = [
  {path: "/", component: InitialView},

  {path: "/calendar", component: CalendarView},

  {path: "/logout", component: LogoutWidget}
]
const router = createRouter({
  history: createWebHistory(), 
  routes,
})
// dotenv.config();
const sessionId = uuidv4();

sessionStorage.setItem("sessionId", sessionId)
// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  headers:{
    sessionId: sessionStorage.getItem("sessionId")
  },
  uri: process.env.VUE_APP_API_BACKEND,
})


// Cache implementation
const cache = new InMemoryCache()

// Create the apollo client
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
})



provideApolloClient(apolloClient)
const app = createApp({
    setup(){
        provide(DefaultApolloClient, apolloClient)
    }, 

    render: ()=> h(App),
})

app.use(VueCookies); 
app.use(router); 
// useCssModule(BootstrapVue);
// useCssModule(IconsPlugin)
app.component("calender-view", CalendarView)

app.config.globalProperties.$cookies.config('1d')

app.mount('#app')
// createApp(App).use(vuetify).mount('#app')