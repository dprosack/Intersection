<template>
	<div class="header-container">
		<div>
			<span id="header">TxDOT Intersection Inventory</span>
		</div>
		<div>
			<span style="color: red;"><b>Beta Version</b></span>
		</div>
		<div style="margin-left: auto; display: flex; gap: 50px; padding-right: 51px;">
			<div>
				<span id="appInfo">
					Data updated 08/27/2025
				</span>
			</div>
			<div style="display: flex; gap:10px; align-items: center;">
				<div id="labelSwitchDiv" class="labelDisabled">
					<span>Labels</span>
					<div>
						<label class="switch" @change="setLabelSwitch($event)">
							<input id="labelSwitch" type="checkbox" disabled>
							<span class="slider"></span>
						</label>
					</div>

				</div>
				<button class="dropdown" @click="setBasemap()">
					<span style="padding-right: 10px;">Basemap</span>
					<span class="arrow"></span>
				</button>
				<button class="dropdown" @click="setAbout()">
					<span style="padding-right: 10px;">About</span>
					<span class="arrow"></span>
				</button>
				<ul class="select-dropdown" v-if="showDropDown">
					<li @click="showTxdotGray()"><span>TxDOT</span></li>
					<li @click="showImagery()"><span>Texas Imagery Service</span></li>
				</ul>
				<div id="aboutContent" v-if="showAbout">
					<div style="margin: 5px; display: flex; flex-direction: column; gap: 20px; font-size: 12px;">
						<div>
							<span>
								This web map is a visualization tool for TxDOT’s new Intersection Inventory. It provides for an intuitive, curated exploration of the data.
							</span>
						</div>
						<div>
							<span>Use this app to explore relationships between intersections, interchanges, and approach legs</span>
						</div>
						<div>
							<div class="center">
								<span class="material-symbols-outlined aboutIcons">travel_explore</span>
								
								<div>
									<span>Search a location using TxDOT’s eLRS service to find intersections along a road by route, reference marker, or control section. </span>
								</div>

							</div>
						</div>
						<div>
							<div class="center">
								<span class="material-icons aboutIcons">my_location</span>
								<div>
									<span>Or simply click a spot on the map to find nearby intersections.</span>
								</div>

							</div>
						</div>
						<div>
							<div class="center">
								<span class="material-symbols-outlined aboutIcons">ballot</span>			
								<div>
									<span>Intersection points are classified into at-grade, grade-separated, participating in an interchange or stand alone.</span>
								</div>

							</div>
						</div>
						<div>
							<div class="center">
								<span class="material-symbols-outlined aboutIcons">point_scan</span>
								<div>
									<span>Explore attributes and relationships of intersections and approach legs.</span>
								</div>

							</div>
						</div>
						<div>
							<div class="center">
								<span class="material-symbols-outlined aboutIcons">hub</span>
								<div>
									<span>A convenient spider diagram appears when an interchange point is selected, showing the parent-child relationship between participating intersection points.</span>
								</div>

							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div id="map">
		<div id="legend">
			<canvas id="canvas"></canvas>
		</div>
		<div v-if="isSpider" id="closeSpider">
			<button id="closeSpiderBtn" @click="removeSpider()">
				<span class="material-symbols-outlined">hub</span>
				Close Spider
			</button>
		</div>
	</div>

	<Search :map="mapId" :hello="send" @toggle-intersection="currIntersection"/>
	<IntersectionDetails v-if="showIntersection" :detail="intersection"/>
	
</template>

