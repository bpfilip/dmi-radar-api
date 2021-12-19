require('dotenv').config();

const fs = require("fs");

const { convertImage, getData, convertData, getLatestDate, removeFiles } = require("./utils");

const express = require('express');
const app = express();

app.listen(process.env.port || 8080, () => {
	console.log(`Listening on port ${process.env.port || 8080}`);
})

if (!fs.existsSync("data/")) {
	fs.mkdirSync("data");
}

app.get("/latest", async (req, res) => {
	const date = getLatestDate();
	if (fs.existsSync(`data/${date}.png`)) {
		return res.sendFile(`./data/${date}.png`, { root: __dirname });
	}
	try {
		await getData(date);
	}
	catch (err) {
		return res.status(404).send("Date not found");
	}
	await convertData(date);
	res.send(await convertImage(date));
	removeFiles(date);
});

app.get("/image/:date", async (req, res) => {
	if (!/^[0-9]{12}$/.test(req.params.date)) {
		return res.status(400).send("Invalid date format. The format is YYYYMMDDHHMM")
	}
	const date = req.params.date;
	if (fs.existsSync(`data/${date}.png`)) {
		return res.sendFile(`./data/${date}.png`, { root: __dirname });
	}
	console.time(date+":"+1)
	try {
		await getData(date);
	}
	catch (err) {
		return res.status(404).send("Date not found");
	}
	await convertData(date);
	res.send(await convertImage(date));
	console.timeEnd(date+":"+1)
	removeFiles(date);
})

const { GifFrame, GifUtil, GifCodec } = require('gifwrap');

app.get("/gif", async (req, res) => {
	console.log("started loading gif");
	const dates = [...Array(24).keys()].map(getLatestDate);
	const images = [];
	const promises = [];
	console.time(1)
	for (let i = 0; i < dates.length; i++) {
		promises.push(new Promise(async (resolve, reject) => {
			await getData(dates[i]);
			await convertData(dates[i]);
			images.push(await convertImage(dates[i], false));
			resolve();
		}))
	}

	await Promise.all(promises);
	console.timeEnd(1)
	console.time(2)

	const gifFrames = images.map(image => {
		const gif = new GifFrame(image.bitmap.width, image.bitmap.height, { delayCentisecs: 5 });
		gif.bitmap = image.bitmap;
		return gif;
	});
	console.timeEnd(2)
	console.time(3)

	// to get the byte encoding without writing to a file...
	const codec = new GifCodec();
	const gif = await codec.encodeGif(gifFrames)
	console.timeEnd(3)

	res.send(gif.buffer);

	for (let i = 0; i < dates.length; i++) {
		removeFiles(dates[i]);
	}
})

app.use(express.static("public"));