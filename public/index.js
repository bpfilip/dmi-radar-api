// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com
mapboxgl.accessToken = 'pk.eyJ1IjoiZmlsbGkxMzAzIiwiYSI6ImNreGJzcnRybzFkYWYzMXFjYW9pZmhjdGQifQ.jQyCZxDokqG72T06huPnPw';
const map = new mapboxgl.Map({
	container: 'map',
	maxZoom: 15,
	minZoom: 4,
	zoom: 8,
	center: [9.0758804, 56.1196813],
	style: 'mapbox://styles/mapbox/dark-v10'
});

let source;

map.on('load', () => {
	map.addSource('radar', {
		'type': 'image',
		'url': 'latest',
		// 'url': 'image/202112010645',
		'coordinates': [
			[
				4.379082700525593,
				59.827708427801085
			],
			[
				20.735140174892805,
				59.827708427801085
			],
			[
				20.735140174892805,
				52.29427206432812
			],
			[
				4.379082700525593,
				52.29427206432812
			],
		]
	});
	source = map.getSource('radar');
	map.addLayer({
		id: 'radar-layer',
		'type': 'raster',
		'source': 'radar',
		'paint': {
			'raster-fade-duration': 0
		}
	});
});

let startedLoading = false

const images = [];

map.on("idle", () => {
	if (!startedLoading) {
		startedLoading = true;
		getImages();
	}
})

function getLatestDate(past = 0, rawDate = false) {
	// The data from the api is about 15 minutes delayed
	const time = new Date((Date.now() - 15 * 60000) - (past * 5 * 60000));
	// const now = new Date("12-01-2021 08:00")
	// const time = new Date((now - 15 * 60000) - (past * 5 * 60000));

	if (rawDate) {
		return time;
	}

	const y = "" + time.getUTCFullYear();
	const M = ("" + (time.getUTCMonth() + 1)).padStart(2, "0");
	const d = ("" + time.getUTCDate()).padStart(2, "0");
	const h = ("" + time.getUTCHours()).padStart(2, "0");
	// Data is only available every 5 minutes
	const m = ("" + (time.getUTCMinutes() - time.getUTCMinutes() % 5)).padStart(2, "0");

	return y + M + d + h + m;
}

async function getImages() {
	const imgs = [];
	for (let i = 0; i < 24; i++) {
		imgs.push(new Promise(async (resolve, reject) => {
			const res = await fetch("/image/" + getLatestDate(i));
			const blob = await res.blob();
			const data = URL.createObjectURL(blob);
			resolve(data);
		}))
	}

	await Promise.all(imgs);
	for (let i = 0; i < 24; i++) {
		images.push(await imgs[i]);
	}
	document.getElementById("slider").removeAttribute("disabled")
	// console.log(images);
}

const label = document.getElementById("sliderLabel")
let time = getLatestDate(0, true).getTime();
	label.innerText = new Date(time - time % (5 * 60000))

document.getElementById("slider").addEventListener("input", async (e) => {
	source.updateImage({ url: images[23 - e.currentTarget.value] })
	let time = getLatestDate(23 - e.currentTarget.value, true).getTime();
	label.innerText = new Date(time - time % (5 * 60000))
})