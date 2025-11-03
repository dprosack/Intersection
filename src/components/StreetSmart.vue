<template>
    <oiv id="streetSmartLogin">
        <span>Key:</span>
        <input v-model="loginKey"></input>
        <span>Username:</span>
        <input v-model="loginUsername"></input>
        <span>Password:</span>
        <input v-model="loginPassword"></input>
        <div id="streetSmartButtonDiv">
            <button class="main-button" @click="cancelCred()">
                Cancel
            </button>
            <button class="secondary-button" @click="sendToStreetSmart()">
                Complete
            </button>
        </div>
    </oiv>

</template>

<script>
    import {ref} from 'vue'
    import {updateKeys} from '../init-leaflet.js'

    export default{
        name: 'StreetSmart',
        setup(){
            const loginKey = ref("")
            const loginUsername = ref("")
            const loginPassword = ref("")

            function sendToStreetSmart(){
                updateKeys(loginKey.value, loginUsername.value, loginPassword.value)
                document.getElementById("streetSmartLogin").style.display = "none"
                return
            }

            function cancelCred(){
                document.getElementById("streetSmartLogin").style.display = "none"
                return
            }

            return {
                sendToStreetSmart,
                loginKey,
                loginUsername,
                loginPassword,
                cancelCred
            }
        },
    }
</script>

<style scoped>
#streetSmartLogin {
    position: absolute;
    display: flex; 
    flex-direction: column;
    z-index: 9999;
    background-color: white;
    padding: 20px;
    inset: 0px;
    width: 12rem;
    height: fit-content;
    max-width: 100vw;
    max-height: 100dvh;
    margin: auto;
}

#streetSmartButtonDiv{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-top: 10px;
}
</style>