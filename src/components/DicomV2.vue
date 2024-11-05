<script setup>
import { RenderingEngine, Enums, volumeLoader, setVolumesForViewports } from '@cornerstonejs/core'
import initcornerstone from '../cornerstoneinit/initcornerstone.js'
const { ViewportType } = Enums;
let imageIds =  ['wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250196_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250197_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250198_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250199_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019A_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019B_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019C_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019D_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019E_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019F_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A0_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A1_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A2_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A3_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A4_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A5_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A6_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A7_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A8_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A9_lossy.img']
async function load () {
    await initcornerstone();
    const content = document.getElementById('content');
    const element = document.createElement('div');
    element.style.width = '500px';
    element.style.height = '500px';
    content.appendChild(element);

    const renderingEngineId = 'myRenderingEngine';
    const renderingEngine = new RenderingEngine(renderingEngineId);

    const volumeName = 'CT_VOLUME_ID';
    const volumeLoaderScheme = 'cornerstoneStreamingImageVolume';
    const volumeId = `${volumeLoaderScheme}:${volumeName}`;
    const viewportId = 'CT_AXIAL';

    const viewportInput = [{
        viewportId,
        type: ViewportType.ORTHOGRAPHIC,
        element,
        defaultOptions: {
            orientation: Enums.OrientationAxis.AXIAL,
        },
    }];
    renderingEngine.setViewports(viewportInput);

    const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds,
    });
    volume.load();
    setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId]);
    renderingEngine.renderViewports([viewportId]);
}


load();

</script>

<template>
    <div id="content"></div>
</template>

<style scoped>
#content {
    width: 500px;
    height: 500px;
    border: 1px solid red;
}
</style>
