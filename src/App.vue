<template>
	<div>
		<Map/>
	</div>
</template>

<script>
	import Map from './components/Map.vue'	
	
	export default{
		name: "App",
		components: {Map}
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
