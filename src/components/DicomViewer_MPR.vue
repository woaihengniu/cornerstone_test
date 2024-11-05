<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { ElMessageBox } from 'element-plus';
import { RenderingEngine, Enums, volumeLoader, setVolumesForViewports, getRenderingEngine, utilities, eventTarget, EVENTS } from '@cornerstonejs/core'
import * as cornerstoneTools from '@cornerstonejs/tools';
import initcornerstone from '../cornerstoneinit/initcornerstone.js'
const { ViewportType } = Enums;
const { addTool, destroy, ToolGroupManager, Enums: csToolsEnums, CrosshairsTool, ZoomTool, StackScrollTool } = cornerstoneTools;
const { MouseBindings } = csToolsEnums;
//判断是移动端还是web端
const isMobile = window.matchMedia('(any-pointer:coarse)').matches;
console.log(isMobile, 'isMobile');

//获取页面高度和宽度 
const diff = ref(10);
const height = ref(window.innerHeight - diff.value);
const width = ref(window.innerWidth - diff.value);


//当为移动端时，设置页面样式
const elemet1Style = reactive({
    width: width.value + 'px',
    height: (height.value / 2) + 'px',

});
const elemet2Style = reactive({
    width: (width.value / 2) + 'px',
    height: (height.value / 2) + 'px',

});
const elemet3Style = reactive({
    width: (width.value / 2) + 'px',
    height: (height.value / 2) + 'px',

});
//初始化默认值
const volumeName = ref('CT_VOLUME_ID');
const volumeLoaderScheme = ref('cornerstoneStreamingImageVolume');
const volumeId = `${volumeLoaderScheme.value}:${volumeName.value}`;
const toolGroupId = ref('MY_TOOLGROUP_ID');
const viewportId1 = ref('CT_AXIAL');
const viewportId2 = ref('CT_SAGITTAL');
const viewportId3 = ref('CT_CORONAL');
const viewportIds = [viewportId1.value, viewportId2.value, viewportId3.value];
const renderingEngineId = 'myRenderingEngine';
//const synchronizerId = 'SLAB_THICKNESS_SYNCHRONIZER_ID';
let element1 = null;
let element2 = null;
let element3 = null;
let renderingEngine = null;
let viewport_orientation = [Enums.OrientationAxis.AXIAL, Enums.OrientationAxis.SAGITTAL, Enums.OrientationAxis.CORONAL]
//窗宽窗位
const ww = ref('');
const wc = ref('');
let volume = null;
const imageIds = ref([]);
async function loadDcm () {
    await initcornerstone();
    // try {
    hideLoadingContainer();
    let dcm1_container = document.getElementById('dcm1');
    let dcm2_container = document.getElementById('dcm2');
    let dcm3_container = document.getElementById('dcm3');
    element1 = document.createElement('div');
    element2 = document.createElement('div');
    element3 = document.createElement('div');
    element1.style.width = elemet1Style.width;
    element1.style.height = elemet1Style.height;
    element2.style.width = elemet2Style.width;
    element2.style.height = elemet2Style.height;
    element3.style.width = elemet3Style.width;
    element3.style.height = elemet3Style.height;

    element1.oncontextmenu = (e) => e.preventDefault();
    element2.oncontextmenu = (e) => e.preventDefault();
    element3.oncontextmenu = (e) => e.preventDefault();
    dcm1_container.appendChild(element1);
    dcm2_container.appendChild(element2);
    dcm3_container.appendChild(element3);
    //创建一个渲染引擎=>renderingEngine
    renderingEngine = new RenderingEngine(renderingEngineId);
    //创建并缓存一个Volume=>volume
    volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds: imageIds.value,
    });
    //渲染引擎中创建并加载视图=>viewports
    const viewportInputArray = [
        {
            viewportId: viewportId1.value,
            element: element1,
            type: ViewportType.ORTHOGRAPHIC,
            defaultOptions: {
                orientation: viewport_orientation[0],
            },
        },
        {
            viewportId: viewportId2.value,
            element: element2,
            type: ViewportType.ORTHOGRAPHIC,
            defaultOptions: {
                orientation: viewport_orientation[1],
            },
        },
        {
            viewportId: viewportId3.value,
            element: element3,
            type: ViewportType.ORTHOGRAPHIC,
            defaultOptions: {
                orientation: viewport_orientation[2],
            },
        },
    ];
    renderingEngine.setViewports(viewportInputArray);
    // 加载Volume => 注意：创建是创建，加载是加载，加载时才会去请求Dicom文件
    await volume.load();
    //在视图上设置volume
    await setVolumesForViewports(
        renderingEngine,
        [{ volumeId }],
        viewportIds, true

    )
    // 渲染图像
    renderingEngine.renderViewports(viewportIds);
    // 添加工具
    addTools();
    //设置窗宽窗位
    if (ww.value != '' && wc.value != '') {
        let renderingEngine_get = getRenderingEngine(renderingEngineId);
        renderingEngine_get.getViewports().forEach(viewport => {
            //设置左右上下颠倒颜色反色
            // const { flipHorizontal, flipVertical } = viewport.getCamera();
            // viewport.setCamera({ flipHorizontal: !flipHorizontal, flipVertical: !flipVertical });
            // const { invert } = viewport.getProperties();
            // viewport.setProperties({ invert: !invert }, volumeId);
            const { lower, upper } = utilities.windowLevel.toLowHighRange(parseInt(ww.value), parseInt(wc.value));
            viewport.setProperties({
                voiRange: {
                    lower,
                    upper,
                },
            });
            viewport.render();
        });
    }
    //  } catch (error) {
    hideLoadingContainer();
    //  console.error(error);
    //cancelLoading();
    //showErrorMessage('该序列不支持MPR重建,请选择其他序列');
    //  }
}


