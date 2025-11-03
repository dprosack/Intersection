<template>
	<div>
		<StreetSmart/>
		<Map/>
	</div>
</template>

<script>
	import Map from './components/Map.vue'	
	import StreetSmart from './components/StreetSmart.vue';
	
	export default{
		name: "App",
		components: {StreetSmart, Map}
	}
	
</script>




<style> 
@import './style.css';

#app{
	height: 100%;
	width: 100%;
	overflow-y: hidden;
	overflow-x: hidden;
}


</style>

