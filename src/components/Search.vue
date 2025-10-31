<template>
	<div id="searchDiv">
		<div class="inlet-body">
			<div id="searchTop">
				<div style="display: flex; flex-direction: column; gap: 10px;">
					<div id="rdErrorDiv" v-if="isRoadNotExist">
						<span id="rdErrorTxt">
							{{ errorTxt }}
							<span class="material-icons" @click="isRoadNotExist = false;">close</span>
						</span>
						
					</div>
					<div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between;">
						<div >
							<span class="inlet-header">Search</span>
						</div>
						<div @click="findLRM()" @mouseenter="eLRStooltip = !eLRStooltip" @mouseleave="eLRStooltip = !eLRStooltip"> 
							<span class="material-icons" id="searchIcon">add_circle_outline</span>
						</div>
					</div>
					<div>
						<span>Choose a linear reference method below or click + to choose a spot on the map.</span>
					</div>
				</div>
				<div style="display: flex; position: relative; padding-top: 10px;">
					<div id="searchButtons">
						<button v-for="btn in searchBtns" class=searchRefButtons @click="adjustInputs" :class="btn.class">{{btn.title}}</button>
					</div>
				</div>
				<div v-if="input_info === 'dfo'">
					<div style="margin-bottom: 5px;">
						<input placeholder='Route' id="item" style="position: relative;" v-model="rte" @input="rte.length >= 4 ? searchRdName($event) : searchResults.length = 0"></input>
					</div>
					<div style="display: flex; flex-direction: row; align-items: center; gap: 20px;">
						<input placeholder='DFO' id="loc" style="position: relative; width: 60px" v-model="dfo" @input="checkDFORange(dfo)"></input>
						<span v-if="showDfoRange">{{ dfoRange.text }}</span>
					</div>
				</div>
				<div v-if="input_info === 'rmd'">
					<div style="margin-bottom: 5px;">
						<input placeholder='Route' id="item" style="position: relative;" v-model="rte"></input>
					</div>
					<div style="display: flex; flex-direction: row;">
						<input placeholder='Reference Marker' id="loc" style="position: relative; width: 120px" v-model="rm"></input>
						<input placeholder='Displacement' id="loc2" style="display: block; margin-left: 7px; position: relative; width: 133px;" v-model="dsp"></input>
					</div>
				</div>
				<div v-if="input_info === 'csmpt'">
					<div style="margin-bottom: 5px;">
						<input placeholder='Control Section' id="item" style="position: relative;" v-model="cs"></input>
					</div>
					<div style="display: flex; flex-direction: row;">
						<input placeholder='Milepoint' id="loc" style="position: relative; width: 120px" v-model="mpt"></input>
					</div>
				</div>
				<div v-if="input_info === 'xy'">
					<div style="margin-bottom: 5px;">
						<input placeholder='Latitude' id="item" style="position: relative;" v-model="lat"></input>
					</div>
					<div style="display: flex; flex-direction: row;">
						<input placeholder='Longitude' id="loc" style="position: relative; width: calc(100% - 12px);" v-model="lon"></input>
					</div>
				</div>
				<template v-if="isDfoOutOfRange.bool">
					<div id="outOfRange"><span>{{ isDfoOutOfRange.text }}</span></div> 
				</template>
			</div>
			<div id="searchBottom" v-if="isIntersection">
				<div>
					<span class="inlet-title">Nearby Intersections</span>
				</div>
				<div class="list-item-div">
					<span v-if="isLoading" class="loader"></span>
					<span v-for="res in returnInts" :key=res id="listItem" class="list_item" v-if="returnInts.length" @mouseenter="highlightPoint(res)" @mouseleave="removeHighlight('point')" >
						<div :id="res.id" @click="zoomToPt(res.geometry.coordinates, res.id); $emit('toggle-intersection', res);">
							<span>ID: {{res.properties.INTSECT_ID}}</span><span class="item-route">{{res.properties.INTSECT_NM}}
								<span class="material-symbols-outlined">zoom_in</span>
							</span>
							<span class="underline_list"></span>
						</div>
					</span>
					<span v-if="!returnInts.length && !isLoading">
						Nothing to see here.
					</span>
				</div>
			</div>
			<div style="position: relative; display: flex; width: 100%; flex-direction: row; justify-content: flex-end;">
				<div>
					<button id="searchClearBtn" class="secondary-button" @click="clearLrms()">Clear</button>
					<button id="searchBtn" :class="!isSaveBtn ? 'main-button' : 'disabled-button'" @click="populateSearchForm()" v-text="searchBtn" :disabled="isSaveBtn"></button>
				</div>
			</div>

		</div>
		<template v-if="eLRStooltip">
			<span class="popup">Click a position on the map to receive LRM information</span>
		</template>
		<template v-if="searchResults.length" >
			<div id="searchRes">
				<div v-for="res in searchResults" :key="res" @click="selectRoute(res)" @mouseenter="highliteRoad(res)" @mouseleave="removeHighlight('line')" style="display:flex; flex-direction: row; justify-content: space-between;">
					<span>{{ res.properties.RTE_NM }}</span>
					<span style="font-style: italic;">Range {{res.properties.BEGIN_DFO}} - {{res.properties.END_DFO}}</span>
				</div>
			</div>

		</template>
	</div>
