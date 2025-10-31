<template>
	<div id="intersectionDetails">
		<div class="inlet-body">
			<div id="intersectingRoutes">
				<div>
					<div v-if="!isApprch" style="margin-bottom: 5px !important;">
						<span class="inlet-header">{{ intersectionInfo.properties.INTCHG_ID === intersectionInfo.properties.INTSECT_ID ? "Interchange" : "Intersection"  }}</span>
					</div>
					<div v-else style="display: flex; flex-direction: row; gap: 10px; margin-bottom: 0px !important; padding-bottom: 0px !important;">
						<span class="material-icons" id="approachIcon" @click="isApprch = false; backToIntersectionPopup = false" @mouseenter="backToIntersectionPopup = true" @mouseleave="backToIntersectionPopup = false">
							arrow_circle_up
						</span>
						<span class="inlet-header">Approach Leg</span>
					</div>
				</div>
				<div id="intIdHeader" v-if="!isApprch">
					<span>ID: {{ intId }}</span>
				</div>
				<div id="intIdHeader" v-else>
					<span>Approach ID: {{ apprchId }}</span>
				</div>
				<div v-if="!isApprch">
					<span :v-model="intersectionInfo" id="intersectionInfo">
						<div>
							<span class="intersection-headers">Name:</span><span class="instersection-value">{{intersectionInfo.properties.INTSECT_NM}}</span>
						</div>
						<div v-if="intersectionInfo.properties.INTCHG_ID !== intersectionInfo.properties.INTSECT_ID">
							<span class="intersection-headers">Interchange ID:</span><span class="instersection-value" @click='flashInterchangePoint(intersectionInfo)'>{{intersectionInfo.properties.INTCHG_ID ?? "None"}}</span>
						</div>
						<div>
							<span class="intersection-headers">{{ intersectionInfo.properties.INTCHG_ID === intersectionInfo.properties.INTSECT_ID ? "Interchange Type" : "Intersection Type" }}:</span><span class="instersection-value">{{intersectionInfo.properties.INTCHG_ID === intersectionInfo.properties.INTSECT_ID ? intersectionInfo.properties.INTCHG_TYPE ?? "Unknown"  : intersectionInfo.properties.INTSECT_TYPE ?? "Unknown"}}</span>
						</div>
						<div v-if="intersectionInfo.properties.INTCHG_ID !== intersectionInfo.properties.INTSECT_ID">
							<span class="intersection-headers">Intersection Geometry:</span><span class="instersection-value">{{intersectionInfo.properties.INTSECT_GMTY ?? "Unknown"}}</span>
						</div>
						<div v-if="intersectionInfo.properties.INTCHG_ID !== intersectionInfo.properties.INTSECT_ID">
							<span class="intersection-headers">Traffic Control:</span><span class="instersection-value">{{dictionary.TrcCtrlDict[intersectionInfo.properties.TRFC_CTRL] ?? "Unknown"}}</span>
						</div>
						<div>
							<span class="intersection-headers">Grade:</span><span class="instersection-value">{{dictionary.gradeDict[intersectionInfo.properties.GRADE] ?? "At-Grade"}}</span>
						</div>
					</span>
				</div>
				<div v-else>
					<span :v-model="apprchInfo" id="intersectionInfo">
						<div>
							<span class="intersection-headers">Intersection ID:</span><span class="instersection-value"><a href="#" @click="isApprch = false; backToIntersectionPopup = false;" @click.stop="onClick">{{apprchInfo.properties.INTSECT_ID ?? "Missing ID"}}</a></span>
						</div>
						<div>
							<span class="intersection-headers">Intersection DFO:</span><span class="instersection-value">{{apprchInfo.properties.INTSECT_DFO ?? "No Interchange"}}</span>
						</div>
						<div>
							<span class="intersection-headers">Route:</span><span class="instersection-value">{{apprchInfo.properties.RTE_DEFN_LN_NM ?? "Not Defined"}}</span>
						</div>
						<div>
							<span class="intersection-headers">Roadbed Type:</span><span class="instersection-value">{{dictionary.rdbdDict[apprchInfo.properties.RDBD_TYPE_ID][0] ?? "No Value"}}</span>
						</div>
						<div>
							<span class="intersection-headers">Functional Class:</span><span class="instersection-value">{{dictionary.funcSysDict[apprchInfo.properties.FUNCL_SYS] ?? "No Value"}}</span>
						</div>
						<div>
							<span class="intersection-headers">AADT:</span><span class="instersection-value">{{apprchInfo.properties.AADT ?? "No Value"}}</span>
						</div>
						<div>
							<span class="intersection-headers">AADT YEAR:</span><span class="instersection-value">{{apprchInfo.properties.AADT_YR ?? "No Value"}}</span>
						</div>
						<div>
							<span class="intersection-headers">Begin DFO:</span><span class="instersection-value">{{apprchInfo.properties.BEGIN_DFO ?? "0.00"}}</span>
						</div>
						<div>
							<span class="intersection-headers">End DFO:</span><span class="instersection-value">{{apprchInfo.properties.END_DFO ?? "0.00"}}</span>
						</div>
						<div>
							<span class="intersection-headers">Length:</span><span class="instersection-value">{{Math.round((Number(apprchInfo.properties.SEG_LEN)*5280).toFixed(2)) ?? "0"}} feet</span>
						</div>
						<div>
							<span class="intersection-headers">Cardinal Direction:</span><span class="instersection-value">{{apprchInfo.properties.CRDNL_DIR ?? "NA"}}</span>
						</div>
						<div>
							<span class="intersection-headers">Primary Route:</span><span class="instersection-value">{{apprchInfo.properties.PRMRY_FLAG === 1 ? "Yes" : "No"}}</span>
						</div>
					</span>
				</div>
				<div >
					<div>
						<span class="inlet-title">Intersecting Routes</span>
					</div>
					<div class="list-item-div">
						<div v-if="!intersectionInfo.approachLegs.length">
							<span style="font-size: 9px; color: rgba(9,86,169,1); font-weight: bold;">No Intersecting Routes for this Intersection/Interchange</span>
						</div>
						<div v-else>
							<span v-for="route in intersectionInfo.intersectRoute" :key="route" class="list_item noPointer" @mouseenter="highlightIntersectingRoute(route.properties.RTE_DEFN_LN_NM)" @mouseleave="removeHighlight('route')"> 
								<span>{{route.properties.RTE_DEFN_LN_NM ?? "Route Name is NULL"}} ({{ dictionary.rdbdDict[route.properties.RDBD_TYPE_ID][1] }})</span>
								<span class="item-route" style="position: relative; top: 1px;">DFO - {{route.properties.INTSECT_DFO}}</span>
								<span class="underline_list"></span>
							</span>
						</div>
					</div>
					
				</div>
			</div>
			<div id="approachLegs">
				<div>
					<span class="inlet-title">Approach Legs</span>
				</div>
				<div class="list-item-div">
					<div v-if="!intersectionInfo.approachLegs.length">
						<span style="font-size: 9px; color: rgba(9,86,169,1); font-weight: bold;">No Approach Legs for this Intersection/Interchange</span>
					</div>
					<div v-else>
						<span v-for="leg in intersectionInfo.approachLegs" :key="leg" :id="leg.properties.APRCH_ID" class="list_item" @mouseenter="highlightLeg(leg)" @mouseleave="removeHighlight('line')" @click="openApprchLeg(leg, null);"> 
							<span>Appr ID: {{leg.properties.APRCH_ID ?? "APRCH_ID NULL"}}</span><span class="item-route">{{leg.properties.RTE_DEFN_LN_NM}}
								<span class="material-symbols-outlined" id="zoomIn">zoom_in</span>
							</span>
							<span class="underline_list"></span>
						</span>
					</div>
				</div>
				<div id="streetSmart">
					<div style="height: 170px;" id="streetsmartApi"></div>
				</div>
				<span>
					<a :href="mapBoundsMeters" target="_blank">Jump to StreetSmart Application</a>
				</span>
			</div>
		</div>
		<template v-if="backToIntersectionPopup">
			<span class="popup">Back to intersection screen</span>
		</template>
	</div>