//交叉线样式
const viewportColors = {
    [viewportId1.value]: 'rgb(200, 0, 0)',
    [viewportId2.value]: 'rgb(200, 200, 0)',
    [viewportId3.value]: 'rgb(0, 200, 0)',
};
const viewportReferenceLineControllable = [
    viewportId1.value,
    viewportId2.value,
    viewportId3.value,
];

const viewportReferenceLineDraggableRotatable = [
    viewportId1.value,
    viewportId2.value,
    viewportId3.value,
];

const viewportReferenceLineSlabThicknessControlsOn = [
    viewportId1.value,
    viewportId2.value,
    viewportId3.value,
];
function getReferenceLineColor (viewportId) {
    return viewportColors[viewportId];
}

function getReferenceLineControllable (viewportId) {
    const index = viewportReferenceLineControllable.indexOf(viewportId);
    return index !== -1;
}

function getReferenceLineDraggableRotatable (viewportId) {
    const index = viewportReferenceLineDraggableRotatable.indexOf(viewportId);
    return index !== -1;
}

function getReferenceLineSlabThicknessControlsOn (viewportId) {
    const index =
        viewportReferenceLineSlabThicknessControlsOn.indexOf(viewportId);
    return index !== -1;
}
//添加工具
function addTools () {
    const toolGroup = ToolGroupManager.createToolGroup(toolGroupId.value);
    //  顶层API全局添加
    addTool(CrosshairsTool);
    // 创建工具组，在工具组添加
    //添加Crosshairs
    toolGroup.addTool(CrosshairsTool.toolName, {
        getReferenceLineColor,
        getReferenceLineControllable,
        getReferenceLineDraggableRotatable,
        getReferenceLineSlabThicknessControlsOn,
        mobile: {
            enabled: isMobile,
            opacity: 0.8,
            handleRadius: 9,
        },
    });
    //添加鼠标滚轮滚动工具
    addTool(StackScrollTool);
    toolGroup.addTool(StackScrollTool.toolName);
    //添加缩放工具
    addTool(ZoomTool);
    toolGroup.addTool(ZoomTool.toolName);
    // 将工具组与视图绑定
    toolGroup.addViewport(viewportId1.value, renderingEngineId);
    toolGroup.addViewport(viewportId2.value, renderingEngineId);
    toolGroup.addViewport(viewportId3.value, renderingEngineId);
    toolGroup.setToolActive(CrosshairsTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary, }]
    });
    //激活滚动图像操作手势
    toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Wheel }]
    })
    //激活缩放工具
    toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Secondary }]
    })
}
//进度条
const showProgressContent = ref(true);
const progress = ref(0);
//let temp1 = ['wadouri:http://60.205.216.219:8057/20211227\\00250196.img', 'wadouri:http://60.205.216.219:8057/20211227\\00250197.img', 'wadouri:http://60.205.216.219:8057/20211227\\00250198.img', 'wadouri:http://60.205.216.219:8057/20211227\\00250199.img', 'wadouri:http://60.205.216.219:8057/20211227\\0025019A.img', 'wadouri:http://60.205.216.219:8057/20211227\\0025019B.img', 'wadouri:http://60.205.216.219:8057/20211227\\0025019C.img', 'wadouri:http://60.205.216.219:8057/20211227\\0025019D.img', 'wadouri:http://60.205.216.219:8057/20211227\\0025019E.img', 'wadouri:http://60.205.216.219:8057/20211227\\0025019F.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A0.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A1.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A2.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A3.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A4.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A5.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A6.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A7.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A8.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501A9.img']
//let temp1 = ['wadouri:http://60.205.216.219:8057/20211227\\002501AA.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501AB.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501AC.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501AD.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501AE.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501AF.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B0.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B1.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B2.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B3.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B4.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B5.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B6.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B7.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B8.img', 'wadouri:http://60.205.216.219:8057/20211227\\002501B9.img']
//let temp1 = ['wadouri:http://60.205.216.219:82/20230118\\0029B45D.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B45E.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B45F.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B460.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B461.img', 'wadouri:http://60.205.216.219:82/20230118\\0029B462.img']
let temp1 = ["wadouri:http://60.205.216.219:82/20230118\\0029B831.img", "wadouri:http://60.205.216.219:82/20230118\\0029B832.img", "wadouri:http://60.205.216.219:82/20230118\\0029B833.img", "wadouri:http://60.205.216.219:82/20230118\\0029B834.img", "wadouri:http://60.205.216.219:82/20230118\\0029B835.img", "wadouri:http://60.205.216.219:82/20230118\\0029B836.img", "wadouri:http://60.205.216.219:82/20230118\\0029B837.img", "wadouri:http://60.205.216.219:82/20230118\\0029B838.img", "wadouri:http://60.205.216.219:82/20230118\\0029B839.img", "wadouri:http://60.205.216.219:82/20230118\\0029B83A.img", "wadouri:http://60.205.216.219:82/20230118\\0029B83B.img", "wadouri:http://60.205.216.219:82/20230118\\0029B83C.img", "wadouri:http://60.205.216.219:82/20230118\\0029B83D.img", "wadouri:http://60.205.216.219:82/20230118\\0029B83E.img", "wadouri:http://60.205.216.219:82/20230118\\0029B83F.img", "wadouri:http://60.205.216.219:82/20230118\\0029B840.img", "wadouri:http://60.205.216.219:82/20230118\\0029B841.img", "wadouri:http://60.205.216.219:82/20230118\\0029B842.img", "wadouri:http://60.205.216.219:82/20230118\\0029B843.img", "wadouri:http://60.205.216.219:82/20230118\\0029B844.img", "wadouri:http://60.205.216.219:82/20230118\\0029B845.img", "wadouri:http://60.205.216.219:82/20230118\\0029B846.img", "wadouri:http://60.205.216.219:82/20230118\\0029B847.img", "wadouri:http://60.205.216.219:82/20230118\\0029B848.img", "wadouri:http://60.205.216.219:82/20230118\\0029B849.img", "wadouri:http://60.205.216.219:82/20230118\\0029B84A.img", "wadouri:http://60.205.216.219:82/20230118\\0029B84B.img", "wadouri:http://60.205.216.219:82/20230118\\0029B84C.img", "wadouri:http://60.205.216.219:82/20230118\\0029B84D.img", "wadouri:http://60.205.216.219:82/20230118\\0029B84E.img", "wadouri:http://60.205.216.219:82/20230118\\0029B84F.img", "wadouri:http://60.205.216.219:82/20230118\\0029B850.img", "wadouri:http://60.205.216.219:82/20230118\\0029B851.img", "wadouri:http://60.205.216.219:82/20230118\\0029B852.img", "wadouri:http://60.205.216.219:82/20230118\\0029B853.img", "wadouri:http://60.205.216.219:82/20230118\\0029B854.img", "wadouri:http://60.205.216.219:82/20230118\\0029B855.img", "wadouri:http://60.205.216.219:82/20230118\\0029B856.img", "wadouri:http://60.205.216.219:82/20230118\\0029B857.img", "wadouri:http://60.205.216.219:82/20230118\\0029B858.img", "wadouri:http://60.205.216.219:82/20230118\\0029B859.img", "wadouri:http://60.205.216.219:82/20230118\\0029B85A.img", "wadouri:http://60.205.216.219:82/20230118\\0029B85B.img", "wadouri:http://60.205.216.219:82/20230118\\0029B85C.img", "wadouri:http://60.205.216.219:82/20230118\\0029B85D.img", "wadouri:http://60.205.216.219:82/20230118\\0029B85E.img", "wadouri:http://60.205.216.219:82/20230118\\0029B85F.img", "wadouri:http://60.205.216.219:82/20230118\\0029B860.img", "wadouri:http://60.205.216.219:82/20230118\\0029B861.img", "wadouri:http://60.205.216.219:82/20230118\\0029B862.img", "wadouri:http://60.205.216.219:82/20230118\\0029B863.img", "wadouri:http://60.205.216.219:82/20230118\\0029B864.img", "wadouri:http://60.205.216.219:82/20230118\\0029B865.img", "wadouri:http://60.205.216.219:82/20230118\\0029B866.img"]
//let temp1 = ["wadouri:http://60.205.216.219:8057/20230118\\0029B831.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B832.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B833.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B834.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B835.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B836.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B837.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B838.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B839.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B83A.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B83B.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B83C.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B83D.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B83E.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B83F.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B840.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B841.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B842.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B843.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B844.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B845.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B846.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B847.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B848.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B849.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B84A.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B84B.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B84C.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B84D.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B84E.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B84F.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B850.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B851.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B852.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B853.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B854.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B855.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B856.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B857.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B858.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B859.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B85A.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B85B.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B85C.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B85D.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B85E.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B85F.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B860.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B861.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B862.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B863.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B864.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B865.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B866.img"]
//let temp1 = ["wadouri:http://60.205.216.219:8057/20230118\\0029B572.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B573.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B574.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B575.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B576.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B577.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B578.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B579.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B57A.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B57B.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B57C.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B57D.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B57E.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B57F.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B580.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B581.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B582.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B583.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B584.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B585.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B586.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B587.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B588.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B589.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B58A.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B58B.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B58C.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B58D.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B58E.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B58F.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B590.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B591.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B592.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B593.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B594.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B595.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B596.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B597.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B598.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B599.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B59A.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B59B.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B59C.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B59D.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B59E.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B59F.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A0.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A1.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A2.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A3.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A4.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A5.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A6.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A7.img"]
//let temp1 = ["wadouri:http://60.205.216.219:8057/20230118\\0029B5A8.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5A9.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5AA.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5AB.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5AC.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5AD.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5AE.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5AF.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B0.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B1.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B2.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B3.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B4.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B5.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B6.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B7.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B8.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5B9.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5BA.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5BB.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5BC.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5BD.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5BE.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5BF.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C0.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C1.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C2.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C3.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C4.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C5.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C6.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C7.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C8.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5C9.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5CA.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5CB.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5CC.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5CD.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5CE.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5CF.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D0.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D1.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D2.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D3.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D4.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D5.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D6.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D7.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D8.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5D9.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5DA.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5DB.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5DC.img", "wadouri:http://60.205.216.219:8057/20230118\\0029B5DD.img"]
//let temp1 = ["wadouri:http://60.205.216.219:8057/20100406\\001F8EE7.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EE8.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EE9.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EEA.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EEB.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EEC.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EED.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EEE.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EEF.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF0.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF1.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF2.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF3.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF4.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF5.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF6.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF7.img", "wadouri:http://60.205.216.219:8057/20100406\\001F8EF8.img"]
//let temp1 = ["wadouri:http://60.205.216.219:8057/20240604\\0029D1A7.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1A8.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1A9.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1AA.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1AB.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1AC.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1AD.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1AE.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1AF.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1B0.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1B1.img"]
//let temp1 = ["wadouri:http://60.205.216.219:8057/20240604\\0029D1E9.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1EA.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1EB.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1EC.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1ED.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1EE.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1EF.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F0.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F1.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F2.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F3.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F4.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F5.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F6.img", "wadouri:http://60.205.216.219:8057/20240604\\0029D1F7.img"]
//let temp1 = ["wadouri:http://60.205.216.219:8025/20240604\\0029D1E9.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1EA.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1EB.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1EC.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1ED.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1EE.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1EF.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F0.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F1.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F2.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F3.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F4.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F5.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F6.img", "wadouri:http://60.205.216.219:8025/20240604\\0029D1F7.img"]
//let temp1 = ["wadouri:http://60.205.216.219:82/20240604\\0029D1E9.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1EA.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1EB.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1EC.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1ED.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1EE.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1EF.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F0.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F1.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F2.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F3.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F4.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F5.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F6.img", "wadouri:http://60.205.216.219:82/20240604\\0029D1F7.img"]
//let temp1 = ['wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250196_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250197_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250198_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250199_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019A_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019B_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019C_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019D_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019E_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019F_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A0_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A1_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A2_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A3_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A4_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A5_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A6_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A7_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A8_lossless.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A9_lossless.img']
//let temp1 = ['wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250196_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250197_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250198_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/00250199_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019A_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019B_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019C_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019D_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019E_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/0025019F_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A0_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A1_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A2_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A3_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A4_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A5_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A6_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A7_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A8_lossy.img', 'wadouri:http://192.168.1.244:8285/path/image/DataPool/lossless/002501A9_lossy.img']
//let temp1 = ["wadouri:http://60.205.216.219:82/20230118\\0029B572.img", "wadouri:http://60.205.216.219:82/20230118\\0029B573.img", "wadouri:http://60.205.216.219:82/20230118\\0029B574.img", "wadouri:http://60.205.216.219:82/20230118\\0029B575.img", "wadouri:http://60.205.216.219:82/20230118\\0029B576.img", "wadouri:http://60.205.216.219:82/20230118\\0029B577.img", "wadouri:http://60.205.216.219:82/20230118\\0029B578.img", "wadouri:http://60.205.216.219:82/20230118\\0029B579.img", "wadouri:http://60.205.216.219:82/20230118\\0029B57A.img", "wadouri:http://60.205.216.219:82/20230118\\0029B57B.img", "wadouri:http://60.205.216.219:82/20230118\\0029B57C.img", "wadouri:http://60.205.216.219:82/20230118\\0029B57D.img", "wadouri:http://60.205.216.219:82/20230118\\0029B57E.img", "wadouri:http://60.205.216.219:82/20230118\\0029B57F.img", "wadouri:http://60.205.216.219:82/20230118\\0029B580.img", "wadouri:http://60.205.216.219:82/20230118\\0029B581.img", "wadouri:http://60.205.216.219:82/20230118\\0029B582.img", "wadouri:http://60.205.216.219:82/20230118\\0029B583.img", "wadouri:http://60.205.216.219:82/20230118\\0029B584.img", "wadouri:http://60.205.216.219:82/20230118\\0029B585.img", "wadouri:http://60.205.216.219:82/20230118\\0029B586.img", "wadouri:http://60.205.216.219:82/20230118\\0029B587.img", "wadouri:http://60.205.216.219:82/20230118\\0029B588.img", "wadouri:http://60.205.216.219:82/20230118\\0029B589.img", "wadouri:http://60.205.216.219:82/20230118\\0029B58A.img", "wadouri:http://60.205.216.219:82/20230118\\0029B58B.img", "wadouri:http://60.205.216.219:82/20230118\\0029B58C.img", "wadouri:http://60.205.216.219:82/20230118\\0029B58D.img", "wadouri:http://60.205.216.219:82/20230118\\0029B58E.img", "wadouri:http://60.205.216.219:82/20230118\\0029B58F.img", "wadouri:http://60.205.216.219:82/20230118\\0029B590.img", "wadouri:http://60.205.216.219:82/20230118\\0029B591.img", "wadouri:http://60.205.216.219:82/20230118\\0029B592.img", "wadouri:http://60.205.216.219:82/20230118\\0029B593.img", "wadouri:http://60.205.216.219:82/20230118\\0029B594.img", "wadouri:http://60.205.216.219:82/20230118\\0029B595.img", "wadouri:http://60.205.216.219:82/20230118\\0029B596.img", "wadouri:http://60.205.216.219:82/20230118\\0029B597.img", "wadouri:http://60.205.216.219:82/20230118\\0029B598.img", "wadouri:http://60.205.216.219:82/20230118\\0029B599.img", "wadouri:http://60.205.216.219:82/20230118\\0029B59A.img", "wadouri:http://60.205.216.219:82/20230118\\0029B59B.img", "wadouri:http://60.205.216.219:82/20230118\\0029B59C.img", "wadouri:http://60.205.216.219:82/20230118\\0029B59D.img", "wadouri:http://60.205.216.219:82/20230118\\0029B59E.img", "wadouri:http://60.205.216.219:82/20230118\\0029B59F.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A0.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A1.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A2.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A3.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A4.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A5.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A6.img", "wadouri:http://60.205.216.219:82/20230118\\0029B5A7.img"]