</template>

<script>
	import {ref, watch, computed} from 'vue';
	import {returnIntPts, highlightPoints, removeHighlightGeom, removeAllHighlights, geteLRSInfo, returnRoadNames, returnHighlightRoad, 
			reorderPntsByDist, drawIntersectionBuffer, removeAllLegs, highlightDiv, removeSpiderArrays, toggleOffPopup} from '../init-leaflet'
	
	export default{
		name: "Search",
		emits: ['toggle-intersection'],
		props: ['map', 'hello'],
		setup(props, {emit}){
			const rte = ref("")
			const dfo = ref("")
			const rm = ref("")
			const dsp = ref(null)
			const lat = ref(null)
			const lon = ref(null)
			const cs = ref("")
			const mpt = ref(null)
			const isSaveBtn = ref(true)
			const mapWatch = computed(() => props.hello);
			const isRoadNotExist = ref(false)
			const errorTxt = ref("Route Does not exist. Try again!")
			const isDfoOutOfRange = ref({bool: false, text: ""})
			const searchBtn = ref("Search")
			const eLRStooltip = ref(false)
			const showELRSContext = ref(false)
			const searchBtns = [{title: "DFO", class:"LRM_click"}, {title: "TRM", class:""}, {title: "Ctrl Sec"}, {title: "Lat/Long"}];
			const searchResults = ref([])
			let dfoSearchBeginDFO = null;
			let dfoSearchEndDFO = null;
			let showDfoRange = ref(false);
			let dfoRange = ref({bool: false, text: "range"});
			const returnInts = ref([]);
			const input_info = ref("dfo")
			const returnContextInfo = ref({top: 0, left: 0, lat:0, lng: 0})
			const intersectionBuffer = ref("")
			const intersectionId = ref(null)
			const isLoading = ref(false)
			const isIntersection = ref(false)
			const buildQuery = {
				dfo : () => {
					return `rte=${rte.value}&dfo=${dfo.value}`
				},
				csmpt : () => {
					return `cs=${cs.value}&mpt=${mpt.value}`
				},
				rmd: () => {
					return `rte=${rte.value}&rm=${rm.value}&dsp=${dsp.value}`
				},
				xy: () => {
					return `lat=${lat.value}&lon=${lon.value}`
				}
			}

			watch(mapWatch, async (n,o) => {
				returneLRSInfo({"lat": n[2].geometry.coordinates[1], "lng": n[2].geometry.coordinates[0]})
			})
			let highlightMarkerLoc = {}
			let highlightRoad = null

			window.onclick = (e) =>{
				if(searchResults.value.length && (!e.target.contains(document.getElementById("searchRes")) || !e.target.contains(document.getElementById("item")))){
					searchResults.value.length = 0
					clearDFOValues()
					isDisabledSearchBtn()
					return
				}

				return
			}

			function highliteRoad(road){
				highlightRoad = returnHighlightRoad(road)
				return
			}

			function checkDFORange(dfo){
				if(dfo >= dfoSearchBeginDFO && dfo <= dfoSearchEndDFO){
					isDfoOutOfRange.value = {bool: false, text: "hello"}
					isDisabledSearchBtn()
					return
				}
				
				isDfoOutOfRange.value = {bool: true, text: `DFO is out of Range. ${dfoSearchBeginDFO} - ${dfoSearchEndDFO}`}
				isDisabledSearchBtn()
				return
			}

			function selectRoute(road){
				if(dfo.value){
					dfo.value = ""
					
				}
				removeHighlight("line")
				removeAllHighlights()
				rte.value = road.properties.RTE_NM
				dfoSearchBeginDFO = road.properties.BEGIN_DFO
				dfoSearchEndDFO = road.properties.END_DFO
				searchResults.value.length = 0;
				showDfoRange.value = true
				dfoRange.value = {bool: true, text: `DFO Range: ${dfoSearchBeginDFO} - ${dfoSearchEndDFO}`}
				isSaveBtn.value = true
				return 
			}

			function findLRM(){
				document.getElementById("map").style.cursor = "crosshair"
				props?.map.on("click", (e)=>{
					intersectionId.value = null
					removeAllLegs()
					removeAllHighlights()
					toggleOffDetailsPane()
					returneLRSInfo(e.latlng)
					isDisabledSearchBtn()	
				})
				return
			}

			async function searchRdName(e){
				let rdName = e.target.value.toUpperCase()
				let results = await returnRoadNames(rdName)
				searchResults.value = results.features
				isSaveBtn.value = true
				return
			}

			function highlightPoint(res){
				highlightMarkerLoc = highlightPoints([res.geometry.coordinates[1], res.geometry.coordinates[0]])
				return
			}

			function removeHighlight(type){
				if(type === "point"){
					removeHighlightGeom(highlightMarkerLoc)
					return
				}
				highlightRoad ? removeAllHighlights() : null 
				return
			}

			function adjustInputs(event){
				removeClasses("LRM_click")
				switch (event.target.textContent){
					case "DFO":
						event.target.classList.add('LRM_click')
						input_info.value = "dfo";
						break;
					case "TRM":
						event.target.classList.add('LRM_click')
						input_info.value = "rmd";
						break;
					case "Ctrl Sec":
						event.target.classList.add('LRM_click')
						input_info.value = "csmpt";
					break;
					case "Lat/Long":
						event.target.classList.add('LRM_click')
						input_info.value = "xy";
					break;
				}
				return
			}

			function removeClasses(activeClass){
				let getActiveClass = document.getElementsByClassName(activeClass)
				for(let i=0; i < getActiveClass.length; i++){
					getActiveClass[i].classList.remove(activeClass)
				} 	
				return			
			}

			function populateSearchForm(){
				returnInts.value.length = 0
				isLoading.value = isIntersection.value = true
				
				document.getElementById("searchBtn").classList.add("startSearching")
				searchBtn.value = "Searching.."
				populateLrms()
				return
			}

			function populateLrms(){
				toggleOffDetailsPane()
				intersectionId.value = null
				let buildQuerys = buildQuery[input_info.value]()
				fetch(`https://lrs-ext.us-e1.cloudhub.io/api/elrs/v1/${input_info.value}?${buildQuerys}`)
					.then((res) => res.json())
					.then(json => {
						document.getElementById("searchBtn").classList.remove("startSearching")
						if(!json[0].LAT){
							isLoading.value = false
							isRoadNotExist.value = true
							return
						}
						
						rte.value = json[0].RTE_DEFN_LN_NM
						rm.value = json[0].RMRKR_PNT_NBR
						lat.value = json[0].LAT
						lon.value = json[0].LON
						dsp.value = json[0].RMRKR_DISPLACEMENT
						dfo.value = json[0].RTE_DFO
						mpt.value = json[0].CTRL_SECT_MPT
						cs.value = json[0].CTRL_SECT_LN_NBR
						dfoSearchBeginDFO = json[0].GID_DFO_RANGE[0]
						dfoSearchEndDFO = json[0].GID_DFO_RANGE[1]
						zoomToPt([lon.value, lat.value])
						listIntersections()
						return
					})
					.catch((err) => {
						isLoading.value = false
						isRoadNotExist.value = true
						searchBtn.value = "Search"
						errorTxt.value = "There is an issue retrieving data."
						console.log(err)
					})
			}

			function listIntersections(){
				returnIntPts(lat.value, lon.value)
				.then((x) => x.json())
				.then(res => {
					if(!res.features.length){
						isLoading.value = false
						returnInts.value.length = 0;
						searchBtn.value = "Search"
						return
					}
					let feat = [...res.features]
					let returnClosest = reorderPntsByDist([lat.value, lon.value], feat)
					returnInts.value = returnClosest
					isLoading.value = false
					searchBtn.value = "Search"
					displayIntersectionBuffer([lat.value, lon.value])
					
					// res.features.forEach(f => returnInts.value.push(f))
				})
				.catch((err) => {
					isLoading.value = false
					isRoadNotExist.value = true
					errorTxt.value = "There is an issue retrieving data."
					searchBtn.value = "Search"
					console.log(err)
				})
				return
			}
			
			function displayIntersectionBuffer(ptArr){
				intersectionBuffer.value = drawIntersectionBuffer(ptArr, intersectionBuffer.value).addTo(props.map)
				return
			}

			function zoomToPt(ptArr, id){
				props.map.setView([ptArr[1], ptArr[0]], 18)
				displayIntersectionBuffer([ptArr[1], ptArr[0]])
				if(id){
					highlightDiv(document.getElementById(`${id}`), intersectionId.value)
				}
				intersectionId.value = id
				return
			}	
			
			function clearDFOValues(){
				isDfoOutOfRange.value = {bool: true}
				dfoSearchBeginDFO = null
				dfoSearchEndDFO = null
				showDfoRange.value = false
				dfo.value ? dfo.value = "" : null			
				rte.value = ""
				return
			}

			function clearLrms(){
				clearDFOValues()
				toggleOffDetailsPane()
				rte.value = null
				rm.value = null
				lat.value = null
				lon.value = null
				dsp.value = null
				dfo.value = null
				mpt.value = null
				cs.value = null
				returnInts.value.length = 0
				isIntersection.value = false
				removeAllLegs()
				removeSpiderArrays()
				if(intersectionBuffer.value){
					intersectionBuffer.value.remove()
				}
				dfoRange.value = {bool: false, text: "hello"}
				removeHighlight("line")
				removeAllHighlights()
				isDisabledSearchBtn()
				toggleOffPopup()
				return
			}

			const toggleOffDetailsPane = () => emit('toggle-intersection', "Clear");


			async function returneLRSInfo(latlng){
				try{
					isLoading.value = isIntersection.value = true
					returnInts.value.length = 0
					let returnELRS = await geteLRSInfo(latlng)

					showELRSContext.value = false
					if(!returnELRS[0].LAT || !returnELRS[0].GID){
						isRoadNotExist.value = true
						return
					}
					rte.value = returnELRS[0].RTE_DEFN_LN_NM
					rm.value = returnELRS[0].RMRKR_PNT_NBR
					lat.value = returnELRS[0].LAT
					lon.value = returnELRS[0].LON
					dsp.value = returnELRS[0].RMRKR_DISPLACEMENT
					dfo.value = returnELRS[0].RTE_DFO
					mpt.value = returnELRS[0].CTRL_SECT_MPT
					cs.value = returnELRS[0].CTRL_SECT_LN_NBR
					dfoSearchBeginDFO = returnELRS[0].GID_DFO_RANGE[0]
					dfoSearchEndDFO = returnELRS[0].GID_DFO_RANGE[1]
					showDfoRange.value = true
					dfoRange.value = {bool: true, text: `DFO Range: ${dfoSearchBeginDFO} - ${dfoSearchEndDFO}`}
					listIntersections()
					document.getElementById("map").style.cursor = "grab"
					props.map.off("click")
					isDisabledSearchBtn()
					return
				}
				catch(err){
					isLoading.value = false
					isRoadNotExist.value = true
					searchBtn.value = "Search"
					errorTxt.value = "There is an issue retrieving data."
					document.getElementById("map").style.cursor = "grab"
					console.log(err)
				}

			}

			function isDisabledSearchBtn(){
				if(!rte.value || !dfo.value || isDfoOutOfRange.value.bool ){
					isSaveBtn.value = true
					return
				}
				isSaveBtn.value = false
				return
			}
			
			return {returnInts, searchBtns, input_info, adjustInputs, populateSearchForm, clearLrms, zoomToPt, isRoadNotExist, showELRSContext, 
				    searchBtn, eLRStooltip, findLRM, rte, dfo, rm, dsp, lat, lon, cs, mpt, returnContextInfo, highlightPoint, removeHighlight, 
					isLoading, isIntersection, searchRdName, searchResults, isDfoOutOfRange, selectRoute, checkDFORange, highliteRoad, dfoRange, 
					showDfoRange, errorTxt, isSaveBtn};
		},

	}
