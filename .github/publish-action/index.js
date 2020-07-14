import * as core from '@actions/core';
import * as github from '@actions/github';
import { getDiff, updateVersionPatch, updateVersionMinor, updateVersionProduction, buildAndPublish } from './utils';

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

	const { stdout, stderr } = await getDiff(base, head, path, context.ref);

	if (stdout) {
		console.log('getDiff output :');
		console.log(stdout);

	} else if (stderr) {
		console.log('getDiff error :');
		console.log(stderr);
		return;

	} else {
		console.log('not modified !');
		return;
	}

	let version;
	const ref = context.ref.split('/')[2];
	if (ref === 'master') {
		version = await updateVersionProduction(path);

	} else if (ref.startsWith('stg')) {
		version = await updateVersionMinor(path);

	} else if (ref.startsWith('hotfix')) {
		version = await updateVersionPatch(path);

	} else if (ref === 'beta') {
		version = await updateVersionPatch(path);
	}

	await buildAndPublish(path);
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