//let temp1 = ["wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1A7.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1A8.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1A9.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1AA.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1AB.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1AC.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1AD.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1AE.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1AF.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1B0.dcm", "wadouri:http://192.168.1.244:8285/path/image/DataPool/deltag/0029D1B1.dcm"]
onMounted(() => {
    //获取序列
    localStorage.setItem("ser1", JSON.stringify(temp1));
    let ser1 = JSON.parse(localStorage.getItem("ser1"));
    if (ser1 == null || ser1 == undefined || ser1.length == 0) {
        showErrorMessage('请选择序列');
        return;
    }
    if (ser1.length < 2) {
        showErrorMessage('该序列层数过少，无法进行MPR重建，请选择其他序列')
        return;
    }
    imageIds.value.push(...ser1);
    //获取窗宽窗位
    let localWW = localStorage.getItem('localWW');
    if (localWW != null && localWW != '') {
        ww.value = localWW;
    }
    let localWC = localStorage.getItem('localWC');
    if (localWC != null && localWC != '') {
        wc.value = localWC;
    }
    window.addEventListener('resize', windowResize);
    //监听图像加载进度
    let loadIndex = 0;
    eventTarget.addEventListener(EVENTS.IMAGE_VOLUME_MODIFIED, () => {
        if (loadIndex == 0) {
            hideLoadingContainer();
        }
        loadIndex++;
        progress.value = parseInt(loadIndex / imageIds.value.length * 100);
    })

    eventTarget.addEventListener(EVENTS.IMAGE_VOLUME_LOADING_COMPLETED, (e) => {
        showProgressContent.value = false;
        console.log(e)
    })
    eventTarget.addEventListener(EVENTS.VOLUME_LOADED_FAILED, (event) => {

        console.log(event, '');
    })

    loadDcm();
})
//页面发生错误后弹出提示
// const isLayer = ref(false);
// window.onerror = function (message, source, lineno, colno, error) {
//     console.error(message, source, lineno, colno, error);
//     hideLoadingContainer();
//     isLayer.value = true;
//     // 这里可以添加额外的处理逻辑，例如记录日志、通知开发者等
//     if (isLayer.value) {
//         cancelLoading();
//         showErrorMessage('该序列不支持MPR重建,请选择其他序列');
//     }
// };
onUnmounted(() => {
    cancelLoading();
    // 销毁工具组
    destroy();
    // 清理渲染引擎
    renderingEngine.destroy();
    window.removeEventListener('resize', windowResize);

})
//监听高度变化
watch(height, () => {
    elemet1Style.height = (height.value / 2) + 'px';
    elemet2Style.height = (height.value / 2) + 'px';
    elemet2Style.height = (height.value / 2) + 'px';
    element1.style.height = elemet1Style.height;
    element2.style.height = elemet2Style.height;
    element3.style.height = elemet3Style.height;
});