</template>

<script>
	import {ref, computed, onUpdated, onMounted} from 'vue'
	import {dictionary} from '../reference'
	import {getCycloViewer, initStreetSmartApi, isConnectedToStreetSmart, highlightLine, removeHighlightGeom, currMap, buildLegs, highlightDiv, returnHighlightRoad, returnRoadGeom, removeAllHighlights, returnPnt} from '../init-leaflet'

	export default{
		name: "IntersectionDetails",
		props: {
			detail: Object,
			legs: Array,
		},
		setup(props){
			const intersectionInfo = computed(() => {
				removeAllHighlights()
				highlightRoute ? highlightRoute.length = 0 : null
				apprchId.value = null
				addClickEventLeg()
				intersectingRoutes()
				mapBoundsMeters.value = `https://streetsmart.cyclomedia.com/?mq=${props.detail.mapBounds}&msrs=EPSG:3857&pparams=177.01;25.78;110.00`
				return props.detail
			}) 
			const isApprch = ref(false)
			const apprchInfo = ref(null)
			const intId = computed(() => props.detail.properties.INTSECT_ID)
			const nodeType = computed(() => props.detail.properties.INTCHG_FLAG)
			const apprchId = ref(null)
			const mapBoundsMeters = ref(null)
			const backToIntersectionPopup = ref(false)
			let highlightGeom = {}
			let intsectRoute = [];
			let highlightRoute = null; 
			let activeLeg = null

			async function intersectingRoutes(){
				let intersectingRoute = []
				props.detail.approachLegs.forEach((leg) => {
					if(!intersectingRoute.some(appch => appch.properties.RTE_DEFN_LN_NM === leg.properties.RTE_DEFN_LN_NM)){
						intersectingRoute.push({...leg})
					}
				})
				let getCommaSepRouteName = intersectingRoute.map((rte) => `${rte.properties.GID}`).toString()
				let returnRoad = await returnRoadGeom(getCommaSepRouteName)
				intsectRoute = returnRoad.features
				props.detail.intersectRoute = intersectingRoute
				return
			}

			function openApprchLeg(appchLeg, e){
				e ? clickHighlightDiv(e) : clickHighlightDiv(document.getElementById(`${appchLeg.properties.APRCH_ID}`))
				
				apprchId.value = appchLeg.properties.APRCH_ID ?? "APRCH_ID NULL"
				apprchInfo.value = appchLeg
				isApprch.value = true
				
				currMap.setView([appchLeg.geometry.coordinates[0][1], appchLeg.geometry.coordinates[0][0]], 18)
				showAppchLeg(appchLeg)
				return
			}
			//TODO: Combine Dups together
			function highlightLeg(leg){
				let lineProp = {color: "#FFD12A", weight: 3}
				highlightGeom = highlightLine(leg.geometry.coordinates.map(c => [c[1], c[0]]), lineProp)
				return
			}

			function showAppchLeg(leg){
				if(activeLeg){
					removeHighlightGeom(activeLeg)
				}
				let lineProp = {color: "#f2ce1b", weight: 5}
				activeLeg = highlightLine(leg.geometry.coordinates.map(c => [c[1], c[0]]), lineProp)
				return
			}

			function removeHighlight(type){
				if(type === 'route'){
					removeHighlightGeom(highlightRoute)
					return
				}
				removeHighlightGeom(highlightGeom)
				return
			}

			function addClickEventLeg(){
				buildLegs.forEach(leg => {
					leg.on("click", (e) => {
						currMap.isAppchLegs = e.sourceTarget._leaflet_id
						let getAssociatedDiv = document.getElementById(`${leg.options.leg.properties.APRCH_ID}`)
						openApprchLeg(leg.options.leg, getAssociatedDiv)
					})
				})
				return
			}

			function highlightIntersectingRoute(road){
				let findRoute = intsectRoute.find(rte => rte.properties.RTE_NM === road)
				if(!findRoute){
					return
				}

				highlightRoute = returnHighlightRoad(findRoute)
				return
			}

			onUpdated(() => {
				if(isConnectedToStreetSmart()){
					getCycloViewer(intersectionInfo.value)	
				}
				
				return
			})

			onMounted(() => {
				//if already connected, bypass init func, otherwise proceed to init func
				if(isConnectedToStreetSmart()){
					console.log('already connected')
					getCycloViewer(intersectionInfo.value)

					return
				}
				initStreetSmartApi(intersectionInfo.value)
				return
			})

			function clickHighlightDiv(e){
				highlightDiv(e, apprchId.value)
				return
			}

			function flashInterchangePoint(pnt){
				if(!pnt.properties.INTCHG_ID) return

				let intchgPnt = returnPnt(pnt)
				intchgPnt._path.classList.add('flashPoint')
				return
			}


			return {intId, intersectionInfo, isApprch, openApprchLeg, highlightIntersectingRoute, mapBoundsMeters,
					apprchId, apprchInfo, highlightLeg, removeHighlight, backToIntersectionPopup, dictionary, clickHighlightDiv, nodeType, flashInterchangePoint}
		},
	}