</script>

<style scoped>
#searchDiv{
	z-index: 9999;
	position: absolute;
	background: white;
	padding-bottom: 1px;
	left: 10px;
	max-width: 309px;
	box-shadow: 1px 1px 7px black;
	top: 50px;
	font-size: 10px;
}

#searchBtnContainer{
	position: relative;
	flex-direction: row;
	padding-left: 5px;
}

.searchRefButtons{
	font-size: 14.5px;
	border: none;
	background: none;
	border-bottom: 2px solid rgba(9,86,169,.2);
	padding-left: 15px;
}

.searchRefButtons:hover{
	position: relative;
	border-bottom: 2px solid rgba(9,86,169,1);
	color: rgba(9,86,169,1);
	font-weight: bold;
	cursor: pointer;
	text-align: center;
}

#searchButtons{
	margin-bottom: 5px;
}

#item{
	width: calc(100% - 12px);
}

.LRM_click{
	border-bottom: 2px solid rgba(9,86,169,1) !important;
	color: rgba(9,86,169,1) !important;
	font-weight: bold;
}

#item:focus, #loc:focus, #loc2:focus{
	border: 2px solid rgba(9,86,169,.2);
	outline: none;
}

#searchClearBtn{
	margin-right: 15px;
}

#rdErrorDiv{
	position: absolute;
  	width: 100%;
  	display: flex;
  	flex-direction: column;
  	right: 0px;
  	top: 0px;
}

