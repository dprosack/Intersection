import * as L from 'leaflet';
import {VectorTileLayer} from 'esri-leaflet-vector'
import { FeatureLayer } from 'esri-leaflet';
import { StreetSmartApi } from "@cyclomedia/streetsmart-api";

export let updateKeys = (k,u,p) => {
	key = k
	username = u
	password = p
	return
}
let key;
let username;
let password;

export let currMap;
export let spiderLine = [];
export let marker = [];
export let buildLegs = [];
export let highlightRoad = null;
export let labelsLGroup = null; 
let openPopupArr = [];
let pntDictCache = []
let bbxBounds; 

const TYPE = "DEV" //DEV OR PROD
const TypePntName = TYPE === "DEV" ? "INT_PNT_TEST" : "INTSECT_PNT"
const TypeApprchName = TYPE === "DEV" ? "INTSECT_APRCH_TEST" : "INTSECT_APRCH"

export const map = () => {
	currMap = L.map('map',{zoomControl: false, attributionControl: false, minZoom: 2, maxZoom:20, renderer: L.canvas({tolerance: 5})}).setView([31.128816639265004, -99.33504551560264], 7)
	currMap.isSpiderWeb = false
	currMap.isAppchLegs = 0
	currMap.createPane("bridgePane")
	currMap.createPane("legLine")
	currMap.createPane("geomPt")
	currMap.createPane("geomLine")
	currMap.createPane("pntLabels")
	currMap.createPane("roads")
	currMap.getPane("roads").style.zIndex = 399
	currMap.getPane("bridgePane").style.zIndex = 400
	currMap.getPane("geomLine").style.zIndex = 401;
	currMap.getPane("legLine").style.zIndex = 402
	currMap.getPane("geomPt").style.zIndex = 403;
	currMap.getPane("pntLabels").style.zIndex = 404;

	labelsLGroup = L.layerGroup().addTo(currMap)
	return currMap
};

export const imageryTileLayer = L.tileLayer('https://txgi.tnris.org/login/path/tahiti-vanilla-tribune-cave/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER={layer}&STYLE={style}&FORMAT={format}&TILEMATRIXSET={tileMatrixSet}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
	format: "image/png",
	layer: "texas",
	// crs: L.CRS.EPSG3857,
	tileMatrixSet: '0to20',
	style: "default",
	maxZoom: 20
})

export const standardBasemap = new VectorTileLayer("https://tiles.arcgis.com/tiles/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Vector_Tile_Basemap/VectorTileServer",{
	preserveDrawingBuffer: false,
	style: () => "https://www.arcgis.com/sharing/rest/content/items/507a9905e7154ce484617c7327ee8bc4/resources/styles/root.json",
	minZoom: 3,
	maxZoom: 20,
	crs: L.CRS.ESPG4269,
	//pane: "tilePane"
})

export const roads = new VectorTileLayer("https://tiles.arcgis.com/tiles/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Intersection_Roadway_Line/VectorTileServer", {
	preserveDrawingBuffer: false,
	style: function(rvt){
		rvt.layers.forEach(l => l.paint["line-color"] = "#036ffc")
		return rvt
	},
	pane: "roads"
})

export const brdge = new VectorTileLayer("https://tiles.arcgis.com/tiles/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Intersection_Bridge_VT_OSM/VectorTileServer", {
	preserveDrawingBuffer: false,
	pane: "bridgePane",
	style: (bvt) => {
		bvt.layers[0].paint["line-width"] = 3
		bvt.layers[0].paint["line-color"] = "rgba(62,49,135,.3)"
		return bvt
	}
})

export const basemapLayer = (newMap) => {
	standardBasemap.addTo(newMap)
	return
}

export const pntLabel = new FeatureLayer({
	url: "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Intersection_Label_Test/FeatureServer/0",
	renderer: L.svg(),	
})

pntLabel.on("load", () => {
	labelsLGroup.addLayer(pntLabel)
})

export const basemapLayerGroup = {
	"TxDOT" : standardBasemap,
	"Leaflet" : imageryTileLayer,
}