//浏览器高度变化时
const windowResize = () => {
    height.value = window.innerHeight - diff.value;
    width.value = window.innerWidth - diff.value;
    let renderingEngine_get = getRenderingEngine(renderingEngineId);
    renderingEngine_get.resize(true, true);
}

//移动端中间旋转按钮
const changePosition = () => {
    let renderingEngine_get = getRenderingEngine(renderingEngineId);
    let viewports = renderingEngine_get.getViewports();
    viewport_orientation.push(viewport_orientation.shift());
    viewports[0].setOrientation(viewport_orientation[0]);
    viewports[1].setOrientation(viewport_orientation[1]);
    viewports[2].setOrientation(viewport_orientation[2]);
    renderingEngine_get.renderViewports(viewportIds);
}
//重置按钮
const reset = () => {
    let renderingEngine_get = getRenderingEngine(renderingEngineId);
    let viewports = renderingEngine_get.getViewports();
    viewports[0].setOrientation(viewport_orientation[0]);
    viewports[1].setOrientation(viewport_orientation[1]);
    viewports[2].setOrientation(viewport_orientation[2]);
    renderingEngine_get.renderViewports(viewportIds);
}

//隐藏页面加载时的loading
const hideLoadingContainer = () => {
    document.getElementById("loadingContainer").style.display = 'none';
}

