<script setup>
import { RenderingEngine, Enums, volumeLoader, setVolumesForViewports } from '@cornerstonejs/core'
import initcornerstone from '../cornerstoneinit/initcornerstone.js'
const { ViewportType } = Enums;
let imageIds =  ['wadouri:http://60.205.216.219:82/20230118\\0029B45D.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B45E.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B45F.img',
                 'wadouri:http://60.205.216.219:82/20230118\\0029B460.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B461.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B462.img']
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
