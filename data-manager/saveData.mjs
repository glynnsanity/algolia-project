// File: helloAlgolia.mjs
import { algoliasearch } from "algoliasearch";
import { promises as fs } from 'fs'; 

const appID = "TBEEBDFYJF";
const apiKey = "6602e6636c815555ee513fb855ea2e2c";
const indexName = "revised_project";
const client = algoliasearch(appID, apiKey);

async function saveBatchWithBackoff(batch, retries = 5, delay = 1000) {
	try {
		// Attempt to save the batch
		const { taskID } = await client.saveObjects({
			indexName,
			objects: batch,
		});
		// Wait for the task to complete
		/*
			Removed and deprioritized this because I kept getting a strange error saying it required taskID
			which is already being passed in the function
			
			await client.waitForTask({
				indexName: indexName,
				taskID: taskID,
			});
		*/
	
		console.log(`Batch saved successfully`);	
	} catch (error) {
		if (retries > 0) {
			console.error(`Error saving batch. Retrying in ${delay / 1000} seconds...`);
			
			// Wait for the delay time, then retry
			await new Promise(resolve => setTimeout(resolve, delay));
			
			// Retry the operation with increased delay (exponential backoff)
			return saveBatchWithBackoff(batch, retries - 1, delay * 2);
			
		} else {
			console.error(`Failed to save batch after multiple retries:`, error);
			throw error; // Re-throw the error after retries are exhausted
		}
	}
}

// Batching for large dataset
async function batchSave(records, chunkSize = 100) {
	const recordArray = Object.values(records)

	for (let i = 0; i < recordArray.length; i += chunkSize) {
		const batch = recordArray.slice(i, i + chunkSize); // Create a chunk of records
		
		// Save the chunked batch with backoff
		await saveBatchWithBackoff(batch);
	}
}

(async function readAndProcessFile() {
	// Step 1: Read and parse the JSON file into a JavaScript object
	const records = Object.values(JSON.parse(await fs.readFile('records.json', 'utf8')).items);

	// Step 2: The last level of hierarchicalCategories should match categories
	// so if it does, we can remove it to avoid redundancy as Algolia can handle the hierarchy
	records.forEach((record, index )=> {
		const cats = record.categories
		const hcats = record.hierarchicalCategories;
		const hcat = Object.values(hcats).pop().split(' > ');

		if (JSON.stringify(cats) === JSON.stringify(hcat)) {
			const { hierarchicalCategories, ...newRecord } = record;
			records[index] = newRecord
		} else {
			console.log('Discrepancy in categories and hierarchicalCategories', record);
		}
	});

	// Step 3: Process the records in chunks (batch size of 100)
	await batchSave(records, 100); // Adjust chunk size as needed

	// Do a test search for "pogo"
	const { results } = await client.search({
		requests: [{
			indexName,
			query: "pogo",
		},],
	});

	console.log(JSON.stringify(results));
})();