</script>

<style scoped>
#intersectionDetails{
	position: absolute;
	background: white;
	min-width: 308px;
	max-width: 310px;
	z-index: 9999;
	margin: 10px;
	top: 40px;
	left: calc(100% - 330px);
	box-shadow: 1px 1px 7px black;
	font-size: 10px;
	min-height: 480px;
	max-height: calc(100% - 78px);
	overflow-y: auto;
	overflow-x: hidden;
}

#intIdHeader{
	margin-top: 0px;
	padding: 5px 0px 5px 5px;
	font-weight: bold;
	background: #333F48;
	color: white;
}
.intersection-headers{
	position: relative;
	color: #7F7F7F;
}
.instersection-value{
	position: relative;
	float: right;
}

.inlet-body{
	gap: 30px !important;
}
#streetSmart{
	display: flex;
	flex-direction: column;
	gap: 7px;
	position: relative;
	margin-top: 10px;
}
#intersectionInfo{
	display: flex; 
	flex-direction: column;
}
#intersectingRoutes{
	display: flex;
	flex-direction: column;
}

span{
	margin-bottom: 10px;
}

.popup{
	top: 36px;
	left: 10px;
}

#approachIcon{
	transform: rotate(270deg);
	font-size: 22px !important;
}

#zoomIn{
	position: relative;
	top: 3px;
	font-size: 12px !important;
}
.noPointer{
	cursor: default !important;
}
</style>