export const basemapLayerControl = L.control.layers(basemapLayerGroup)

export function returnBoundsMeter(bounds){
	let convertNE = L.CRS.EPSG3857.project(bounds._northEast)
	let convertSW = L.CRS.EPSG3857.project(bounds._southWest)

	let meterBounds = `${convertSW.x};${convertSW.y};${convertNE.x};${convertNE.y}`
	return meterBounds
}

export function getIntData(newMap, bounds){
	bbxBounds = bounds
	let bbx = `{"xmin": ${bounds._southWest.lng}, "ymin":${bounds._southWest.lat}, "xmax":${bounds._northEast.lng}, "ymax":${bounds._northEast.lat}}`
	return fetch(`https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Intersection_Inventory/FeatureServer/0/query?geometry=${bbx}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=%22*%22&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=pgeojson`) //"https://txdot4avpta01/geoserver/TppDmMap/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=TppDmMap%3AINTSECT_PNT&outputFormat=application%2Fjson"
		.then((res) => {
			return res.json()
		})
		.then((res) => {	
			let featJson = res.features
			marker.length = 0
			for(let i=0; i < featJson.length; i++){
				let markerPt = L.circleMarker([featJson[i].geometry.coordinates[1], featJson[i].geometry.coordinates[0]], {
					radius: featJson[i].properties.INTSECT_ID === featJson[i].properties.INTCHG_ID ? 4.8 : 4.8,
					weight: 1,
					opacity: 1,
					fillOpacity: .8,
					fillColor: returnPntFillColor(featJson[i]),
					id: featJson[i].properties.INTSECT_ID,
					stroke: true,
					color: "#f5f5f5",
					weight: 1,
					pane: "geomPt",
					className: "markers",
					properties: featJson[i].properties
					//renderer: render,
				})
				.addTo(newMap)

				marker.push(markerPt)

				markerPt.on("click", (m) => {
					newMap.isSpiderWeb = false;
					newMap.oldStyle ? newMap.oldStyle[1].setStyle({fillColor: newMap.oldStyle[0]}) : null
					if(spiderLine.length){
						spiderLine.forEach(l => l.removeFrom(newMap))
					}
					newMap.oldStyle = [m.target.options.fillColor, m.target, featJson[i]]
					m.target.setStyle({fillColor: "#7FFFD4"})
				})
			}
			
		})
		.catch((err)=>{
			console.error("error calling geojson data", err)
		})
}

function returnPntFillColor(pnt){
	if(pnt.properties.INTSECT_ID === pnt.properties.INTCHG_ID){
		return "#1679fa"
	}
	if(pnt.properties.INTSECT_NM.includes('Drive')){
		return "#007a00"
	}
	if(pnt.properties.INTSECT_NM.includes('Rail')){
		return "#ee9a00"
	}
	return "#fa14d0"

}

export async function returnPntStyleAndInfo(pnt){
	removeAllLegs()
	if(pnt.properties.INTCHG_ID === pnt.properties.INTSECT_ID){
		let isPntCached = pntDictCache.find(pntCache => pntCache[pnt.properties.INTCHG_ID])
		if(isPntCached){
			isPntCached[pnt.properties.INTCHG_ID].forEach(pt => {
				addToSpiderWeb(pnt,pt)
			})
			return true
		}
							
		let findAssocPts = await returnSpiderInfo(pnt.properties.INTCHG_ID)
		let pntRelationship = await findAssocPts.json()
			// .then(res => res.json())
			// .then((pntRelationship) => {
		if(!pntRelationship.features.length){
			currMap.isSpiderWeb = false
			return false
		}

		let returnCachObj = createGroupByPtArray(pntRelationship.features)
		pntDictCache.push(returnCachObj)
		
		pntRelationship.features.forEach(pt => {
			addToSpiderWeb(pnt, pt.geometry.coordinates)
		})
		currMap.isSpiderWeb = true
			// })
		return true
	}
	spiderIntsectionToInterchange(pnt)
	return currMap.isSpiderWeb
}

