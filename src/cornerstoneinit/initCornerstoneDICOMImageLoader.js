import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
window.cornerstone = cornerstone;
window.cornerstoneTools = cornerstoneTools;

export default function initCornerstoneDICOMImageLoader() {
  cornerstoneDICOMImageLoader.init({
    maxWebWorkers: 1,
  });
}
