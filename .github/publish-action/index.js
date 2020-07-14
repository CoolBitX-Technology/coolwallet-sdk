import * as core from '@actions/core';
import * as github from '@actions/github';
import {
	getDiff,
	updateVersionPatch,
	updateVersionMinor,
	updateVersionProduction,
	buildAndPublishProduction,
	buildAndPublishBeta,
} from './utils';

async function checkAndPublish(context, path) {
	console.log(`[ ${path} ] start process`);

	let base;
	let head;
	if (context.payload.pull_request) {
		base = context.payload.pull_request.base;
		head = context.payload.pull_request.head;
	} else {
		base = context.payload.before;
		head = context.payload.after;
	}

	const diff = await getDiff(base, head, path, context.ref);

	if (diff) {
		console.log('getDiff :');
		console.log(diff);

	} else {
		console.log('not modified !');
		return;
	}

	let version;
	const ref = context.ref.split('/')[2];
	if (ref === 'master') {
		await updateVersionProduction(path);
		await buildAndPublishProduction(path);

	} else if (ref.startsWith('stg')) {
		await updateVersionMinor(path);
		await buildAndPublishBeta(path);

	} else if (ref.startsWith('hotfix')) {
		await updateVersionPatch(path);
		await buildAndPublishBeta(path);

	} else if (ref === 'beta') {
		await updateVersionPatch(path);
		await buildAndPublishBeta(path);
	}

	console.log(`[ ${path} ] end of process\n`);
}

async function run() {
	const context = github.context;
	console.log('context :', context);
	await checkAndPublish(context, 'packages/core');
	await checkAndPublish(context, 'packages/cws-btc');
}

try {
	run();
} catch (error) {
	core.setFailed(error.message);
}