export function addToSpiderWeb(featJson, pt){
	let polyline = [[featJson.geometry.coordinates[1], featJson.geometry.coordinates[0]]]
	polyline.push([pt[1], pt[0]])
	spiderLine.push(L.polyline(polyline, {color: '#d90d0d', pane: "geomLine"}).addTo(currMap))
	return
}

export function spiderIntsectionToInterchange(intPnt){
	//receive intersection point
	//find related interchange if there is one
	if(spiderLine.length){
		spiderLine.forEach(s => s.remove())
		spiderLine.length = 0
	}
	if(!intPnt.properties.INTCHG_ID) return

	returnIntchgInfo(intPnt.properties.INTCHG_ID)
		.then((res) => res.json())
		.then((feat)=>{
			let interchange = feat.features[0].geometry.coordinates
			let intPolyline = [[interchange[1], interchange[0]], [intPnt.geometry.coordinates[1], intPnt.geometry.coordinates[0]]]
			
			spiderLine.push(L.polyline(intPolyline, {className: "lineTransition", stroke: true, pane: "geomLine", dashArray: [8], color: 'orange'}).addTo(currMap))
			dynamicLabel(intPnt.properties.INTSECT_ID, feat.features[0].properties.INTSECT_ID)
		})

	return
}

function dynamicLabel(intPnt, intchgPnt){
	let intSectId = marker.filter(int => int.options.id === intPnt || int.options.id === intchgPnt)
	intSectId.forEach(id => {
		openPopupArr.push(id)
		id.bindPopup(`<b>${id.options.id}</b>`, {autoClose: false,closeButton: false, autoPan: false})
		id.openPopup()
	})
	
	return
}

export function toggleOffPopup(){
	openPopupArr.forEach(popup => popup.closePopup())
	openPopupArr.length = 0 	
	return
}

export function removeMarkerPoints(){
	marker.forEach(m => m.removeFrom(currMap))
	return
}

//populate pt dictionary
export function createGroupByPtArray(ptArray){
	let dataPts = {};

    let i = 0; 
    for(i=0; i < ptArray.length; i++){
        let pt = ptArray[i]
        if(!Object.hasOwn(dataPts, pt.properties.INTCHG_ID)){
			dataPts[`${pt.properties.INTCHG_ID}`] = []
        }
		if(pt.properties.INTSECT_ID === pt.properties.INTCHG_ID){
			continue
		}
		
		dataPts[pt.properties.INTCHG_ID]?.push(pt.geometry.coordinates) ?? null
        continue
    }
	return dataPts
}

export function removeSpiderArrays(){
	spiderLine.forEach((line) => line.removeFrom(currMap))
	currMap.isSpiderWeb = false
	return
}

export function highlightPoints(latlng){
	return L.circleMarker(latlng,{
		radius: 10,
		weight: 1,
		opacity: 1,                                                                                                                                                                           
		fillOpacity: .8,
		fillColor: "green",
	}).addTo(currMap)
}



export function highlightLine(coords, lineProps){
	highlightRoad = L.polyline(coords, {color: lineProps.color, weight: lineProps.weight, pane: "legLine"}).addTo(currMap)
	buildLegs.push(highlightRoad)

	return highlightRoad
}

export function removeAllHighlights(){
	if(!highlightRoad){
		return
	}

	highlightRoad.removeFrom(currMap)
	return
}

export function removeHighlightGeom(geom){
	geom.removeFrom(currMap)
	return
}

export function returnIntPts(pt_lat, pt_long){
	// let pntFrom = `${pt_long}, ${pt_lat}`
	let getPts = fetch(`https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Intersection_Inventory/FeatureServer/0/query?geometry=${pt_long}%2C${pt_lat}&geometryType=esriGeometryPoint&inSR=4269&spatialRel=esriSpatialRelIntersects&resultType=standard&distance=1609.344&units=esriSRUnit_Meter&returnGeodetic=false&outFields=%22*%22&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&returnAggIds=false&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=pgeojson`) //https://txdot4avpta01/geoserver/TppDmMap/ows?service=WFS&version=1.0.0&request=GetFeature&CQL_FILTER=DWITHIN(SHAPE,Point(${pt_long} ${pt_lat}),1609.344,meters)&typeName=TppDmMap%3AINTSECT_PNT&outputFormat=application%2Fjson
	return getPts
}