#rdErrorTxt{
	background-color: red;
	color: white;
	display: inline-block;
	z-index: 9999;
	font-size: 14px;
	padding-left: 9px;
	padding-top: 7px;
	padding-bottom: 7px;
	position: relative;
}
.material-icons{
	float: right;
	padding-right: 9px;
	display: inline-flex;
	top: 2px;
}

.popup{
	top: 44px;
}
#popup{
	height: 30px;
	width: 30px;
	position: absolute;
	z-index: 9999;
	display: block;
}
@media (max-width: 1280px){
	#searchDiv{
		font-size: 8px !important;
	}
	#searchRefButtons{
		font-size: 12.5px;
	}
}

#listItem{
	margin-bottom: 10px;
}

.loader{
	border: 2px solid rgba(9,86,169,1);
	border-top: 2px solid white;
	border-radius: 50%;
	width: 18px;
	height: 18px;
	animation: spin 2s linear infinite;
}

@keyframes spin {
	0% {transform: rotate(0deg);}
	100% {transform: rotate(360deg);}
}

#searchIcon{
	position: relative;
	font-size: 22px !important;
	bottom: 5px;
}

#searchRes{
	position: absolute;
	height: fit-content;
	width: 255px;
	background-color: white;
	z-index: 99999;
	display: flex;
	flex-direction: column;
	gap: 3px;
  	padding: 10px;
	border: 5px;
	box-shadow: 1px 1px 5px black;
	top: 133px;
	left: 10px;
}

#searchRes div{
	padding: 5px;
}

#searchRes div:hover {
	cursor: pointer;
	background-color: rgba(128, 128, 128, .2);
}

#outOfRange{
	color: red;
	font-style: italic;
	padding-top: 5px;
}

.material-symbols-outlined{
	position: relative;
	top: 3px;
	font-size: 12px !important;
}

.list_item:focus{
	border: 2px solid red;
}
</style>


