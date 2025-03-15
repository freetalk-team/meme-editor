let net;

async function loadTensorflow() {
	if (!net) {
		net = await bodyPix.load({
			architecture: 'MobileNetV1',
			// architecture: 'ResNet50',
			outputStride: 16,
			multiplier: 0.75,
			// multiplier: 1, // For resnet50
			quantBytes: 2
		});

		// maskCanvas = document.createElement('canvas');
		// maskCtx = maskCanvas.getContext('2d');
	}
}

/**
 * Function to isolate the mask for a single person from the segmentation results.
 * @param {Object} segmentation - The segmentation result from BodyPix.
 * @param {number} personIndex - The index of the person to isolate (e.g., 0 for the first person).
 * @returns {ImageData} - The mask for the isolated person.
 */
function isolateSinglePersonMask(segmentation, personIndex) {
	const { width, height, data } = segmentation;

	// Create a new mask for the isolated person
	const isolatedMask = new ImageData(width, height);

	// Iterate through the segmentation data
	for (let i = 0; i < data.length; i++) {
		// Check if the pixel belongs to the specified person
		if (data[i] === personIndex + 1) { // BodyPix uses 1-based indexing for people
			isolatedMask.data[i * 4] = 255; // Set red channel
			isolatedMask.data[i * 4 + 1] = 255; // Set green channel
			isolatedMask.data[i * 4 + 2] = 255; // Set blue channel
			isolatedMask.data[i * 4 + 3] = 255; // Set alpha channel
		} else {
			isolatedMask.data[i * 4 + 3] = 0; // Set alpha to 0 for other pixels
		}
	}

	return isolatedMask;
}

export async function detectBody(image, threshold=0.7) {
	await loadTensorflow();

	const segmentation = await net.segmentPerson(image, {
		flipHorizontal: false,
		// internalResolution: 'medium',
		internalResolution: 0.75,
		segmentationThreshold: threshold
	});

	const mask = bodyPix.toMask(segmentation);

	return mask;
}