export function returnSpiderInfo(intId){
	try{
		let returnIntsects = fetch(`https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Intersection_Inventory/FeatureServer/0/query?where=INTSECT_ID+%3C%3E+${intId}+AND+INTCHG_ID+%3D+${intId}&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=standard&distance=&units=esriSRUnit_Meter&returnGeodetic=false&outFields=%22*%22&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&groupByFieldsForStatistics=&returnAggIds=false&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=pgeojson`)
		return returnIntsects
	}
	catch{
		console.warn("error requesting Intersection Points.")
	}
}

export function returnIntchgInfo(intchgId){
	try{
		let returnIntchg = fetch(`https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Intersection_Inventory/FeatureServer/0/query?where=INTSECT_ID+%3D+${intchgId}+AND+INTCHG_ID+%3D+${intchgId}&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=standard&distance=&units=esriSRUnit_Meter&outDistance=&relationParam=&returnGeodetic=false&outFields=%22*%22&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&returnAggIds=false&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson`)
		return returnIntchg
	}
	catch{
		console.warn("error requesting Intersection Points.")
	}
	return
}

export function returnIntAppchLegs(intsectId){
	try{
		let getLegs = fetch(`https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Intersection_Inventory/FeatureServer/1/query?where=INTSECT_ID+%3D+${intsectId}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=%22*%22&returnGeometry=true&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&returnAggIds=false&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=pgeojson`)
		return getLegs
	}
	catch(err){
		console.log(err)
	}

}

export async function returnRoadNames(rdName){
	try{
		let encodeURI = encodeURIComponent(`RTE_NM like '%${rdName}%'`)
		
		let roadNames = await fetch(`https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Roadways/FeatureServer/0/query?where=${encodeURI}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=%22*%22&returnGeometry=true&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&returnAggIds=false&returnZ=false&resultRecordCount=5&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson`)

		let roads = await roadNames.json()
		return roads
	}
	catch(err){
		console.log(err)
	}
}

export async function returnRoadGeom(rdName){
	try{
		let roadQuery = encodeURIComponent(`GID in (${rdName})`)
		let roadNames = await fetch(`https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_Roadways/FeatureServer/0/query?where=${roadQuery}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=%22*%22&returnGeometry=true&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&returnAggIds=false&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson`)
		
		let roads = await roadNames.json()
		return roads
	}
	catch(err){
		console.log(err)
	}
}

export function returnHighlightRoad(road){
	let roadProps = {color: "#f44336", weight: 2} 
    let newPolyline = highlightLine(road.geometry.coordinates.map(coord => [coord[1], coord[0]]), roadProps)
	return newPolyline
}

export function displayLegs(geomArr, leg){
	let legs = L.polyline(geomArr,{
		color: "#48e300",
		pane: "geomLine",
		leg: leg
	}).addTo(currMap)
	
	buildLegs.push(legs)
	return legs
}

export function removeAllLegs(){
	buildLegs.forEach(leg => leg.removeFrom(currMap))
	buildLegs.length = 0
	return
}

export async function geteLRSInfo(latlng){
	let returnELRS = await fetch(`https://lrs-ext.us-e1.cloudhub.io/api/elrs/v1/xy?lat=${latlng.lat}&lon=${latlng.lng}`)
	let elrsArr = await returnELRS.json()
	return elrsArr
}

export function reorderPntsByDist(usrPnt, intPnts){
	try{
		let i;
		let mainPoint = L.latLng(usrPnt)
		//let holdingArr = []
		for(i = 0; i < intPnts.length; i++){
			let testPnt = L.latLng(intPnts[i].geometry.coordinates[1], intPnts[i].geometry.coordinates[0])
	
			let dist = currMap.distance(mainPoint, testPnt)
			intPnts[i].properties.DISTANCE = dist
		}
	
		intPnts.sort((a,b)=> a.properties.DISTANCE - b.properties.DISTANCE)
		return intPnts.slice(0,10)
	}
	catch(err){
		console.log("issue ordering Points")
		return err
	}
}