<script>
	import {basemapLayer, map, getIntData, standardBasemap, imageryTileLayer, displayLegs, 
			returnIntAppchLegs, roads, removeHighlightGeom, removeSpiderArrays, marker, removeMarkerPoints, 
			returnBoundsMeter, brdge, returnPntStyleAndInfo, pntLabel, toggleOffPopup, turnLabelsOff, turnLabelsOn} from '../init-leaflet.js' //getIntData
	import Search from './Search.vue'
	import IntersectionDetails from './IntersectionDetails.vue'
	import { toRaw } from 'vue';

	export default{
		name: "Map",
		components: {Search, IntersectionDetails},
		data(){
			return{
				mapId: null,
				intersection: null,
				showIntersection: false,
				getLegs: [],
				legDrawFeats: [],
				showAbout: false,
				eLRStooltip: false,
				showDropDown: false,
				send: null,
				isSpider: false,
				mapBounds: null,
				toggleLabels: false
			}
		},
		mounted() {
			try{
				this.mapId = map();	
				basemapLayer(toRaw(this.mapId));
				
				roads.addTo(this.mapId);
				this.drawLegend()
				this.watchZoomLevel()

				document.getElementById("map").addEventListener("click", ()=>{
					this.showAbout = false
					this.showDropDown = false
				})
			}
			catch(err){
				console.log(err)
			}
		},
		methods:{
			setLabelSwitch(e){
				if(e.target.checked){
					turnLabelsOn()
					this.toggleLabels = true
					return
				}
				turnLabelsOff()
				this.toggleLabels = false
				return
			},
			setAbout(){
				if(this.showAbout){
					this.showAbout = false
					return
				}

				this.showAbout = true
				this.showDropDown = false
				return
			},
			watchZoomLevel(){
				this.mapId.on({
					zoomend: (e) => {
					}, 
					moveend: (e) => {
						if(e.target._zoom > 14){
							!this.toggleLabels || turnLabelsOn()
							let mapBounds = this.mapId.getBounds()
							this.mapBounds = returnBoundsMeter(mapBounds)
							getIntData(this.mapId, mapBounds);
							document.getElementById("labelSwitchDiv").classList.remove("labelDisabled")
							document.getElementById("labelSwitch").disabled = false
							brdge.addTo(this.mapId)
							
							return
						}
						toggleOffPopup()
						turnLabelsOff()
						console.log(this.mapId)
						document.getElementById("labelSwitchDiv").classList.add("labelDisabled")
						document.getElementById("labelSwitch").disabled = true
						document.getElementById("labelSwitch").checked = false
						
						if(marker.length){
							removeMarkerPoints()
						}
						return
					}
				})
				
				return
			},
			removeSpider(){
				removeSpiderArrays()
				this.isSpider = false
				return 
			},
			drawLegend(){
				const canvas = document.getElementById("canvas")
				const ctx = canvas.getContext("2d")
				canvas.width = "600";
				const style = [{color: "#007a00", pos: 20, text: ["Driveways", 34, 17]}, 
							   {color: "#ee9a00", pos: 113, text: ["Rail", 125, 17]},
							   {color: "#fa14d0", pos: 163, text: ["Intersection", 179, 17]},
							   {color: "#1679fa", pos: 265, text: ["Interchange", 280, 17]}, 
							   {color: "#48e300", pos: 205, text: ["Approach Leg", 403, 17]}]
				for(let i = 0;  i < style.length; i++){
					ctx.strokeStyle = '#000000'
					if(style[i].text[0] === 'Approach Leg'){
						ctx.strokeText(style[i].text[0], style[i].text[1], style[i].text[2])
						ctx.beginPath()
						ctx.strokeStyle = style[i].color
						ctx.moveTo(364,13)
						ctx.lineTo(395, 13)
						ctx.closePath()
						
						ctx.stroke()
						ctx.font = "lighter 6px Verdana, sans-serif"
						
						continue
					}
					ctx.fillStyle = style[i].color
					ctx.font = "lighter 12px Verdana, sans-serif"
					ctx.strokeText(style[i].text[0], style[i].text[1], style[i].text[2])
					let a = new Path2D();
					a.arc(style[i].pos, 13, 3, 0, 2*Math.PI)
					ctx.fill(a)
				}

			},
			setBasemap(){
				if(this.showDropDown){
					this.showDropDown = false
					return
				}
				this.showDropDown = true
				this.showAbout = false
				return
			},
			showTxdotGray(){
				
				imageryTileLayer.remove()
				standardBasemap.addTo(toRaw(this.mapId))
				
				this.showDropDown = false
				return
			},
			showImagery(){
				standardBasemap.remove()
				imageryTileLayer.addTo(toRaw(this.mapId))
				this.showDropDown = false
				return
			},
			async currIntersection(e){
				if(e === "Clear"){
					document.getElementById('intersectionDetails') ? document.getElementById('intersectionDetails').style.display = 'none' : null
					this.isSpider = false
					return
				}
				this.isSpider = await returnPntStyleAndInfo(e)
				let appchLegs = await this.updatedLegsAndIntersects(e.properties.INTSECT_ID)
				e.approachLegs = appchLegs
				e.mapBounds = this.mapBounds
				this.intersection = e
				!this.showIntersection ? this.showIntersection = true : document.getElementById('intersectionDetails').style.display = 'block'
				return
			},
			async updatedLegsAndIntersects(intsectId){
				try{
					if(this.legDrawFeats.length){
						this.legDrawFeats.forEach(l => removeHighlightGeom(l))
					}
					let res = await returnIntAppchLegs(intsectId)
					let obj = await res.json()
					obj.features.forEach(leg => {
						let appch = displayLegs(leg.geometry.coordinates.map(x => [x[1], x[0]]), leg)
						this.legDrawFeats.push(appch)
						marker.find(mark => mark.options.id === intsectId).bringToFront()
						return
					})
					let getLegs = obj.features
					return getLegs
				}
				catch(err){
					console.log(err)
					return
				}
			}
			
		},
		watch:{
			'mapId.oldStyle':{
				handler: async function (n,o){
					if(n){
						this.send = n
						this.isSpider = false
						await this.currIntersection(n[2])
					}
				},
				immediate: true
			},
			'mapId.isSpiderWeb':{
				handler: function(n,o){
					if(n){
						this.isSpider = true
						return
					}
					this.isSpider = false
					return
				},
				immediate: true
			}
		}
	}

