const fs = require('fs');
const fetch = require("node-fetch");

async function getData(date) {
	const res = await fetch(`https://dmigw.govcloud.dk/v1/radardata/download/dk.com.${date}.500_max.h5?api-key=${process.env.DmiApiKey}`);
	if (res.status !== 200) {
		throw new Error("Date not found");
	}
	const fileStream = fs.createWriteStream("data/" + date + ".h5");
	await new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on("error", reject);
		fileStream.on("finish", resolve);
	});
}

const LUT = require("./lut")
const Jimp = require('jimp');

async function convertImage(date, write = true) {
	const image = await Jimp.read("data/" + date + ".gif");

	for (let i = 0; i < image.bitmap.width * image.bitmap.height * 4; i += 4) {
		const color = 255 - image.bitmap.data[i];
		if (color == 0 || color == 255) {
			image.bitmap.data[i + 3] = 0;
			continue;
		}
		image.bitmap.data[i] = LUT[color][0];
		image.bitmap.data[i + 1] = LUT[color][1];
		image.bitmap.data[i + 2] = LUT[color][2];
	}
	if (write) {
		image.writeAsync("data/" + date + ".png");
		return image.getBufferAsync(Jimp.MIME_PNG);
	} else {
		return image;
	}
}

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function convertData(date) {
	await exec(`h52gif data/${date}.h5 data/${date}.gif -i dataset1/data1/data`);
}

function getLatestDate(past = 0) {
	// The data from the api is about 15 minutes delayed
	const time = new Date((Date.now() - 15 * 60000) - (past * 5 * 60000));
	const y = "" + time.getUTCFullYear();
	const M = ("" + (time.getUTCMonth() + 1)).padStart(2, "0");
	const d = ("" + time.getUTCDate()).padStart(2, "0");
	const h = ("" + time.getUTCHours()).padStart(2, "0");
	// Data is only available every 5 minutes
	const m = ("" + (time.getUTCMinutes() - time.getUTCMinutes() % 5)).padStart(2, "0");

	return y + M + d + h + m;
}

const fsAsync = require("fs/promises");

async function removeFiles(date) {
	fsAsync.unlink(`data/${date}.gif`);
	fsAsync.unlink(`data/${date}.h5`);
	// const files = await fsAsync.readdir("data")
	// const filesToRemove = files.filter(file => file.includes(date));
	// for (let i = 0; i < filesToRemove.length; i++) {
	// 	fsAsync.unlink("data/" + filesToRemove[i])
	// }
}

module.exports = { convertImage, getData, convertData, getLatestDate, removeFiles };