export function drawIntersectionBuffer(coords, currBuffer){
	if(currBuffer){
		currBuffer.remove()
	}
	return L.circle(coords, {
		radius: 10,
		color: "#ED9121",
		fillColor: "#2A52BE",
		interactive: false
	})
}

export function initStreetSmartApi(currPtLoc){
	const initCycloViewerOptions = {
		targetElement: document.getElementById('streetsmartApi'),
		username: username,
		password: password,
		srs: "EPSG:3081",
		apiKey: key,
		locale: "en-US",
		overlayDrawDistance: 30,
		addressSettings: {
			locale: "us",
			database: "Nokia"
		}
	}

	try{
		StreetSmartApi.init(initCycloViewerOptions)
		.then(
			() => {
				console.log("connected to Street Smart!")
				getCycloViewer(currPtLoc)
			}, 
			(err) => console.error(err)
		)
	}
	catch{	
		console.log("err")
	}
}

export function getCycloViewer(currPtLoc){
	let convert = StreetSmartApi.getProj4()
	const epsg3081 = 'PROJCS["NAD83 / Texas State Mapping System",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101],TOWGS84[0,0,0,0,0,0,0]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["latitude_of_origin",31.1666666666667],PARAMETER["central_meridian",-100],PARAMETER["standard_parallel_1",27.4166666666667],PARAMETER["standard_parallel_2",34.9166666666667],PARAMETER["false_easting",1000000],PARAMETER["false_northing",1000000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","3081"]]'
	let point = convert.toPoint(currPtLoc.geometry.coordinates)
	let data = convert('EPSG:4326', epsg3081, point)
	let coordinateObj = {
		coordinate: [data.x, data.y]
	}

	StreetSmartApi.open(coordinateObj, {
		viewerType: [StreetSmartApi.ViewerType.PANORAMA],
		srs: 'EPSG:3081',
		panoramaViewer: {
			replace: true,
			navbarVisible: false,
			sidebarVisible: false,
			measureTypeButtonVisible: false,
			measureTypeButtonToggle: true,
			measureTypeButtonStart: false
		},
	})
	.then((res)=>{
		let resizeObserver = new ResizeObserver(entries => {
			if(entries[0].contentRect.width > 288){
				res[0].toggleNavbarVisible(true)
				return
			}
			res[0].toggleNavbarVisible(false)
			return
		})

		resizeObserver.observe(document.getElementsByClassName("panoramaviewer")[0])

	})
	.catch((err) => {
		console.warn(err)
	})
}

export const isConnectedToStreetSmart = () => StreetSmartApi.getApiReadyState()

export function highlightDiv(e, id){
	id ? removeHighlightDiv(`${id}`) : null
	e.classList.add("highlightRow")
	return
}

function removeHighlightDiv(id){
	if(!document.getElementById(id)) return
	if(document.getElementById(id).classList.contains("highlightRow")){
		document.getElementById(id).classList.remove("highlightRow")
		return
	}
	return
}

export function returnPnt(intchId){
	// console.log(intchId.properties.INTCHG_ID)
	let findIntChgPoint = marker.find(x => x.options.properties.INTSECT_ID === intchId.properties.INTCHG_ID)
	console.log(findIntChgPoint)
	
	return findIntChgPoint
}

export function turnLabelsOn(){
	console.log("runing")
	labelsLGroup.clearLayers()
	pntLabel.query()
			.bboxIntersects(bbxBounds)
			.run((err, feat) => {
				if(err){
					console.warn(err)
					return
				}
				feat.features.forEach((f) => {
					let getCenter = f.geometry.coordinates
					L.marker([getCenter[1], getCenter[0]], {
							icon: L.divIcon({
								iconSize: 0,
								className: "label",
								html: `<div>${f.properties.INTSECT_ID}</div>`
							}),
							pane: "pntLabels"
						}).addTo(labelsLGroup)
					}) 

			})
	return
}

export function turnLabelsOff(){
	labelsLGroup.clearLayers()
	return
}