</script>

<style scoped>
	.header-container{
		background: #F2F2F2;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: left;
		flex-direction: row;
		border-bottom: 3px solid #0056A9;
		width: 100%;
		padding-left: 10px;
		gap: 30px;
	}
	#header{
		font-size: 24px;
		font-weight: bold;
	}
	#appInfo{
		font-size: 12px;
		color: #595959;
		font-style: italic;
	}
	.dropdown{
		appearance: none;
		width: fit-content;
		background-color: none;
		border: 1px solid #caced1;
		border-radius: 0.25rem;
		color: #000;
		cursor: pointer;
		background: none;
		border: 0px;
	}
	.select-dropdown{
		position: absolute;
		top: 45px;
		z-index: 99999;
		background-color: white;
		right: 81px;
		padding: 8px 8px 8px 8px;
		font-size: 13px;
		border-radius: 5px;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 1px 1px 7px black;
	}
	.select-dropdown li {
		list-style-type: none;
		width: 100%;
		padding-bottom: 8px;
		margin-bottom: 0px;
		top: 10px;
		padding-left: 2px;
	}
	.select-dropdown li span{
		position: relative;
		top: 5px;
		padding: 4px;
	}
	.select-dropdown li:hover{
		background-color: rgba(128, 128, 128, .2);
		cursor: pointer;
	}

	.dropdown:hover{
		cursor: pointer;
	}
	.headers{
		display: none;
	}
	.label{
		position: relative;
		left: 8px;
	}
	.arrow{
		border: solid black;
		border-width: 0 1px 1px 0;
		display: inline-block;
		padding: 4px;
		transform: rotate(45deg);
		bottom: 2px;
	}
	.rotate{
		border: solid black;
		border-width: 0 1px 1px 0;
		display: inline-block;
		padding: 4px;
		transform: rotate(-135deg);
		bottom: 0px;
	}

	#aboutContent{
		position: absolute;
		background: white;
		top: 45px;
		z-index: 99999;
		padding: 8px;
		border-radius: 5px;
		width: 326px;
		right: 10px;
		box-shadow: 1px 1px 7px black;
	}
	#svgLRSBtn{
		height: 22px;
		width: 30px;
	}
	#legend{
		position: relative;
		height: 25px;
		width: 480px;
		background-color: white;
		align-self: flex-end;
		border-radius: 5px;
		margin: 10px 10px 20px 10px;
		z-index: 99999;
		padding-left: 20px;
	}
	#canvas{
		position: relative;
		right:20px;
	}
	.aboutIcons{
		color: #0056A9;
		font-size: 25px !important;
		padding-right: 10px;
	}
	.center{
		display: flex; 
		flex-direction: row; 
		justify-content: space-between; 
		align-items: center;
	}
	#closeSpiderBtn{
		display: flex;
		flex-direction: row;
		gap: 15px;
		position: absolute;
		align-items: center;
		padding: 7px;
		height: 30px;
		width: 150px;
		z-index: 9999;
		left: 49vw;
		bottom: 73px;

		box-shadow: 1px 1px 7px rgba(0,0,0, 1);
		background-color:  #d90d0d;
		font-weight: bold;
		color: white;
		border: none;

	}

	#closeSpiderBtn:hover{
		cursor: pointer;
	}

	.switch {
		position: relative;
		top: 2px;
		display: inline-block;
		width: 35px;
		height: 13px;
	}

	.switch input { 
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: none;
		-webkit-transition: .4s;
		transition: .4s;
		border-radius: 10px;
		outline: 2px solid black;
		cursor: pointer;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 9px;
		width: 10px;
		left: 4px;
		bottom: 2px;
		background-color: black;
		-webkit-transition: .4s;
		transition: .4s;
		border-radius: 10px;
	}

	input:checked + .slider {
		background-color: rgba(33, 150, 243, 1);
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #2196F3;
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(17px);
		-ms-transform: translateX(17px);
		transform: translateX(17px);
	}

	.slider.round {
		border-radius: 34px;
	}

	.slider.round:before {
		border-radius: 50%;
	}

	#labelSwitchDiv{
		display: flex; 
		flex-direction: row; 
		align-items: center; 
		gap: 10px; 
		font-size: 13px;
	}
	
	#labelSwitch:disabled + .slider{
		outline: 2px solid grey;
		cursor: default !important;
	}

	#labelSwitch:disabled + .slider::before{
		background-color: gray !important;
	}

</style>