//提示信息
const showErrorMessage = (message) => {
    ElMessageBox.alert(message, {
        center: true,
        showClose: false,
        autofocus: false,
        confirmButtonText: '返回',
    }).then(() => {
        window.parent.$('#modalMPR').modal('hide');
    });
}

//取消正在下载的图像
const cancelLoading = () => {
    if (volume != null) {
        volume.cancelLoading();
    }
}

</script>

<template>
    <div id="container">
        <div id="dcm1" :style="elemet1Style"></div>
        <div id="dcm2" :style="elemet2Style"></div>
        <div id="dcm3" :style="elemet3Style"></div>
    </div>
    <img v-show="imageIds.length > 0 && !showProgressContent" class="changePosition" src="../images/zhuanMPR.png"
        title="切换位置" @click="changePosition()" />
    <img v-show="imageIds.length > 0 && !showProgressContent" class="reset" src="../images/reset.png" title="重置"
        @click="reset()" />
    <!-- 进入条 -->
    <el-progress v-show="showProgressContent" color="#5cb85c" :striped="true" :striped-flow="true" :show-text="false"
        :indeterminate="true" :percentage="progress" :style="{ 'position': 'absolute', 'top': '0px', width: '100%' }">
    </el-progress>
</template>

<style scoped>
#container {
    background-color: black;
    overflow: hidden;
}

#dcm1,
#dcm2,
#dcm3 {
    background-color: black;
    overflow: hidden;
    margin: auto;
}

#dcm2,
#dcm3 {
    background-color: black;
    display: inline-block;
    overflow: hidden;
    margin-left: 2px;
}

.changePosition {
    position: absolute;
    top: calc(50% - 7.5px);
    right: calc(50% - 12px);
    cursor: pointer;
    width: 25px;
    background-color: #378985;
    border-radius: 5px;
}

.reset {
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;
    width: 25px;
}

.percentage-value {
    display: block;
    margin-top: 10px;
    font-size: 24px;
    color: white;
}

.percentage-label {
    display: block;
    margin-top: 10px;
    font-size: 12px;
    color: white;
}
</style>
